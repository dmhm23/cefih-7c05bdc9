import type { TipoFormacion } from './curso';

export type EstadoCertificado = 'elegible' | 'generado' | 'bloqueado' | 'revocado';
export type EstadoExcepcion = 'pendiente' | 'aprobada' | 'rechazada';

export interface CertificadoGenerado {
  id: string;
  matriculaId: string;
  cursoId: string;
  personaId: string;
  plantillaId: string;
  codigo: string;
  estado: EstadoCertificado;
  snapshotDatos: Record<string, unknown>;
  svgFinal: string;
  version: number;
  fechaGeneracion: string;
  revocadoPor?: string;
  motivoRevocacion?: string;
  fechaRevocacion?: string;
  autorizadoExcepcional?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlantillaVersion {
  version: number;
  svgRaw: string;
  fecha: string;
  modificadoPor: string;
}

export interface ReglaTipoCertificado {
  requierePago: boolean;
  requiereDocumentos: boolean;
  requiereFormatos: boolean;
  incluyeEmpresa: boolean;
  incluyeFirmas: boolean;
}

export interface PlantillaCertificado {
  id: string;
  nombre: string;
  svgRaw: string;
  tokensDetectados: string[];
  activa: boolean;
  version: number;
  historial: PlantillaVersion[];
  // Campos fusionados desde TipoCertificado
  tipoFormacion: TipoFormacion;
  reglaCodigo: string;
  reglas: ReglaTipoCertificado;
  nivelesAsignados: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SolicitudExcepcionCertificado {
  id: string;
  matriculaId: string;
  solicitadoPor: string;
  motivo: string;
  estado: EstadoExcepcion;
  resueltoPor?: string;
  fechaSolicitud: string;
  fechaResolucion?: string;
}

export interface SvgEditableNode {
  id: string;
  type: 'text' | 'group';
  content?: string;
  attrs: Record<string, string>;
  visible: boolean;
}

export interface PlantillaTagMapping {
  elementId: string;
  currentContent: string;
  mappedToken: string | null;
}

export type CertificadoFormData = Omit<CertificadoGenerado, 'id' | 'createdAt' | 'updatedAt'>;
export type PlantillaFormData = Omit<PlantillaCertificado, 'id' | 'createdAt' | 'updatedAt' | 'historial' | 'tokensDetectados'>;
