import { DocumentoPortalConfig, TipoDocPortal, DocumentoPortalKey } from './portalEstudiante';
import { TipoFormacion } from './curso';

export interface PortalDocumentoConfigAdmin extends DocumentoPortalConfig {
  habilitadoPorNivel: Record<TipoFormacion, boolean>;
}

export interface PortalConfigGlobal {
  portalActivoPorDefecto: boolean;
  documentos: PortalDocumentoConfigAdmin[];
}
