import { supabase } from '@/integrations/supabase/client';
import { FormatoFormacion, FormatoFormacionFormData, FormatoVersion, PlantillaBase } from '@/types/formatoFormacion';
import { ApiError, snakeToCamel, camelToSnake, handleSupabaseError } from './api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToFormato(row: any): FormatoFormacion {
  const f = snakeToCamel<any>(row);
  return {
    ...f,
    // Map DB field names to frontend interface
    nivelFormacionIds: f.nivelesAsignados || [],
    bloques: f.bloques || [],
    tokensUsados: f.tokensUsados || [],
  } as FormatoFormacion;
}

function formToRow(data: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};

  // Manual mapping of key fields to avoid camelToSnake issues with JSONB
  if (data.nombre !== undefined) row.nombre = data.nombre;
  if (data.descripcion !== undefined) row.descripcion = data.descripcion;
  if (data.codigo !== undefined) row.codigo = data.codigo;
  if (data.version !== undefined) row.version = data.version;
  if (data.motorRender !== undefined) row.motor_render = data.motorRender;
  if (data.categoria !== undefined) row.categoria = data.categoria;
  if (data.estado !== undefined) row.estado = data.estado;
  if (data.asignacionScope !== undefined) row.asignacion_scope = data.asignacionScope;
  if (data.nivelFormacionIds !== undefined) row.niveles_asignados = data.nivelFormacionIds;
  if (data.tiposCurso !== undefined) row.tipos_curso = data.tiposCurso;
  if (data.htmlTemplate !== undefined) row.html_template = data.htmlTemplate;
  if (data.cssTemplate !== undefined) row.css_template = data.cssTemplate;
  if (data.bloques !== undefined) row.bloques = data.bloques;
  if (data.usaEncabezadoInstitucional !== undefined) row.usa_encabezado_institucional = data.usaEncabezadoInstitucional;
  if (data.encabezadoConfig !== undefined) row.encabezado_config = data.encabezadoConfig;
  if (data.tokensUsados !== undefined) row.tokens_usados = data.tokensUsados;
  if (data.requiereFirmaAprendiz !== undefined) row.requiere_firma_aprendiz = data.requiereFirmaAprendiz;
  if (data.requiereFirmaEntrenador !== undefined) row.requiere_firma_entrenador = data.requiereFirmaEntrenador;
  if (data.requiereFirmaSupervisor !== undefined) row.requiere_firma_supervisor = data.requiereFirmaSupervisor;
  if (data.visibleEnMatricula !== undefined) row.visible_en_matricula = data.visibleEnMatricula;
  if (data.visibleEnCurso !== undefined) row.visible_en_curso = data.visibleEnCurso;
  if (data.visibleEnPortalEstudiante !== undefined) row.visible_en_portal_estudiante = data.visibleEnPortalEstudiante;
  if (data.activo !== undefined) row.activo = data.activo;
  if (data.modoDiligenciamiento !== undefined) row.modo_diligenciamiento = data.modoDiligenciamiento;
  if (data.esAutomatico !== undefined) row.es_automatico = data.esAutomatico;
  if (data.documentMeta !== undefined) row.document_meta = data.documentMeta;
  if (data.legacyComponentId !== undefined) row.legacy_component_id = data.legacyComponentId;
  if (data.plantillaBaseId !== undefined) row.plantilla_base_id = data.plantillaBaseId;

  return row;
}

// ---------------------------------------------------------------------------
// Plantillas base (estáticas en frontend)
// ---------------------------------------------------------------------------

const PLANTILLAS_BASE: PlantillaBase[] = [
  {
    id: 'pb-registro',
    nombre: 'Registro de Actividad',
    descripcion: 'Plantilla base para registros y formatos de seguimiento',
    categoria: 'formacion',
    htmlTemplate: `<h2 style="text-align:center;margin-bottom:24px;">REGISTRO DE ACTIVIDAD</h2>\n<table style="width:100%;border-collapse:collapse;margin:16px 0;">\n<tr><td style="border:1px solid #ccc;padding:8px;width:30%;font-weight:bold;">Participante</td><td style="border:1px solid #ccc;padding:8px;">{{persona.nombreCompleto}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Documento</td><td style="border:1px solid #ccc;padding:8px;">{{persona.numeroDocumento}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Curso</td><td style="border:1px solid #ccc;padding:8px;">{{curso.nombre}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Empresa</td><td style="border:1px solid #ccc;padding:8px;">{{empresa.nombre}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Fecha</td><td style="border:1px solid #ccc;padding:8px;">{{sistema.fechaDiligenciamiento}}</td></tr>\n</table>`,
  },
];

// ---------------------------------------------------------------------------
// CRUD Service
// ---------------------------------------------------------------------------

export const formatoFormacionService = {
  getAll: async (): Promise<FormatoFormacion[]> => {
    const { data, error } = await supabase
      .from('formatos_formacion')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return (data || []).map(rowToFormato);
  },

  getById: async (id: string): Promise<FormatoFormacion | undefined> => {
    const { data, error } = await supabase
      .from('formatos_formacion')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    if (!data) return undefined;
    return rowToFormato(data);
  },

  create: async (data: FormatoFormacionFormData): Promise<FormatoFormacion> => {
    const row = formToRow(data);

    const { data: inserted, error } = await supabase
      .from('formatos_formacion')
      .insert(row as any)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToFormato(inserted);
  },

  update: async (id: string, data: Partial<FormatoFormacionFormData>): Promise<FormatoFormacion> => {
    const row = formToRow(data);

    const { data: updated, error } = await supabase
      .from('formatos_formacion')
      .update(row as any)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToFormato(updated);
  },

  toggleActivo: async (id: string): Promise<FormatoFormacion> => {
    // First get current value
    const { data: current } = await supabase
      .from('formatos_formacion')
      .select('activo')
      .eq('id', id)
      .single();

    const { data: updated, error } = await supabase
      .from('formatos_formacion')
      .update({ activo: !current?.activo })
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToFormato(updated);
  },

  duplicate: async (id: string): Promise<FormatoFormacion> => {
    const { data, error } = await supabase.rpc('duplicar_formato', {
      _formato_id: id,
    });

    if (error) handleSupabaseError(error);

    // Fetch the new formato
    const newId = data as string;
    const formato = await formatoFormacionService.getById(newId);
    if (!formato) throw new ApiError('Error al duplicar formato', 500);
    return formato;
  },

  search: async (query: string): Promise<FormatoFormacion[]> => {
    const q = `%${query}%`;
    const { data, error } = await supabase
      .from('formatos_formacion')
      .select('*')
      .is('deleted_at', null)
      .or(`nombre.ilike.${q},codigo.ilike.${q},descripcion.ilike.${q}`);

    if (error) handleSupabaseError(error);
    return (data || []).map(rowToFormato);
  },

  /** Obtener formatos aplicables para una matrícula según nivel de formación */
  getForMatricula: async (nivelFormacionIdOrMatriculaId: string): Promise<FormatoFormacion[]> => {
    // Try as nivel_formacion_id first (direct filter)
    const { data, error } = await supabase
      .from('formatos_formacion')
      .select('*')
      .eq('activo', true)
      .in('estado', ['activo', 'borrador'])
      .is('deleted_at', null)
      .eq('visible_en_matricula', true);

    if (error) handleSupabaseError(error);

    // Filter client-side by niveles_asignados containing the given ID
    return (data || [])
      .filter((f: any) => {
        if (f.asignacion_scope === 'nivel_formacion') {
          return (f.niveles_asignados || []).includes(nivelFormacionIdOrMatriculaId);
        }
        // For 'tipo_curso' scope, include all (they match by tipo)
        return true;
      })
      .map(rowToFormato);
  },

  // --- Versioning ---
  saveVersion: async (formatoId: string): Promise<FormatoVersion> => {
    // Get current formato data
    const { data: formato } = await supabase
      .from('formatos_formacion')
      .select('html_template, css_template, version')
      .eq('id', formatoId)
      .single();

    if (!formato) throw new ApiError('Formato no encontrado', 404);

    // Get next version number
    const { data: versions } = await supabase
      .from('versiones_formato')
      .select('version')
      .eq('formato_id', formatoId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = ((versions?.[0]?.version || 0) as number) + 1;

    const { data: inserted, error } = await supabase
      .from('versiones_formato')
      .insert({
        formato_id: formatoId,
        version: nextVersion,
        html_template: formato.html_template || '',
        css_template: formato.css_template,
      })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return snakeToCamel<FormatoVersion>(inserted);
  },

  getVersiones: async (formatoId: string): Promise<FormatoVersion[]> => {
    const { data, error } = await supabase
      .from('versiones_formato')
      .select('*')
      .eq('formato_id', formatoId)
      .order('version', { ascending: false });

    if (error) handleSupabaseError(error);
    return (data || []).map((v: any) => snakeToCamel<FormatoVersion>(v));
  },

  restoreVersion: async (formatoId: string, versionId: string): Promise<FormatoFormacion> => {
    const { data: ver } = await supabase
      .from('versiones_formato')
      .select('*')
      .eq('id', versionId)
      .eq('formato_id', formatoId)
      .single();

    if (!ver) throw new ApiError('Versión no encontrada', 404);

    const { data: updated, error } = await supabase
      .from('formatos_formacion')
      .update({
        html_template: ver.html_template,
        css_template: ver.css_template,
      })
      .eq('id', formatoId)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToFormato(updated);
  },

  // --- Archive ---
  archive: async (id: string): Promise<FormatoFormacion> => {
    const { data: updated, error } = await supabase
      .from('formatos_formacion')
      .update({ estado: 'archivado', activo: false })
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToFormato(updated);
  },

  // --- Delete (soft) ---
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('formatos_formacion')
      .update({ deleted_at: new Date().toISOString(), activo: false })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },

  // --- Plantillas base ---
  getPlantillasBase: async (): Promise<PlantillaBase[]> => {
    return PLANTILLAS_BASE;
  },
};
