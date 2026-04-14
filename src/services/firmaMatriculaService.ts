import { supabase } from '@/integrations/supabase/client';
import { handleSupabaseError, snakeToCamel } from './api';
import type { FirmaMatricula, TipoFirmaMatricula } from '@/types/formatoFormacion';

function rowToFirma(row: any): FirmaMatricula {
  return snakeToCamel<FirmaMatricula>(row);
}

export const firmaMatriculaService = {
  getByMatricula: async (matriculaId: string): Promise<FirmaMatricula[]> => {
    const { data, error } = await supabase
      .from('firmas_matricula' as any)
      .select('*')
      .eq('matricula_id', matriculaId);

    if (error) handleSupabaseError(error);
    return (data || []).map(rowToFirma);
  },

  getByMatriculaAndTipo: async (
    matriculaId: string,
    tipo: TipoFirmaMatricula
  ): Promise<FirmaMatricula | null> => {
    const { data, error } = await supabase
      .from('firmas_matricula' as any)
      .select('*')
      .eq('matricula_id', matriculaId)
      .eq('tipo', tipo)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data ? rowToFirma(data) : null;
  },

  upsert: async (params: {
    matriculaId: string;
    tipo: TipoFirmaMatricula;
    firmaBase64: string;
    formatoOrigenId?: string;
    autorizaReutilizacion?: boolean;
    ip?: string;
    userAgent?: string;
    hashIntegridad?: string;
  }): Promise<FirmaMatricula> => {
    const { data, error } = await supabase
      .from('firmas_matricula' as any)
      .upsert(
        {
          matricula_id: params.matriculaId,
          tipo: params.tipo,
          firma_base64: params.firmaBase64,
          formato_origen_id: params.formatoOrigenId || null,
          autoriza_reutilizacion: params.autorizaReutilizacion ?? false,
          ip: params.ip || null,
          user_agent: params.userAgent || null,
          hash_integridad: params.hashIntegridad || null,
        },
        { onConflict: 'matricula_id,tipo' }
      )
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToFirma(data);
  },
};
