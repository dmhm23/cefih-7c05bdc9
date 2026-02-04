export type EstadoMatricula = 
  | 'creada' 
  | 'pendiente' 
  | 'completa' 
  | 'certificada' 
  | 'cerrada';

export type TipoFormacion = 
  | 'inicial' 
  | 'reentrenamiento' 
  | 'avanzado' 
  | 'coordinador';

export type TipoDocumento = 
  | 'cedula' 
  | 'examen_medico' 
  | 'certificado_eps' 
  | 'otro';

export type EstadoDocumento = 
  | 'pendiente' 
  | 'cargado' 
  | 'verificado';

export interface DocumentoRequerido {
  id: string;
  tipo: TipoDocumento;
  nombre: string;
  urlDrive?: string;
  estado: EstadoDocumento;
  fechaCarga?: string;
}

export interface Matricula {
  id: string;
  personaId: string;
  cursoId: string;
  tipoFormacion: TipoFormacion;
  estado: EstadoMatricula;
  documentos: DocumentoRequerido[];
  firmaCapturada: boolean;
  firmaBase64?: string;
  evaluacionCompletada: boolean;
  evaluacionPuntaje?: number;
  encuestaCompletada: boolean;
  pagado: boolean;
  facturaNumero?: string;
  fechaPago?: string;
  createdAt: string;
  updatedAt: string;
}

export type MatriculaFormData = Omit<Matricula, 'id' | 'createdAt' | 'updatedAt'>;

export const ESTADO_MATRICULA_LABELS: Record<EstadoMatricula, string> = {
  creada: 'Creada',
  pendiente: 'Pendiente',
  completa: 'Completa',
  certificada: 'Certificada',
  cerrada: 'Cerrada',
};

export const TIPO_FORMACION_LABELS: Record<TipoFormacion, string> = {
  inicial: 'Formación Inicial',
  reentrenamiento: 'Reentrenamiento',
  avanzado: 'Nivel Avanzado',
  coordinador: 'Coordinador de Alturas',
};
