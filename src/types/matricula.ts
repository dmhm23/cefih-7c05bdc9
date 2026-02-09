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

export type NivelPrevio = 'trabajador_autorizado' | 'avanzado';

export type TipoVinculacion = 'empresa' | 'independiente';

export type NivelFormacionEmpresa = 
  | 'jefe_area' 
  | 'trabajador_autorizado' 
  | 'reentrenamiento' 
  | 'coordinador_ta';

export type TipoDocumento = 
  | 'cedula' 
  | 'examen_medico' 
  | 'certificado_eps' 
  | 'arl'
  | 'planilla_seguridad_social'
  | 'curso_previo'
  | 'consolidado'
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
  fechaDocumento?: string;
  fechaInicioCobertura?: string;
  opcional?: boolean;
}

export interface Matricula {
  id: string;
  personaId: string;
  cursoId: string;
  tipoFormacion: TipoFormacion;
  estado: EstadoMatricula;
  
  // Fechas autocompletadas desde curso
  fechaInicio?: string;
  fechaFin?: string;
  
  // Historial de formación previa
  nivelPrevio?: NivelPrevio;
  centroFormacionPrevio?: string;
  fechaCertificacionPrevia?: string;
  
  // Vinculación laboral
  tipoVinculacion?: TipoVinculacion;
  empresaNombre?: string;
  empresaNit?: string;
  empresaRepresentanteLegal?: string;
  empresaCargo?: string;
  empresaNivelFormacion?: NivelFormacionEmpresa;
  empresaContactoNombre?: string;
  empresaContactoTelefono?: string;
  areaTrabajo?: string;
  sectorEconomico?: string;
  
  // Consentimiento de salud
  consentimientoSalud: boolean;
  restriccionMedica: boolean;
  restriccionMedicaDetalle?: string;
  alergias: boolean;
  alergiasDetalle?: string;
  consumoMedicamentos: boolean;
  consumoMedicamentosDetalle?: string;
  embarazo?: boolean;
  nivelLectoescritura: boolean;

  // Autorización de datos
  autorizacionDatos: boolean;

  // Documentos y validaciones
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

export const NIVEL_PREVIO_LABELS: Record<NivelPrevio, string> = {
  trabajador_autorizado: 'Trabajador Autorizado',
  avanzado: 'Avanzado Trabajo en Alturas',
};

export const TIPO_VINCULACION_LABELS: Record<TipoVinculacion, string> = {
  empresa: 'Empresa',
  independiente: 'Independiente',
};

export const NIVEL_FORMACION_EMPRESA_LABELS: Record<NivelFormacionEmpresa, string> = {
  jefe_area: 'Jefe de Área',
  trabajador_autorizado: 'Trabajador Autorizado',
  reentrenamiento: 'Reentrenamiento',
  coordinador_ta: 'Coordinador T.A.',
};
