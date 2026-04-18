/**
 * Wrapper SAFA sobre `@/modules/formatos`.
 *
 * Mantiene la API histórica que consumen los hooks (`useFormatos`, etc.) pero
 * delega toda la lógica al `formatosGateway`. El side-effect de
 * sincronización con `portal_config_documentos` se conecta vía evento
 * `formato.visibilityChanged` (Fase E del refactor) en lugar de estar
 * acoplado dentro del servicio.
 */
import { supabase } from '@/integrations/supabase/client';
import { formatosGateway } from '@/modules/formatos';
import type {
  Formato,
  FormatoFormData as CoreFormData,
} from '@/modules/formatos';
import type {
  FormatoFormacion,
  FormatoFormacionFormData,
  FormatoVersion,
  PlantillaBase,
} from '@/types/formatoFormacion';

// ---------------------------------------------------------------------------
// SAFA host: side-effect que sincroniza portal_config_documentos cuando un
// formato cambia visibilidad. Antes vivía dentro del servicio, ahora
// reacciona al evento del Gateway.
// ---------------------------------------------------------------------------

export type PortalSyncResult =
  | { changed: false }
  | { changed: true; action: 'added' | 'reactivated' | 'updated' | 'deactivated' };

function categoriaToPorTipo(categoria: string): string {
  switch (categoria) {
    case 'evaluacion': return 'evaluacion';
    case 'seguridad': return 'firma_autorizacion';
    default: return 'formulario';
  }
}

async function syncPortalConfig(formato: Formato): Promise<PortalSyncResult> {
  try {
    const { data: existing } = await supabase
      .from('portal_config_documentos')
      .select('id, activo, label, niveles_habilitados')
      .eq('formato_id', formato.id)
      .maybeSingle();

    if (formato.visibleEnPortalEstudiante && formato.activo) {
      if (existing) {
        const niveles = formato.nivelFormacionIds || [];
        const currentNiveles = (existing.niveles_habilitados as string[]) || [];
        const sameLabel = existing.label === formato.nombre;
        const sameNiveles =
          currentNiveles.length === niveles.length &&
          currentNiveles.every((n) => niveles.includes(n));

        if (!existing.activo) {
          await supabase.from('portal_config_documentos').update({
            activo: true, label: formato.nombre, niveles_habilitados: niveles,
          }).eq('id', existing.id);
          return { changed: true, action: 'reactivated' };
        }
        if (!sameLabel || !sameNiveles) {
          await supabase.from('portal_config_documentos').update({
            label: formato.nombre, niveles_habilitados: niveles,
          }).eq('id', existing.id);
          return { changed: true, action: 'updated' };
        }
        return { changed: false };
      }

      const { data: maxOrden } = await supabase
        .from('portal_config_documentos')
        .select('orden')
        .order('orden', { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextOrden = ((maxOrden?.orden as number) || 0) + 1;

      await supabase.from('portal_config_documentos').insert({
        key: formato.id,
        label: formato.nombre,
        tipo: categoriaToPorTipo(formato.categoria) as any,
        descripcion: formato.descripcion || '',
        orden: nextOrden,
        formato_id: formato.id,
        niveles_habilitados: formato.nivelFormacionIds || [],
        depende_de: [],
        activo: true,
        obligatorio: true,
      } as any);
      return { changed: true, action: 'added' };
    }

    if (existing && existing.activo) {
      await supabase.from('portal_config_documentos').update({ activo: false }).eq('id', existing.id);
      return { changed: true, action: 'deactivated' };
    }
    return { changed: false };
  } catch (e) {
    console.warn('Error syncing portal config:', e);
    return { changed: false };
  }
}

// El último resultado se cachea para que el hook que llama a `update`
// pueda exponerlo vía `__portalSync` sin cambiar su firma.
let lastPortalSync = new Map<string, PortalSyncResult>();
formatosGateway.events.on('formato.visibilityChanged', async (e) => {
  const { formato } = e.payload as { formato: Formato };
  const result = await syncPortalConfig(formato);
  lastPortalSync.set(formato.id, result);
});

// ---------------------------------------------------------------------------
// Plantillas base estáticas (legacy)
// ---------------------------------------------------------------------------

const PLANTILLAS_BASE: PlantillaBase[] = [
  {
    id: 'pb-registro',
    nombre: 'Registro de Actividad',
    descripcion: 'Plantilla base para registros y formatos de seguimiento',
    categoria: 'formacion',
    htmlTemplate: `<h2 style="text-align:center;margin-bottom:24px;">REGISTRO DE ACTIVIDAD</h2>\n<table style="width:100%;border-collapse:collapse;margin:16px 0;">\n<tr><td style="border:1px solid #ccc;padding:8px;width:30%;font-weight:bold;">Participante</td><td style="border:1px solid #ccc;padding:8px;">{{persona.nombreCompleto}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Documento</td><td style="border:1px solid #ccc;padding:8px;">{{persona.numeroDocumento}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Curso</td><td style="border:1px solid #ccc;padding:8px;">{{curso.nombre}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Empresa</td><td style="border:1px solid #ccc;padding:8px;">{{empresa.nombre}}</td></tr>\n<tr><td style="border:1px solid #ccc;padding:8px;font-weight:bold;">Fecha</td><td style="border:1px solid #ccc;padding:8px;">{{sistema.fechaDiligenciamiento}}</td></tr>\n</table>`,
  },
];

// ---------------------------------------------------------------------------
// Helpers de adaptación tipo (Formato genérico ↔ FormatoFormacion del host)
// La forma es idéntica; sólo se castea para no romper consumidores existentes.
// ---------------------------------------------------------------------------

const cast = <T>(x: unknown) => x as T;

// ---------------------------------------------------------------------------
// API histórica (delega al Gateway)
// ---------------------------------------------------------------------------

export const formatoFormacionService = {
  getAll: () => formatosGateway.getFormatos().then(cast<FormatoFormacion[]>),

  getById: (id: string) =>
    formatosGateway.getFormatoById(id).then(cast<FormatoFormacion | undefined>),

  create: (data: FormatoFormacionFormData) =>
    formatosGateway.saveFormato(data as unknown as CoreFormData).then(cast<FormatoFormacion>),

  update: async (id: string, data: Partial<FormatoFormacionFormData>) => {
    const f = await formatosGateway.updateFormato(id, data as unknown as Partial<CoreFormData>);
    // El handler async puede aún no haber terminado; esperamos un microtask.
    await new Promise((r) => setTimeout(r, 0));
    const portalSync = lastPortalSync.get(f.id) ?? { changed: false };
    lastPortalSync.delete(f.id);
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
