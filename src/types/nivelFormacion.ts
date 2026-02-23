export type DocumentoReqKey =
  | 'cedula'
  | 'examen_medico'
  | 'certificado_eps'
  | 'arl'
  | 'planilla_seguridad_social'
  | 'curso_previo';

export type TipoCampoAdicional =
  | 'texto_corto'
  | 'texto_largo'
  | 'numerico'
  | 'select'
  | 'select_multiple'
  | 'estado'
  | 'fecha'
  | 'fecha_hora'
  | 'booleano'
  | 'archivo'
  | 'url'
  | 'telefono'
  | 'email';

export type AlcanceCampo =
  | 'solo_nivel'
  | 'todos_los_niveles';

export interface CampoAdicional {
  id: string;
  nombre: string;
  tipo: TipoCampoAdicional;
  obligatorio: boolean;
  valorPorDefecto?: string;
  opciones?: string[]; // Solo para select / select_multiple
  alcance: AlcanceCampo;
}

export interface NivelFormacion {
  id: string;
  nombreNivel: string;
  duracionHoras?: number;
  duracionDias?: number;
  documentosRequeridos: string[];
  camposAdicionales?: CampoAdicional[];
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

export const TIPOS_CAMPO_LABELS: Record<TipoCampoAdicional, string> = {
  texto_corto: 'Texto corto',
  texto_largo: 'Texto largo',
  numerico: 'Campo numérico',
  select: 'Lista desplegable',
  select_multiple: 'Select múltiple',
  estado: 'Estado (activo/inactivo)',
  fecha: 'Fecha',
  fecha_hora: 'Fecha y hora',
  booleano: 'Campo booleano (switch)',
  archivo: 'Subida de archivo',
  url: 'URL',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
};
