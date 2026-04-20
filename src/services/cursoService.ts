import { supabase } from '@/integrations/supabase/client';
import { Curso, CursoFormData, EstadoCurso, FechaAdicionalMinTrabajo, AdjuntoMinTrabajo } from '@/types/curso';
import { ApiError, handleSupabaseError } from './api';
import { fetchAllPaginated } from './_paginated';

// Map DB estado to frontend estado
const ESTADO_DB_TO_FE: Record<string, EstadoCurso> = {
  programado: 'abierto',
  en_curso: 'en_progreso',
  cerrado: 'cerrado',
  cancelado: 'cerrado',
};

const ESTADO_FE_TO_DB: Record<string, string> = {
  abierto: 'programado',
  en_progreso: 'en_curso',
  cerrado: 'cerrado',
};

// Map DB tipo_formacion to frontend
const TIPO_DB_TO_FE: Record<string, string> = {
  formacion_inicial: 'trabajador_autorizado',
  reentrenamiento: 'reentrenamiento',
  jefe_area: 'jefe_area',
  coordinador_alturas: 'coordinador_ta',
};

const TIPO_FE_TO_DB: Record<string, string> = {
  trabajador_autorizado: 'formacion_inicial',
  reentrenamiento: 'reentrenamiento',
  jefe_area: 'jefe_area',
  coordinador_ta: 'coordinador_alturas',
};

function parseObsMinTrabajo(obs: string | null | undefined) {
  if (!obs) return {};
  try { return JSON.parse(obs); } catch { return {}; }
}

function mapCursoRow(row: any): Curso {
  const obs = parseObsMinTrabajo(row.observaciones);
  return {
    id: row.id,
    nombre: row.nombre || '',
    descripcion: '',
    tipoFormacion: TIPO_DB_TO_FE[row.tipo_formacion] || row.tipo_formacion,
    nivelFormacionId: row.nivel_formacion_id || undefined,
    numeroCurso: row.nombre || '',
    fechaInicio: row.fecha_inicio || '',
    fechaFin: row.fecha_fin || '',
    duracionDias: row.duracion_dias ?? 0,
    horasTotales: row.duracion_horas ?? 0,
    entrenadorId: row.entrenador_id || '',
    entrenadorNombre: (row as any).entrenador?.nombres 
      ? `${(row as any).entrenador.nombres} ${(row as any).entrenador.apellidos || ''}`
      : '',
    supervisorId: row.supervisor_id || undefined,
    supervisorNombre: (row as any).supervisor?.nombres
      ? `${(row as any).supervisor.nombres} ${(row as any).supervisor.apellidos || ''}`
      : undefined,
    capacidadMaxima: row.capacidad_maxima || 30,
    estado: ESTADO_DB_TO_FE[row.estado] || 'abierto',
    matriculasIds: (row.matriculas || []).filter((m: any) => m.id).map((m: any) => m.id),
    minTrabajoRegistro: obs.minTrabajoRegistro || undefined,
    minTrabajoResponsable: obs.minTrabajoResponsable || undefined,
    minTrabajoFechaCierrePrincipal: obs.minTrabajoFechaCierrePrincipal || undefined,
    minTrabajoFechasAdicionales: [],
    camposAdicionalesValores: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const cursoService = {
  async getAll(): Promise<Curso[]> {
    try {
      const data = await fetchAllPaginated<any>((from, to) =>
        supabase
          .from('cursos')
          .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos), matriculas!matriculas_curso_id_fkey(id)')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(from, to),
      );
      return data.map(mapCursoRow);
    } catch (error: any) {
      handleSupabaseError(error);
      return [];
    }
  },

  async getById(id: string): Promise<Curso | null> {
    const { data: row, error } = await supabase
      .from('cursos')
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos), matriculas!matriculas_curso_id_fkey(id)')
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    if (!row) return null;

    const curso = mapCursoRow(row);

    // Load fechas mintrabajo
    const { data: fechas } = await supabase
      .from('cursos_fechas_mintrabajo')
      .select('*')
      .eq('curso_id', id)
      .order('fecha');

    // Resolve created_by UUIDs to names
    const creatorIds = (fechas || []).map(f => f.created_by).filter(Boolean) as string[];
    let creatorMap: Record<string, string> = {};
    if (creatorIds.length > 0) {
      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, nombres, email')
        .in('id', creatorIds);
      for (const p of perfiles || []) {
        creatorMap[p.id] = p.nombres || p.email;
      }
    }

    curso.minTrabajoFechasAdicionales = (fechas || []).map(f => ({
      id: f.id,
      fecha: f.fecha,
      motivo: f.motivo || '',
      createdBy: f.created_by ? (creatorMap[f.created_by] || '') : '',
      createdAt: f.created_at,
    }));

    return curso;
  },

  async getByEstado(estado: EstadoCurso): Promise<Curso[]> {
    const dbEstado = ESTADO_FE_TO_DB[estado] || estado;
    const { data, error } = await supabase
      .from('cursos')
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos), matriculas!matriculas_curso_id_fkey(id)')
      .eq('estado', dbEstado as any)
      .is('deleted_at', null);

    if (error) handleSupabaseError(error);
    return (data || []).map(mapCursoRow);
  },

  async search(query: string): Promise<Curso[]> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos), matriculas!matriculas_curso_id_fkey(id)')
      .is('deleted_at', null)
      .ilike('nombre', `%${query}%`);

    if (error) handleSupabaseError(error);
    return (data || []).map(mapCursoRow);
  },

  async create(data: CursoFormData): Promise<Curso> {
    const dbData: Record<string, any> = {
      tipo_formacion: TIPO_FE_TO_DB[data.tipoFormacion] || data.tipoFormacion || 'formacion_inicial',
      nivel_formacion_id: data.nivelFormacionId || null,
      fecha_inicio: data.fechaInicio || null,
      fecha_fin: data.fechaFin || null,
      capacidad_maxima: data.capacidadMaxima || 30,
      entrenador_id: data.entrenadorId || null,
      supervisor_id: data.supervisorId || null,
      observaciones: null,
      duracion_horas: data.horasTotales || 0,
      duracion_dias: data.duracionDias || 0,
    };

    // Solo enviar nombre si el usuario lo editó manualmente; si vacío, el trigger lo genera
    if (data.nombre && data.nombre.trim() !== '') {
      dbData.nombre = data.nombre;
    }

    const { data: row, error } = await supabase
      .from('cursos')
      .insert(dbData as any)
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos)')
      .single();

    if (error) handleSupabaseError(error);
    return mapCursoRow(row);
  },

  async update(id: string, data: Partial<CursoFormData>, justificacion?: string): Promise<Curso> {
    const dbData: Record<string, any> = {};
    if (data.tipoFormacion !== undefined) {
      const mapped = TIPO_FE_TO_DB[data.tipoFormacion] || data.tipoFormacion;
      const VALID_DB_TIPOS = ['formacion_inicial', 'reentrenamiento', 'jefe_area', 'coordinador_alturas'];
      if (VALID_DB_TIPOS.includes(mapped)) {
        dbData.tipo_formacion = mapped;
      }
      // Si no es válido (ej. UUID por bug previo), se omite del update para no romper el enum
    }
    if (data.nivelFormacionId !== undefined) dbData.nivel_formacion_id = data.nivelFormacionId || null;
    if (data.fechaInicio !== undefined) dbData.fecha_inicio = data.fechaInicio || null;
    if (data.fechaFin !== undefined) dbData.fecha_fin = data.fechaFin || null;
    if (data.capacidadMaxima !== undefined) dbData.capacidad_maxima = data.capacidadMaxima;
    if (data.entrenadorId !== undefined) dbData.entrenador_id = data.entrenadorId || null;
    if (data.supervisorId !== undefined) dbData.supervisor_id = data.supervisorId || null;
    if (data.estado !== undefined) dbData.estado = ESTADO_FE_TO_DB[data.estado] || data.estado;
    if (data.horasTotales !== undefined) dbData.duracion_horas = data.horasTotales;
    if (data.duracionDias !== undefined) dbData.duracion_dias = data.duracionDias;
    // numeroCurso (UI) y nombre (legacy) ambos persisten en columna `nombre`
    if ((data as any).numeroCurso !== undefined) dbData.nombre = (data as any).numeroCurso;
    if (data.nombre !== undefined) dbData.nombre = data.nombre;
    // entrenadorNombre / supervisorNombre son derivados (JOIN), se ignoran intencionalmente

    // Guard: si no hay columnas reales para actualizar, evitar UPDATE vacío (PGRST116)
    if (Object.keys(dbData).length === 0) {
      const curso = await cursoService.getById(id);
      if (!curso) throw new ApiError('Curso no encontrado', 404);
      return curso;
    }

    const { data: row, error } = await supabase
      .from('cursos')
      .update(dbData as any)
      .eq('id', id)
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos)')
      .single();

    if (error) handleSupabaseError(error);
    return mapCursoRow(row);
  },

  async cambiarEstado(id: string, nuevoEstado: EstadoCurso): Promise<Curso> {
    const dbEstado = ESTADO_FE_TO_DB[nuevoEstado] || nuevoEstado;

    const { data: row, error } = await supabase
      .from('cursos')
      .update({ estado: dbEstado as any })
      .eq('id', id)
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos)')
      .single();

    if (error) handleSupabaseError(error);
    return mapCursoRow(row);
  },

  async actualizarMinTrabajo(id: string, data: { minTrabajoRegistro?: string; minTrabajoFechaCierrePrincipal?: string }): Promise<Curso> {
    // MinTrabajo fields stored as observaciones JSON for now (until dedicated columns exist)
    const { data: current } = await supabase
      .from('cursos')
      .select('observaciones')
      .eq('id', id)
      .single();

    let obs: Record<string, any> = {};
    try {
      obs = current?.observaciones ? JSON.parse(current.observaciones) : {};
    } catch { obs = {}; }

    if (data.minTrabajoRegistro !== undefined) obs.minTrabajoRegistro = data.minTrabajoRegistro;
    if (data.minTrabajoFechaCierrePrincipal !== undefined) obs.minTrabajoFechaCierrePrincipal = data.minTrabajoFechaCierrePrincipal;

    // Auto-resolve responsable from authenticated user
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombres, email')
        .eq('id', userData.user.id)
        .single();
      obs.minTrabajoResponsable = perfil?.nombres || perfil?.email || 'Usuario del sistema';
    }

    const { data: row, error } = await supabase
      .from('cursos')
      .update({ observaciones: JSON.stringify(obs) })
      .eq('id', id)
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos)')
      .single();

    if (error) handleSupabaseError(error);
    const curso = mapCursoRow(row);
    curso.minTrabajoRegistro = obs.minTrabajoRegistro;
    curso.minTrabajoResponsable = obs.minTrabajoResponsable;
    curso.minTrabajoFechaCierrePrincipal = obs.minTrabajoFechaCierrePrincipal;
    return curso;
  },

  async agregarFechaAdicional(id: string, data: { fecha: string; motivo: string }): Promise<Curso> {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('cursos_fechas_mintrabajo')
      .insert({
        curso_id: id,
        fecha: data.fecha,
        motivo: data.motivo,
        created_by: userData?.user?.id || null,
      });

    if (error) handleSupabaseError(error);

    const curso = await cursoService.getById(id);
    if (!curso) throw new ApiError('Curso no encontrado', 404);
    return curso;
  },

  async editarFechaAdicional(cursoId: string, fechaId: string, data: { fecha: string; motivo: string }): Promise<Curso> {
    const { error } = await supabase
      .from('cursos_fechas_mintrabajo')
      .update({ fecha: data.fecha, motivo: data.motivo })
      .eq('id', fechaId);

    if (error) handleSupabaseError(error);

    const curso = await cursoService.getById(cursoId);
    if (!curso) throw new ApiError('Curso no encontrado', 404);
    return curso;
  },

  async eliminarFechaAdicional(id: string, fechaId: string): Promise<Curso> {
    // Limpiar adjuntos del storage antes del cascade DELETE
    const { data: adjuntos } = await supabase
      .from('cursos_mintrabajo_adjuntos')
      .select('storage_path')
      .eq('fecha_id', fechaId);
    const paths = (adjuntos || []).map(a => a.storage_path).filter(Boolean);
    if (paths.length > 0) {
      await supabase.storage.from('adjuntos-mintrabajo').remove(paths);
    }

    const { error } = await supabase
      .from('cursos_fechas_mintrabajo')
      .delete()
      .eq('id', fechaId);

    if (error) handleSupabaseError(error);

    const curso = await cursoService.getById(id);
    if (!curso) throw new ApiError('Curso no encontrado', 404);
    return curso;
  },

  async getEstadisticas(id: string): Promise<{
    total: number;
    completas: number;
    pendientes: number;
    certificadas: number;
  }> {
    // Matrículas table doesn't exist yet — return empty stats
    return { total: 0, completas: 0, pendientes: 0, certificadas: 0 };
  },

  async countByNivelAndMonth(nivelFormacionId: string, year: number, month: number): Promise<number> {
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { count, error } = await supabase
      .from('cursos')
      .select('id', { count: 'exact', head: true })
      .eq('nivel_formacion_id', nivelFormacionId)
      .is('deleted_at', null)
      .gte('fecha_inicio', startOfMonth)
      .lte('fecha_inicio', endOfMonth);

    if (error) handleSupabaseError(error);
    return count ?? 0;
  },

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString();

    // Soft-delete all active matriculas of this course first
    // The DB trigger will cascade to cartera automatically
    const { error: matError } = await supabase
      .from('matriculas')
      .update({ deleted_at: now, activo: false })
      .eq('curso_id', id)
      .is('deleted_at', null);

    if (matError) handleSupabaseError(matError);

    const { error } = await supabase
      .from('cursos')
      .update({ deleted_at: now, activo: false })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },

  async agregarEstudiantes(cursoId: string, matriculaIds: string[]): Promise<Curso> {
    for (const matriculaId of matriculaIds) {
      const { error } = await supabase
        .from('matriculas')
        .update({ curso_id: cursoId })
        .eq('id', matriculaId);
      if (error) handleSupabaseError(error);
    }
    const curso = await cursoService.getById(cursoId);
    if (!curso) throw new ApiError('Curso no encontrado', 404);
    return curso;
  },

  async removerEstudiante(cursoId: string, matriculaId: string): Promise<Curso> {
    const { error } = await supabase
      .from('matriculas')
      .update({ curso_id: null })
      .eq('id', matriculaId)
      .eq('curso_id', cursoId);
    if (error) handleSupabaseError(error);
    const curso = await cursoService.getById(cursoId);
    if (!curso) throw new ApiError('Curso no encontrado', 404);
    return curso;
  },

  // ============ ADJUNTOS MINTRABAJO ============
  async listAdjuntosMinTrabajo(cursoId: string, fechaId?: string | null): Promise<AdjuntoMinTrabajo[]> {
    let query = supabase
      .from('cursos_mintrabajo_adjuntos')
      .select('*')
      .eq('curso_id', cursoId)
      .order('created_at', { ascending: false });

    if (fechaId === null || fechaId === undefined) {
      query = query.is('fecha_id', null);
    } else {
      query = query.eq('fecha_id', fechaId);
    }

    const { data, error } = await query;
    if (error) handleSupabaseError(error);

    const rows = data || [];
    // Generate signed URLs in parallel (1h)
    const signed = await Promise.all(
      rows.map(async (r) => {
        const { data: sig } = await supabase.storage
          .from('adjuntos-mintrabajo')
          .createSignedUrl(r.storage_path, 3600);
        return {
          id: r.id,
          cursoId: r.curso_id,
          fechaId: r.fecha_id,
          nombre: r.nombre,
          tipoMime: r.tipo_mime || '',
          tamano: r.tamano || 0,
          url: sig?.signedUrl,
          createdAt: r.created_at,
        } as AdjuntoMinTrabajo;
      })
    );
    return signed;
  },

  async addAdjuntoMinTrabajo(cursoId: string, file: File, fechaId?: string | null): Promise<AdjuntoMinTrabajo> {
    // Validar límite de 10
    let countQuery = supabase
      .from('cursos_mintrabajo_adjuntos')
      .select('id', { count: 'exact', head: true })
      .eq('curso_id', cursoId);
    if (fechaId === null || fechaId === undefined) {
      countQuery = countQuery.is('fecha_id', null);
    } else {
      countQuery = countQuery.eq('fecha_id', fechaId);
    }
    const { count } = await countQuery;
    if ((count ?? 0) >= 10) {
      throw new ApiError('Se alcanzó el límite de 10 archivos para este registro', 400);
    }

    // Validar tamaño 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new ApiError('El archivo supera el tamaño máximo de 5 MB', 400);
    }

    const sanitizedName = file.name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const folder = fechaId ? `fecha_${fechaId}` : 'principal';
    const path = `mintrabajo/${cursoId}/${folder}/${Date.now()}_${sanitizedName}`;

    const { error: uploadError } = await supabase.storage
      .from('adjuntos-mintrabajo')
      .upload(path, file);

    if (uploadError) throw new ApiError('Error al subir el archivo', 500);

    const { data: userData } = await supabase.auth.getUser();
    const { data: row, error } = await supabase
      .from('cursos_mintrabajo_adjuntos')
      .insert({
        curso_id: cursoId,
        fecha_id: fechaId || null,
        nombre: file.name,
        tipo_mime: file.type,
        tamano: file.size,
        storage_path: path,
        created_by: userData?.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      // Rollback storage
      await supabase.storage.from('adjuntos-mintrabajo').remove([path]);
      handleSupabaseError(error);
    }

    const { data: sig } = await supabase.storage
      .from('adjuntos-mintrabajo')
      .createSignedUrl(row.storage_path, 3600);

    return {
      id: row.id,
      cursoId: row.curso_id,
      fechaId: row.fecha_id,
      nombre: row.nombre,
      tipoMime: row.tipo_mime || '',
      tamano: row.tamano || 0,
      url: sig?.signedUrl,
      createdAt: row.created_at,
    };
  },

  async deleteAdjuntoMinTrabajo(adjuntoId: string): Promise<void> {
    const { data: adjunto } = await supabase
      .from('cursos_mintrabajo_adjuntos')
      .select('storage_path')
      .eq('id', adjuntoId)
      .single();

    if (adjunto?.storage_path) {
      await supabase.storage.from('adjuntos-mintrabajo').remove([adjunto.storage_path]);
    }

    const { error } = await supabase
      .from('cursos_mintrabajo_adjuntos')
      .delete()
      .eq('id', adjuntoId);

    if (error) handleSupabaseError(error);
  },
};
