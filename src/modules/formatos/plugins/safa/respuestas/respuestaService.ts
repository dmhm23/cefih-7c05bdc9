/**
 * Servicio de respuestas de formato (host SAFA).
 *
 * Vive dentro del módulo en `plugins/safa/respuestas` porque su estructura
 * (`matricula_id`, `formato_id`, etc.) y el flujo del estado son específicos
 * del dominio. Internamente se apoya en el `formatosGateway` cuando aplica.
 */
import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from '@/services/api';
import type { FormatoRespuesta } from '../types';

function rowToRespuesta(row: any): FormatoRespuesta {
  return {
    id: row.id,
    matriculaId: row.matricula_id,
    formatoId: row.formato_id,
    answers: row.answers || {},
    estado: row.estado,
    completadoAt: row.completado_at,
    reabiertoPor: row.reabierto_por,
    reabiertoAt: row.reabierto_at,
    intentosEvaluacion: row.intentos_evaluacion || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const formatoRespuestaService = {
  getByMatricula: async (matriculaId: string): Promise<FormatoRespuesta[]> => {
    const { data, error } = await supabase
      .from('formato_respuestas')
      .select('*')
      .eq('matricula_id', matriculaId);
    if (error) handleSupabaseError(error);
    return (data || []).map(rowToRespuesta);
  },

  getByMatriculaAndFormato: async (
    matriculaId: string,
    formatoId: string,
  ): Promise<FormatoRespuesta | null> => {
    const { data, error } = await supabase
      .from('formato_respuestas')
      .select('*')
      .eq('matricula_id', matriculaId)
      .eq('formato_id', formatoId)
      .maybeSingle();
    if (error) handleSupabaseError(error);
    return data ? rowToRespuesta(data) : null;
  },

  upsert: async (
    matriculaId: string,
    formatoId: string,
    answers: Record<string, unknown>,
    estado: 'pendiente' | 'completado' = 'pendiente',
    intentosEvaluacion?: Record<string, unknown>[],
  ): Promise<FormatoRespuesta> => {
    const payload: Record<string, unknown> = {
      matricula_id: matriculaId,
      formato_id: formatoId,
      answers: answers as any,
      estado,
      completado_at: estado === 'completado' ? new Date().toISOString() : null,
    };
    if (intentosEvaluacion !== undefined) {
      payload.intentos_evaluacion = intentosEvaluacion as any;
    }
    const { data, error } = await supabase
      .from('formato_respuestas')
      .upsert(payload as any, { onConflict: 'matricula_id,formato_id' })
      .select()
      .single();
    if (error) handleSupabaseError(error);
    return rowToRespuesta(data);
  },

  reopen: async (respuestaId: string, userId: string): Promise<FormatoRespuesta> => {
    const { data, error } = await supabase
      .from('formato_respuestas')
      .update({
        estado: 'reabierto' as any,
        reabierto_por: userId,
        reabierto_at: new Date().toISOString(),
      })
      .eq('id', respuestaId)
      .select()
      .single();
    if (error) handleSupabaseError(error);
    return rowToRespuesta(data);
  },
};
