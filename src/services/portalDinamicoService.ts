import { supabase } from '@/integrations/supabase/client';
import { firmaMatriculaService } from './firmaMatriculaService';
import type { FirmaMatricula } from '@/types/formatoFormacion';

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
  /**
   * Envía un formato dinámico desde el portal del estudiante.
   * Persiste en formato_respuestas, documentos_portal, y opcionalmente firmas_matricula.
   */
  async enviarFormatoDinamico(params: EnviarFormatoDinamicoParams): Promise<void> {
    const { matriculaId, formatoId, documentoKey, answers, firmaPayload } = params;
    const now = new Date().toISOString();

    // 1. Upsert formato_respuestas
    const { error: frError } = await supabase
      .from('formato_respuestas')
      .upsert({
        matricula_id: matriculaId,
        formato_id: formatoId,
        estado: 'completado',
        answers: answers as any,
        completado_at: now,
      } as any, { onConflict: 'matricula_id,formato_id' });

    if (frError) throw frError;

    // 2. Upsert documentos_portal
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

    // 3. Persist firma if this format is a signature origin with explicit authorization
    if (firmaPayload && firmaPayload.esOrigenFirma) {
      await firmaMatriculaService.upsert({
        matriculaId,
        tipo: firmaPayload.tipoFirmante,
        firmaBase64: firmaPayload.firmaBase64,
        formatoOrigenId: formatoId,
        autorizaReutilizacion: true,
        ip: null,
        userAgent: navigator.userAgent || null,
      });
    }
  },

  /**
   * Loads a format by ID for the portal renderer.
   */
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

  /**
   * Loads all reusable signatures for an enrollment.
   */
  async getFirmasMatricula(matriculaId: string): Promise<FirmaMatricula[]> {
    return firmaMatriculaService.getByMatricula(matriculaId);
  },

  /**
   * Resolves a reusable signature based on dynamic rules.
   * Priority:
   * 1. Explicit formatoOrigenId match
   * 2. Most recent firma with autoriza_reutilizacion=true for the tipo_firmante
   */
  resolveReusableSignature(
    firmas: FirmaMatricula[],
    tipoFirmante: 'aprendiz' | 'entrenador' | 'supervisor',
    formatoOrigenId?: string,
  ): FirmaMatricula | null {
    const eligible = firmas.filter(f => f.tipo === tipoFirmante && f.autorizaReutilizacion);

    if (formatoOrigenId) {
      const exact = eligible.find(f => f.formatoOrigenId === formatoOrigenId);
      if (exact) return exact;
    }

    // Most recent
    if (eligible.length === 0) return null;
    return eligible.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  },
};
