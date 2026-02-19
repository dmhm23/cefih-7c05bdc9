export type EstadoCurso = 'abierto' | 'en_progreso' | 'cerrado';

export type TipoFormacion = 'jefe_area' | 'trabajador_autorizado' | 'reentrenamiento' | 'coordinador_ta';

export interface FechaAdicionalMinTrabajo {
  id: string;
  fecha: string;
  motivo: string;
  createdBy: string;
  createdAt: string;
}

export interface Curso {
  id: string;
  // Legacy fields kept for compatibility but hidden in UI
  nombre: string;
  descripcion: string;
  // New identification fields
  tipoFormacion: TipoFormacion;
  numeroCurso: string;
  fechaInicio: string;
  fechaFin: string;
  duracionDias: number;
  horasTotales: number;
  entrenadorId: string;
  entrenadorNombre: string;
  supervisorId?: string;
  supervisorNombre?: string;
  capacidadMaxima: number;
  estado: EstadoCurso;
  matriculasIds: string[];
  // MinTrabajo fields
  minTrabajoRegistro?: string;
  minTrabajoResponsable?: string;
  minTrabajoFechaCierrePrincipal?: string;
  minTrabajoFechasAdicionales: FechaAdicionalMinTrabajo[];
  createdAt: string;
  updatedAt: string;
}

export type CursoFormData = Omit<Curso, 'id' | 'createdAt' | 'updatedAt' | 'matriculasIds' | 'minTrabajoFechasAdicionales'> & {
  minTrabajoFechasAdicionales?: FechaAdicionalMinTrabajo[];
};

export const ESTADO_CURSO_LABELS: Record<EstadoCurso, string> = {
  abierto: 'Abierto',
  en_progreso: 'En Progreso',
  cerrado: 'Cerrado',
};

export const TIPO_FORMACION_LABELS: Record<TipoFormacion, string> = {
  jefe_area: 'Jefe de Área',
  trabajador_autorizado: 'Trabajador Autorizado',
  reentrenamiento: 'Reentrenamiento',
  coordinador_ta: 'Coordinador T.A.',
};
