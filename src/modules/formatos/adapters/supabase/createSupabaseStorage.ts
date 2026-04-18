/**
 * Adapter Supabase para StoragePort. Encapsula toda la interacción con la BD.
 * Es el ÚNICO lugar dentro de @formatos que importa `@/integrations/supabase/client`.
 */
import { supabase } from '@/integrations/supabase/client';
import type { StoragePort } from '../../contracts/StoragePort';
import type { Formato, FormatoFormData, FormatoVersion, Respuesta } from '../../core/types';
import { snakeToCamel, ApiError, handleSupabaseError } from '@/services/api';

// ---- mapping helpers ----
function rowToFormato(row: any): Formato {
  const f = snakeToCamel<any>(row);
  return {
    ...f,
    nivelFormacionIds: f.nivelesAsignados || [],
    bloques: f.bloques || [],
    tokensUsados: f.tokensUsados || [],
    dependencias: f.dependencias || [],
    eventosDisparadores: f.eventosDisparadores || [],
  } as Formato;
}

function formToRow(data: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};
  if (data.nombre !== undefined) row.nombre = data.nombre;
  if (data.descripcion !== undefined) row.descripcion = data.descripcion;
  if (data.codigo !== undefined) row.codigo = data.codigo;
  if (data.version !== undefined) row.version = data.version;
  if (data.motorRender !== undefined) row.motor_render = data.motorRender;
  if (data.categoria !== undefined) row.categoria = data.categoria;
  if (data.estado !== undefined) row.estado = data.estado;
  if (data.asignacionScope !== undefined) row.asignacion_scope = data.asignacionScope;
  if (data.nivelFormacionIds !== undefined) row.niveles_asignados = data.nivelFormacionIds;
  if ((data as any).tiposCurso !== undefined) row.tipos_curso = (data as any).tiposCurso;
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
  if (data.plantillaBaseId !== undefined) row.plantilla_base_id = data.plantillaBaseId;
  if (data.dependencias !== undefined) row.dependencias = data.dependencias;
  if (data.eventosDisparadores !== undefined) row.eventos_disparadores = data.eventosDisparadores;
  if (data.esOrigenFirma !== undefined) row.es_origen_firma = data.esOrigenFirma;
  return row;
}

function rowToRespuesta(row: any): Respuesta {
  return {
    id: row.id,
    subjectId: row.matricula_id,
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

export function createSupabaseStorage(): StoragePort {
  return {
    async fetchAll() {
      const { data, error } = await supabase
        .from('formatos_formacion')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) handleSupabaseError(error);
      return (data || []).map(rowToFormato);
    },

    async fetchById(id) {
      const { data, error } = await supabase
        .from('formatos_formacion')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) handleSupabaseError(error);
      return data ? rowToFormato(data) : undefined;
    },

    async search(query) {
      const q = `%${query}%`;
      const { data, error } = await supabase
        .from('formatos_formacion')
        .select('*')
        .is('deleted_at', null)
        .or(`nombre.ilike.${q},codigo.ilike.${q},descripcion.ilike.${q}`);
      if (error) handleSupabaseError(error);
      return (data || []).map(rowToFormato);
    },

    async persist(data) {
      const row = formToRow(data as Record<string, any>);
      const { data: inserted, error } = await supabase
        .from('formatos_formacion')
        .insert(row as any)
        .select()
        .single();
      if (error) handleSupabaseError(error);
      return rowToFormato(inserted);
    },

    async update(id, data) {
      const row = formToRow(data as Record<string, any>);
      const { data: updated, error } = await supabase
        .from('formatos_formacion')
        .update(row as any)
        .eq('id', id)
        .select()
        .single();
      if (error) handleSupabaseError(error);
      return rowToFormato(updated);
    },

    async remove(id) {
      const { error } = await supabase
        .from('formatos_formacion')
        .update({ deleted_at: new Date().toISOString(), activo: false })
        .eq('id', id);
      if (error) handleSupabaseError(error);
    },

    async archive(id) {
      const { data, error } = await supabase
        .from('formatos_formacion')
        .update({ estado: 'archivado', activo: false })
        .eq('id', id)
        .select()
        .single();
      if (error) handleSupabaseError(error);
      return rowToFormato(data);
    },

    async duplicate(id) {
      const { data, error } = await supabase.rpc('duplicar_formato', { _formato_id: id });
      if (error) handleSupabaseError(error);
      const newId = data as string;
      const created = await this.fetchById(newId);
      if (!created) throw new ApiError('Error al duplicar formato', 500);
      return created;
    },

    async toggleActivo(id) {
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

    async saveVersion(formatoId) {
      const { data: formato } = await supabase
        .from('formatos_formacion')
        .select('html_template, css_template, version')
        .eq('id', formatoId)
        .single();
      if (!formato) throw new ApiError('Formato no encontrado', 404);
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

    async fetchVersions(formatoId) {
      const { data, error } = await supabase
        .from('versiones_formato')
        .select('*')
        .eq('formato_id', formatoId)
        .order('version', { ascending: false });
      if (error) handleSupabaseError(error);
      return (data || []).map((v: any) => snakeToCamel<FormatoVersion>(v));
    },

    async restoreVersion(formatoId, versionId) {
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

    async fetchRespuestas(subjectId) {
      const { data, error } = await supabase
        .from('formato_respuestas')
        .select('*')
        .eq('matricula_id', subjectId);
      if (error) handleSupabaseError(error);
      return (data || []).map(rowToRespuesta);
    },

    async fetchRespuesta(subjectId, formatoId) {
      const { data, error } = await supabase
        .from('formato_respuestas')
        .select('*')
        .eq('matricula_id', subjectId)
        .eq('formato_id', formatoId)
        .maybeSingle();
      if (error) handleSupabaseError(error);
      return data ? rowToRespuesta(data) : null;
    },

    async upsertRespuesta(subjectId, formatoId, answers, estado = 'pendiente') {
      const { data, error } = await supabase
        .from('formato_respuestas')
        .upsert(
          {
            matricula_id: subjectId,
            formato_id: formatoId,
            answers: answers as any,
            estado,
            completado_at: estado === 'completado' ? new Date().toISOString() : null,
          },
          { onConflict: 'matricula_id,formato_id' },
        )
        .select()
        .single();
      if (error) handleSupabaseError(error);
      return rowToRespuesta(data);
    },

    async reopenRespuesta(respuestaId, userId) {
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

    async fetchForSubject(subjectId) {
      const { data, error } = await supabase
        .rpc('get_formatos_for_matricula', { _matricula_id: subjectId });
      if (error) handleSupabaseError(error);
      return (data || []).map(rowToFormato);
    },
  };
}
