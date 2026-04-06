import { supabase } from '@/integrations/supabase/client';
import { NivelFormacion, NivelFormacionFormData } from '@/types/nivelFormacion';
import { ApiError, handleSupabaseError } from './api';

function mapNivelRow(row: any): NivelFormacion {
  return {
    id: row.id,
    nombreNivel: row.nombre,
    tipoFormacion: row.tipo_formacion,
    duracionHoras: row.duracion_horas,
    documentosRequeridos: row.documentos_requeridos || [],
    camposAdicionales: row.campos_adicionales || [],
    configuracionCodigoEstudiante: row.config_codigo_estudiante || undefined,
    observaciones: row.descripcion,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNivelToDb(data: Partial<NivelFormacionFormData>): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.nombreNivel !== undefined) result.nombre = data.nombreNivel;
  if (data.duracionHoras !== undefined) result.duracion_horas = data.duracionHoras;
  if (data.documentosRequeridos !== undefined) result.documentos_requeridos = data.documentosRequeridos;
  if (data.camposAdicionales !== undefined) result.campos_adicionales = data.camposAdicionales;
  if (data.configuracionCodigoEstudiante !== undefined) result.config_codigo_estudiante = data.configuracionCodigoEstudiante;
  if (data.observaciones !== undefined) result.descripcion = data.observaciones;
  return result;
}

export const nivelFormacionService = {
  async getAll(): Promise<NivelFormacion[]> {
    const { data, error } = await supabase
      .from('niveles_formacion')
      .select('*')
      .is('deleted_at', null)
      .order('nombre');

    if (error) handleSupabaseError(error);
    return (data || []).map(mapNivelRow);
  },

  async getById(id: string): Promise<NivelFormacion | null> {
    const { data, error } = await supabase
      .from('niveles_formacion')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data ? mapNivelRow(data) : null;
  },

  async search(query: string): Promise<NivelFormacion[]> {
    const { data, error } = await supabase
      .from('niveles_formacion')
      .select('*')
      .is('deleted_at', null)
      .ilike('nombre', `%${query}%`)
      .order('nombre');

    if (error) handleSupabaseError(error);
    return (data || []).map(mapNivelRow);
  },

  async create(data: NivelFormacionFormData): Promise<NivelFormacion> {
    const dbData = mapNivelToDb(data);
    // tipo_formacion is required by DB — use the value from data, default to formacion_inicial
    dbData.tipo_formacion = data.tipoFormacion || 'formacion_inicial';

    const { data: row, error } = await supabase
      .from('niveles_formacion')
      .insert(dbData as any)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return mapNivelRow(row);
  },

  async update(id: string, data: Partial<NivelFormacionFormData>): Promise<NivelFormacion> {
    const dbData = mapNivelToDb(data);
    const { data: row, error } = await supabase
      .from('niveles_formacion')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return mapNivelRow(row);
  },

  async delete(id: string): Promise<void> {
    // Check if has cursos
    const { data: cursos } = await supabase
      .from('cursos')
      .select('id')
      .eq('nivel_formacion_id', id)
      .is('deleted_at', null)
      .limit(1);

    if (cursos && cursos.length > 0) {
      throw new ApiError(
        'No se puede eliminar el nivel de formación. Tiene cursos vinculados.',
        400,
        'TIENE_CURSOS'
      );
    }

    const { error } = await supabase
      .from('niveles_formacion')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },
};
