import { supabase } from '@/integrations/supabase/client';
import type { SolicitudExcepcionCertificado } from '@/types/certificado';

function mapExcepcion(row: any): SolicitudExcepcionCertificado {
  return {
    id: row.id,
    matriculaId: row.matricula_id,
    solicitadoPor: row.solicitado_por,
    motivo: row.motivo,
    estado: row.estado,
    resueltoPor: row.resuelto_por ?? undefined,
    fechaSolicitud: row.fecha_solicitud,
    fechaResolucion: row.fecha_resolucion ?? undefined,
  };
}

export const excepcionCertificadoService = {
  async getAll(): Promise<SolicitudExcepcionCertificado[]> {
    const { data, error } = await supabase
      .from('excepciones_certificado')
      .select('*')
      .order('fecha_solicitud', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapExcepcion);
  },

  async getById(id: string): Promise<SolicitudExcepcionCertificado | undefined> {
    const { data, error } = await supabase
      .from('excepciones_certificado')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapExcepcion(data) : undefined;
  },

  async getByMatricula(matriculaId: string): Promise<SolicitudExcepcionCertificado[]> {
    const { data, error } = await supabase
      .from('excepciones_certificado')
      .select('*')
      .eq('matricula_id', matriculaId)
      .order('fecha_solicitud', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapExcepcion);
  },

  async solicitar(matriculaId: string, solicitadoPor: string, motivo: string): Promise<SolicitudExcepcionCertificado> {
    const { data, error } = await supabase
      .from('excepciones_certificado')
      .insert({
        matricula_id: matriculaId,
        solicitado_por: solicitadoPor,
        motivo,
      })
      .select()
      .single();
    if (error) throw error;
    return mapExcepcion(data);
  },

  async aprobar(id: string, resueltoPor: string): Promise<SolicitudExcepcionCertificado> {
    const { data, error } = await supabase
      .from('excepciones_certificado')
      .update({
        estado: 'aprobada',
        resuelto_por: resueltoPor,
        fecha_resolucion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapExcepcion(data);
  },

  async rechazar(id: string, resueltoPor: string): Promise<SolicitudExcepcionCertificado> {
    const { data, error } = await supabase
      .from('excepciones_certificado')
      .update({
        estado: 'rechazada',
        resuelto_por: resueltoPor,
        fecha_resolucion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapExcepcion(data);
  },
};
