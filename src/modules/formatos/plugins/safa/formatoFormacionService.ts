/**
 * Wrapper SAFA del gateway de formatos.
 *
 * Mantiene la API histórica (`formatoFormacionService.*`) que usan los hooks
 * y delega al `formatosGateway`. La sincronización con
 * `portal_config_documentos` se conecta vía listener interno en
 * `plugins/safa/listeners/portalSyncListener.ts`.
 */
import { formatosGateway } from '@/modules/formatos';
import type {
  Formato,
  FormatoFormData as CoreFormData,
  FormatoVersion,
} from '@/modules/formatos';
import type {
  FormatoFormacion,
  FormatoFormacionFormData,
  PlantillaBase,
} from './types';
import {
  registerPortalSyncListener,
  consumePortalSync,
  type PortalSyncResult,
} from './listeners/portalSyncListener';

export type { PortalSyncResult };

// Conectamos el listener una sola vez al cargar el plugin SAFA.
registerPortalSyncListener();

const PLANTILLAS_BASE: PlantillaBase[] = [
  {
    id: 'pb-registro',
    nombre: 'Registro de Actividad',
    descripcion: 'Plantilla base para registros y formatos de seguimiento',
    categoria: 'formacion',
    htmlTemplate: `<h2 style="text-align:center;margin-bottom:24px;">REGISTRO DE ACTIVIDAD</h2>\n<table style="width:100%;border-collapse:collapse;margin:16px 0;">\n<tr><td style="border:1px solid #ccc;padding:8px;width:30%;font-weight:bold;">Participante</td><td style="border:1px solid #ccc;padding:8px;">{{persona.nombreCompleto}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Documento</td><td style="border:1px solid #ccc;padding:8px;">{{persona.numeroDocumento}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Curso</td><td style="border:1px solid #ccc;padding:8px;">{{curso.nombre}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Empresa</td><td style="border:1px solid #ccc;padding:8px;">{{empresa.nombre}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Fecha</td><td style="border:1px solid #ccc;padding:8px;">{{sistema.fechaDiligenciamiento}}</td></tr>\n</table>`,
  },
];

const cast = <T,>(x: unknown) => x as T;

export const formatoFormacionService = {
  getAll: () => formatosGateway.getFormatos().then(cast<FormatoFormacion[]>),

  getById: (id: string) =>
    formatosGateway.getFormatoById(id).then(cast<FormatoFormacion | undefined>),

  create: (data: FormatoFormacionFormData) =>
    formatosGateway.saveFormato(data as unknown as CoreFormData).then(cast<FormatoFormacion>),

  update: async (id: string, data: Partial<FormatoFormacionFormData>) => {
    const f = await formatosGateway.updateFormato(id, data as unknown as Partial<CoreFormData>);
    // Esperamos un microtask para que el listener termine.
    await new Promise((r) => setTimeout(r, 0));
    const portalSync = consumePortalSync(f.id);
    return { ...(f as unknown as FormatoFormacion), __portalSync: portalSync };
  },

  toggleActivo: (id: string) =>
    formatosGateway.toggleActivo(id).then(cast<FormatoFormacion>),

  duplicate: (id: string) =>
    formatosGateway.duplicateFormato(id).then(cast<FormatoFormacion>),

  search: (q: string) =>
    formatosGateway.searchFormatos(q).then(cast<FormatoFormacion[]>),

  getForMatricula: (matriculaId: string) =>
    formatosGateway.getFormatosForSubject(matriculaId).then(cast<FormatoFormacion[]>),

  saveVersion: (formatoId: string) =>
    formatosGateway.saveVersion(formatoId) as Promise<FormatoVersion>,

  getVersiones: (formatoId: string) =>
    formatosGateway.getVersions(formatoId) as Promise<FormatoVersion[]>,

  restoreVersion: (formatoId: string, versionId: string) =>
    formatosGateway.restoreVersion(formatoId, versionId).then(cast<FormatoFormacion>),

  archive: (id: string) =>
    formatosGateway.archiveFormato(id).then(cast<FormatoFormacion>),

  delete: (id: string) => formatosGateway.deleteFormato(id),

  getPlantillasBase: async (): Promise<PlantillaBase[]> => PLANTILLAS_BASE,
};
