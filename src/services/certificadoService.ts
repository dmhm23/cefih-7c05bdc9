import { supabase } from '@/integrations/supabase/client';
import type { CertificadoGenerado, CertificadoFormData } from '@/types/certificado';
import { fetchAllPaginated } from './_paginated';

function mapCertificado(row: any): CertificadoGenerado {
  return {
    id: row.id,
    matriculaId: row.matricula_id,
    cursoId: row.curso_id,
    personaId: row.persona_id,
    plantillaId: row.plantilla_id,
    codigo: row.codigo,
    estado: row.estado,
    snapshotDatos: row.snapshot_datos || {},
    svgFinal: row.svg_final,
    version: row.version,
    fechaGeneracion: row.fecha_generacion,
    revocadoPor: row.revocado_por ?? undefined,
    motivoRevocacion: row.motivo_revocacion ?? undefined,
    fechaRevocacion: row.fecha_revocacion ?? undefined,
    autorizadoExcepcional: row.autorizado_excepcional ?? false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const certificadoService = {
  async getAll(): Promise<CertificadoGenerado[]> {
    const data = await fetchAllPaginated<any>((from, to) =>
      supabase
        .from('certificados')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to),
    );
    return data.map(mapCertificado);
  },

  async getById(id: string): Promise<CertificadoGenerado | undefined> {
    const { data, error } = await supabase
      .from('certificados')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapCertificado(data) : undefined;
  },

  async getByMatricula(matriculaId: string): Promise<CertificadoGenerado[]> {
    const { data, error } = await supabase
      .from('certificados')
      .select('*')
      .eq('matricula_id', matriculaId)
      .order('version', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCertificado);
  },

  async getByCurso(cursoId: string): Promise<CertificadoGenerado[]> {
    const { data, error } = await supabase
      .from('certificados')
      .select('*')
      .eq('curso_id', cursoId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapCertificado);
  },

  async create(data: CertificadoFormData): Promise<CertificadoGenerado> {
    const { data: created, error } = await supabase
      .from('certificados')
      .insert({
        matricula_id: data.matriculaId,
        curso_id: data.cursoId,
        persona_id: data.personaId,
        plantilla_id: data.plantillaId,
        codigo: data.codigo,
        estado: data.estado,
        snapshot_datos: data.snapshotDatos as any,
        svg_final: data.svgFinal,
        version: data.version,
        fecha_generacion: data.fechaGeneracion,
        autorizado_excepcional: data.autorizadoExcepcional ?? false,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return mapCertificado(created);
  },

  async generar(params: {
    matriculaId: string;
    cursoId: string;
    personaId: string;
    plantillaId: string;
    svgFinal: string;
    snapshotDatos: Record<string, unknown>;
    codigo: string;
    autorizadoExcepcional?: boolean;
  }): Promise<CertificadoGenerado> {
    const { data: created, error } = await supabase
      .from('certificados')
      .insert({
        matricula_id: params.matriculaId,
        curso_id: params.cursoId,
        persona_id: params.personaId,
        plantilla_id: params.plantillaId,
        codigo: params.codigo,
        estado: 'generado',
        snapshot_datos: params.snapshotDatos as any,
        svg_final: params.svgFinal,
        version: 1,
        fecha_generacion: new Date().toISOString(),
        autorizado_excepcional: params.autorizadoExcepcional ?? false,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return mapCertificado(created);
  },

  async revocar(id: string, revocadoPor: string, motivo: string): Promise<CertificadoGenerado> {
    const { data: updated, error } = await supabase
      .from('certificados')
      .update({
        estado: 'revocado',
        revocado_por: revocadoPor,
        motivo_revocacion: motivo,
        fecha_revocacion: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapCertificado(updated);
  },

  async reemitir(params: {
    certificadoAnteriorId: string;
    svgFinal: string;
    snapshotDatos: Record<string, unknown>;
    codigo: string;
  }): Promise<CertificadoGenerado> {
    // Get anterior
    const { data: anterior, error: getError } = await supabase
      .from('certificados')
      .select('*')
      .eq('id', params.certificadoAnteriorId)
      .single();
    if (getError) throw getError;

    // Revocar anterior
    await supabase
      .from('certificados')
      .update({
        estado: 'revocado',
        motivo_revocacion: 'Reemitido con nueva versión',
        fecha_revocacion: new Date().toISOString(),
      })
      .eq('id', params.certificadoAnteriorId);

    // Crear nuevo
    const { data: nuevo, error } = await supabase
      .from('certificados')
      .insert({
        matricula_id: anterior.matricula_id,
        curso_id: anterior.curso_id,
        persona_id: anterior.persona_id,
        plantilla_id: anterior.plantilla_id,
        codigo: params.codigo,
        estado: 'generado',
        snapshot_datos: params.snapshotDatos as any,
        svg_final: params.svgFinal,
        version: anterior.version + 1,
        fecha_generacion: new Date().toISOString(),
        autorizado_excepcional: anterior.autorizado_excepcional,
      } as any)
      .select()
      .single();
    if (error) throw error;
    return mapCertificado(nuevo);
  },
};
