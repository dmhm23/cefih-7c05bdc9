export type DocumentoPortalKey = 'info_aprendiz' | 'evaluacion' | string;
export type EstadoDocPortal = 'bloqueado' | 'pendiente' | 'completado';
export type TipoDocPortal = 'firma_autorizacion' | 'evaluacion' | 'formulario' | 'solo_lectura';

export interface DocumentoPortalConfig {
  key: DocumentoPortalKey;
  nombre: string;
  tipo: TipoDocPortal;
  requiereFirma: boolean;
  dependeDe: DocumentoPortalKey[];
  orden: number;
}

export interface DocumentoPortalEstado {
  key: DocumentoPortalKey;
  estado: EstadoDocPortal;
  enviadoEn?: string;
  firmaBase64?: string;
  firmaFecha?: string;
  puntaje?: number;
  respuestas?: unknown;
  metadata?: Record<string, unknown>;
  intentos?: DocumentoPortalEstado[];
}

export interface PortalEstudianteData {
  habilitado: boolean;
  documentos: DocumentoPortalEstado[];
}
