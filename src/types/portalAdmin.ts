import { DocumentoPortalConfig, TipoDocPortal, DocumentoPortalKey } from './portalEstudiante';

export interface PortalDocumentoConfigAdmin extends DocumentoPortalConfig {
  nivelesHabilitados: string[]; // UUID[] of niveles_formacion
}

export interface PortalConfigGlobal {
  portalActivoPorDefecto: boolean;
  documentos: PortalDocumentoConfigAdmin[];
}
