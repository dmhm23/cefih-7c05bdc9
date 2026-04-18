/**
 * Listener SAFA: cascada de firmas.
 *
 * Reacciona al evento `respuesta.completed` cuando la respuesta contiene
 * una firma capturada (bloque `signature_capture` con `esOrigenFirma`) y:
 *   1) Persiste la firma en `firmas_matricula`.
 *   2) Genera respuestas automáticas (`formato_respuestas` con estado
 *      `completado`) para todos los formatos automáticos del mismo nivel
 *      que escuchan el evento `firma_completada`, inyectando la firma
 *      en sus bloques `signature_capture` y `attendance_by_day`.
 *
 * Antes esta lógica vivía imperativamente en `portalDinamicoService`.
 * Ahora es un side-effect del módulo: si alguien envía una respuesta
 * desde cualquier punto, la cascada se ejecuta automáticamente.
 */
import { supabase } from '@/integrations/supabase/client';
import { firmaMatriculaService } from '@/services/firmaMatriculaService';
import { formatosGateway } from '@/modules/formatos';

interface RespuestaCompletedPayload {
  subjectId: string;
  formatoId: string;
  answers: Record<string, unknown>;
}

interface SignatureMeta {
  base64: string;
  tipoFirmante: 'aprendiz' | 'entrenador' | 'supervisor';
}

/**
 * Inspecciona los bloques del formato origen y extrae la firma capturada
 * en bloques `signature_capture` que son origen de firma.
 */
async function extractCapturedSignature(
  formatoId: string,
  answers: Record<string, unknown>,
): Promise<SignatureMeta | null> {
  const { data, error } = await supabase
    .from('formatos_formacion')
    .select('bloques, es_origen_firma')
    .eq('id', formatoId)
    .maybeSingle();
  if (error || !data) return null;

  const bloques = (typeof data.bloques === 'string'
    ? JSON.parse(data.bloques)
    : data.bloques) as Array<{ id: string; type: string; props?: any }> | null;
  if (!Array.isArray(bloques)) return null;

  for (const b of bloques) {
    if (b.type !== 'signature_capture') continue;
    const value = answers[b.id];
    if (typeof value !== 'string' || !value.startsWith('data:image')) continue;
    const tipoFirmante = (b.props?.tipoFirmante as SignatureMeta['tipoFirmante']) || 'aprendiz';
    const isOrigin = (b.props?.esOrigenFirma ?? data.es_origen_firma) !== false;
    if (!isOrigin) continue;
    return { base64: value, tipoFirmante };
  }
  return null;
}

async function propagateSignatureToTargets(
  matriculaId: string,
  sourceFormatoId: string,
  signature: SignatureMeta,
): Promise<void> {
  const { data: matricula } = await supabase
    .from('matriculas')
    .select('nivel_formacion_id')
    .eq('id', matriculaId)
    .maybeSingle();
  const nivelId = matricula?.nivel_formacion_id ?? null;

  const { data: formatos, error } = await supabase
    .from('formatos_formacion')
    .select('id, bloques, eventos_disparadores, niveles_asignados')
    .eq('activo', true)
    .eq('es_automatico', true)
    .is('deleted_at', null)
    .neq('id', sourceFormatoId);
  if (error || !formatos) return;

  const targets = formatos.filter((f: any) => {
    const raw = f.eventos_disparadores;
    const eventos = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(eventos) || !eventos.includes('firma_completada')) return false;
    const niveles = f.niveles_asignados as string[] | null;
    if (niveles && niveles.length > 0 && nivelId && !niveles.includes(nivelId)) return false;
    return true;
  });

  for (const formato of targets) {
    const bloques = (typeof formato.bloques === 'string'
      ? JSON.parse(formato.bloques)
      : formato.bloques) as Array<{ id: string; type: string; props?: any }>;

    const answers: Record<string, unknown> = {};
    const sigBlock = bloques.find((b) => b.type === 'signature_capture');
    if (sigBlock) answers[sigBlock.id] = signature.base64;

    const attendanceBlocks = bloques.filter((b) => b.type === 'attendance_by_day');
    for (const att of attendanceBlocks) {
      const firmaMode = att.props?.firmaMode;
      if (firmaMode === 'reuse_if_available' || firmaMode === 'reuse_required') {
        answers[att.id] = { firmaHeredada: signature.base64 };
      }
    }

    await supabase
      .from('formato_respuestas')
      .upsert({
        matricula_id: matriculaId,
        formato_id: formato.id,
        estado: 'completado',
        answers: answers as any,
        completado_at: new Date().toISOString(),
      } as any, { onConflict: 'matricula_id,formato_id' });
  }
}

let registered = false;

export function registerFirmaCascadeListener() {
  if (registered) return;
  registered = true;

  formatosGateway.events.on(
    'respuesta.completed',
    async (event) => {
      const { subjectId, formatoId, answers } = event.payload as RespuestaCompletedPayload;
      try {
        const signature = await extractCapturedSignature(formatoId, answers);
        if (!signature) return;

        // 1) Persistir firma en firmas_matricula
        await firmaMatriculaService.upsert({
          matriculaId: subjectId,
          tipo: signature.tipoFirmante,
          firmaBase64: signature.base64,
          formatoOrigenId: formatoId,
          autorizaReutilizacion: true,
          ip: null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        });

        // 2) Emitir evento dedicado para integraciones futuras
        formatosGateway.events.emit('signature.captured', {
          subjectId,
          formatoId,
          tipo: signature.tipoFirmante,
          base64: signature.base64,
        });

        // 3) Propagar a formatos automáticos
        await propagateSignatureToTargets(subjectId, formatoId, signature);
      } catch (e) {
        console.warn('[firmaCascadeListener] Error procesando cascada:', e);
      }
    },
  );
}
