import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError } from './api';
import type { FormatoRespuesta } from '@/types/formatoFormacion';

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
    formatoId: string
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
    estado: 'pendiente' | 'completado' = 'pendiente'
  ): Promise<FormatoRespuesta> => {
    const { data, error } = await supabase
      .from('formato_respuestas')
      .upsert(
        {
          matricula_id: matriculaId,
          formato_id: formatoId,
          answers: answers as any,
          estado,
          completado_at: estado === 'completado' ? new Date().toISOString() : null,
        },
        { onConflict: 'matricula_id,formato_id' }
      )
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
