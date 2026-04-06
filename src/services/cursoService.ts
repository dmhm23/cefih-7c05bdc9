import { supabase } from '@/integrations/supabase/client';
import { Curso, CursoFormData, EstadoCurso, FechaAdicionalMinTrabajo } from '@/types/curso';
import { ApiError, handleSupabaseError } from './api';

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

function mapCursoRow(row: any): Curso {
  return {
    id: row.id,
    nombre: row.nombre || '',
    descripcion: '',
    tipoFormacion: TIPO_DB_TO_FE[row.tipo_formacion] || row.tipo_formacion,
    nivelFormacionId: row.nivel_formacion_id || undefined,
    numeroCurso: row.nombre || '',
    fechaInicio: row.fecha_inicio || '',
    fechaFin: row.fecha_fin || '',
    duracionDias: 0,
    horasTotales: 0,
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
    matriculasIds: [],
    minTrabajoRegistro: undefined,
    minTrabajoResponsable: undefined,
    minTrabajoFechaCierrePrincipal: undefined,
    minTrabajoFechasAdicionales: [],
    camposAdicionalesValores: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const cursoService = {
  async getAll(): Promise<Curso[]> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return (data || []).map(mapCursoRow);
  },

  async getById(id: string): Promise<Curso | null> {
    const { data: row, error } = await supabase
      .from('cursos')
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos)')
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

    curso.minTrabajoFechasAdicionales = (fechas || []).map(f => ({
      id: f.id,
      fecha: f.fecha,
      motivo: f.motivo || '',
      createdBy: '',
      createdAt: f.created_at,
    }));

    return curso;
  },

  async getByEstado(estado: EstadoCurso): Promise<Curso[]> {
    const dbEstado = ESTADO_FE_TO_DB[estado] || estado;
    const { data, error } = await supabase
      .from('cursos')
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos)')
      .eq('estado', dbEstado as any)
      .is('deleted_at', null);

    if (error) handleSupabaseError(error);
    return (data || []).map(mapCursoRow);
  },

  async search(query: string): Promise<Curso[]> {
    const { data, error } = await supabase
      .from('cursos')
      .select('*, entrenador:personal!cursos_entrenador_id_fkey(nombres, apellidos), supervisor:personal!cursos_supervisor_id_fkey(nombres, apellidos)')
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
    };

    // Don't set nombre — let the trigger auto-generate it
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
    if (data.tipoFormacion !== undefined) dbData.tipo_formacion = TIPO_FE_TO_DB[data.tipoFormacion] || data.tipoFormacion;
    if (data.nivelFormacionId !== undefined) dbData.nivel_formacion_id = data.nivelFormacionId || null;
    if (data.fechaInicio !== undefined) dbData.fecha_inicio = data.fechaInicio || null;
    if (data.fechaFin !== undefined) dbData.fecha_fin = data.fechaFin || null;
    if (data.capacidadMaxima !== undefined) dbData.capacidad_maxima = data.capacidadMaxima;
    if (data.entrenadorId !== undefined) dbData.entrenador_id = data.entrenadorId || null;
    if (data.supervisorId !== undefined) dbData.supervisor_id = data.supervisorId || null;
    if (data.estado !== undefined) dbData.estado = ESTADO_FE_TO_DB[data.estado] || data.estado;
    if (data.nombre !== undefined) dbData.nombre = data.nombre;

    const { data: row, error } = await supabase
      .from('cursos')
      .update(dbData)
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

  async actualizarMinTrabajo(id: string, data: { minTrabajoRegistro?: string; minTrabajoResponsable?: string; minTrabajoFechaCierrePrincipal?: string }): Promise<Curso> {
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
    if (data.minTrabajoResponsable !== undefined) obs.minTrabajoResponsable = data.minTrabajoResponsable;
    if (data.minTrabajoFechaCierrePrincipal !== undefined) obs.minTrabajoFechaCierrePrincipal = data.minTrabajoFechaCierrePrincipal;

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
    const { error } = await supabase
      .from('cursos_fechas_mintrabajo')
      .insert({
        curso_id: id,
        fecha: data.fecha,
        motivo: data.motivo,
      });

    if (error) handleSupabaseError(error);

    // Return updated curso
    const curso = await cursoService.getById(id);
    if (!curso) throw new ApiError('Curso no encontrado', 404);
    return curso;
  },

  async eliminarFechaAdicional(id: string, fechaId: string): Promise<Curso> {
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

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('cursos')
      .update({ deleted_at: new Date().toISOString(), activo: false })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },

  async agregarEstudiantes(cursoId: string, matriculaIds: string[]): Promise<Curso> {
    // Matrículas table doesn't exist yet — just return the curso
    const curso = await cursoService.getById(cursoId);
    if (!curso) throw new ApiError('Curso no encontrado', 404);
    return curso;
  },

  async removerEstudiante(cursoId: string, matriculaId: string): Promise<Curso> {
    const curso = await cursoService.getById(cursoId);
    if (!curso) throw new ApiError('Curso no encontrado', 404);
    return curso;
  },
};
