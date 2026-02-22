export type DocumentoReqKey =
  | 'cedula'
  | 'examen_medico'
  | 'certificado_eps'
  | 'arl'
  | 'planilla_seguridad_social'
  | 'curso_previo';

export interface NivelFormacion {
  id: string;
  nombreNivel: string;
  tipoCertificacion?: string;
  duracionHoras?: number;
  duracionDias?: number;
  consecutivo: string;
  documentosRequeridos: DocumentoReqKey[];
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export type NivelFormacionFormData = Omit<NivelFormacion, 'id' | 'createdAt' | 'updatedAt'>;

export const CATALOGO_DOCUMENTOS: { key: DocumentoReqKey; label: string }[] = [
  { key: 'cedula', label: 'Cédula de Ciudadanía' },
  { key: 'examen_medico', label: 'Examen Médico Ocupacional' },
  { key: 'certificado_eps', label: 'Certificado EPS' },
  { key: 'arl', label: 'Afiliación ARL' },
  { key: 'planilla_seguridad_social', label: 'Planilla de Seguridad Social' },
  { key: 'curso_previo', label: 'Certificado de Curso Previo' },
];
