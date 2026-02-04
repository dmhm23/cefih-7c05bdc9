export type EstadoCurso = 'abierto' | 'en_progreso' | 'cerrado';

export interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  duracionDias: number;
  horasTotales: number;
  entrenadorId: string;
  entrenadorNombre: string;
  capacidadMaxima: number;
  estado: EstadoCurso;
  matriculasIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type CursoFormData = Omit<Curso, 'id' | 'createdAt' | 'updatedAt' | 'matriculasIds'>;

export const ESTADO_CURSO_LABELS: Record<EstadoCurso, string> = {
  abierto: 'Abierto',
  en_progreso: 'En Progreso',
  cerrado: 'Cerrado',
};
