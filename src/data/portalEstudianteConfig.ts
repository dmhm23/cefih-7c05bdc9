import { DocumentoPortalConfig } from '@/types/portalEstudiante';
import { portalDocumentosCatalogo } from './portalAdminConfig';

// Derived from admin catalog — single source of truth
export const PORTAL_DOCUMENTOS_CONFIG: DocumentoPortalConfig[] = portalDocumentosCatalogo.map(
  ({ habilitadoPorNivel, ...config }) => config
);
