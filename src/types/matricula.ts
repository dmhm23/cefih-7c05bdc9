import { PortalEstudianteData } from './portalEstudiante';

export type EstadoMatricula = 
  | 'creada' 
  | 'pendiente' 
  | 'completa' 
  | 'certificada' 
  | 'cerrada';

export type FormaPago = 
  | 'efectivo'
  | 'transferencia'
  | 'consignacion'
  | 'tarjeta'
  | 'otro';

export type NivelPrevio = 'trabajador_autorizado' | 'avanzado';

export type TipoVinculacion = 'empresa' | 'independiente' | 'arl';

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
  | 'cargado';

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
  archivoNombre?: string;
  archivoTamano?: number;
}

export interface Matricula {
  id: string;
  personaId: string;
  cursoId: string;
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
  eps?: string;
  epsOtra?: string;
  arl?: string;
  arlOtra?: string;
  
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

  // Información de cobros / cartera
  cobroContactoNombre?: string;     // Persona contacto de la empresa (cobros)
  cobroContactoCelular?: string;    // Celular del contacto
  valorCupo?: number;               // Valor del cupo
  abono?: number;                   // Abono realizado
  // saldo se calcula: valorCupo - abono
  fechaFacturacion?: string;        // Fecha de facturación
  ctaFactNumero?: string;           // No. CTA-FACT
  ctaFactTitular?: string;          // Titular
  fechaPago?: string;               // Fecha de pago
  formaPago?: FormaPago;            // Forma de pago

  pagado: boolean;
  facturaNumero?: string;           // Legacy — se mantiene por compatibilidad

  // Certificado
  fechaGeneracionCertificado?: string;  // Automático al generar PDF
  fechaEntregaCertificado?: string;     // Manual por el usuario

  // Evaluaciones editables en formato
  autoevaluacionRespuestas?: string[];
  evaluacionCompetenciasRespuestas?: string[];

  // Evaluación Reentrenamiento — respuestas individuales (índice de opción seleccionada por pregunta)
  evaluacionRespuestas?: number[];

  // Encuesta de satisfacción (4 escalas + 1 Sí/No = 5 elementos)
  encuestaRespuestas?: string[];

  // Portal Estudiante
  portalEstudiante?: PortalEstudianteData;

  // Observaciones
  observaciones?: string;

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


export const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  consignacion: 'Consignación',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

export const NIVEL_PREVIO_LABELS: Record<NivelPrevio, string> = {
  trabajador_autorizado: 'Trabajador Autorizado',
  avanzado: 'Avanzado Trabajo en Alturas',
};

export const TIPO_VINCULACION_LABELS: Record<TipoVinculacion, string> = {
  empresa: 'Empresa',
  independiente: 'Independiente',
  arl: 'ARL',
};

export const NIVEL_FORMACION_EMPRESA_LABELS: Record<NivelFormacionEmpresa, string> = {
  jefe_area: 'Jefe de Área',
  trabajador_autorizado: 'Trabajador Autorizado',
  reentrenamiento: 'Reentrenamiento',
  coordinador_ta: 'Coordinador T.A.',
};
