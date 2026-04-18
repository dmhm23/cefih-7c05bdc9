/**
 * Servicio SAFA del Portal Estudiante para envío de formatos dinámicos.
 *
 * `enviarFormatoDinamico` delega:
 *   - El upsert de `formato_respuestas` y la emisión del evento
 *     `respuesta.completed` al `formatosGateway` (Fase B/2025-04).
 *   - La cascada de firmas a `firmaCascadeListener` (suscrito al evento
 *     `respuesta.completed`).
 *   - El upsert de `documentos_portal` (estado del portal estudiante)
 *     se mantiene aquí porque es estado del host, no del módulo.
 *
 * Mantiene helpers de lectura (`getFormatoById`, `getFirmasMatricula`,
 * `resolveReusableSignature`) usados por los renderers.
 */
import { supabase } from '@/integrations/supabase/client';
import { firmaMatriculaService } from '@/services/firmaMatriculaService';
import { formatosGateway } from '@/modules/formatos';
import type { FirmaMatricula } from './types';

export interface EnviarFormatoDinamicoParams {
  matriculaId: string;
  formatoId: string;
  documentoKey: string;
  answers: Record<string, unknown>;
  firmaPayload?: {
    firmaBase64: string;
    tipoFirmante: 'aprendiz' | 'entrenador' | 'supervisor';
    esOrigenFirma: boolean;
  };
}

export const portalDinamicoService = {
  async enviarFormatoDinamico(params: EnviarFormatoDinamicoParams): Promise<void> {
    const { matriculaId, formatoId, documentoKey, answers, firmaPayload } = params;
    const now = new Date().toISOString();

    // 1) Persistir la respuesta vía gateway (emite respuesta.completed →
    //    el firmaCascadeListener se encarga de la cascada de firmas).
    await formatosGateway.submitRespuesta(matriculaId, formatoId, answers, 'completado');

    // 2) Estado de portal del host (no es parte del módulo @formatos).
    const { error: dpError } = await supabase
      .from('documentos_portal')
      .upsert({
        matricula_id: matriculaId,
        documento_key: documentoKey,
        estado: 'completado',
        enviado_en: now,
        firma_data: firmaPayload?.firmaBase64 || null,
        metadata: answers as any,
      } as any, { onConflict: 'matricula_id,documento_key' });
    if (dpError) throw dpError;
  },

  async getFormatoById(formatoId: string) {
    const { data, error } = await supabase
      .from('formatos_formacion')
      .select('*')
      .eq('id', formatoId)
      .is('deleted_at', null)
      .single();
    if (error) throw error;
    return data;
  },

  async getFirmasMatricula(matriculaId: string): Promise<FirmaMatricula[]> {
    return firmaMatriculaService.getByMatricula(matriculaId);
  },

  resolveReusableSignature(
    firmas: FirmaMatricula[],
    tipoFirmante: 'aprendiz' | 'entrenador' | 'supervisor',
    formatoOrigenId?: string,
  ): FirmaMatricula | null {
    const eligible = firmas.filter((f) => f.tipo === tipoFirmante && f.autorizaReutilizacion);
    if (formatoOrigenId) {
      const exact = eligible.find((f) => f.formatoOrigenId === formatoOrigenId);
      if (exact) return exact;
    }
    if (eligible.length === 0) return null;
    return eligible.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
  },
};
