/**
 * Listener SAFA: sincroniza `portal_config_documentos` cuando un formato
 * cambia su visibilidad / estado activo.
 *
 * Antes vivía dentro de `formatoFormacionService.ts`. Ahora reacciona al
 * evento `formato.visibilityChanged` que emite el Gateway.
 */
import { supabase } from '@/integrations/supabase/client';
import { formatosGateway } from '@/modules/formatos';
import type { Formato } from '@/modules/formatos';

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

// Cache del último resultado para que el llamante (hook de update) lo recupere.
const lastPortalSync = new Map<string, PortalSyncResult>();

let registered = false;
export function registerPortalSyncListener() {
  if (registered) return;
  registered = true;
  formatosGateway.events.on('formato.visibilityChanged', async (e) => {
    const { formato } = e.payload as { formato: Formato };
    const result = await syncPortalConfig(formato);
    lastPortalSync.set(formato.id, result);
  });
}

export function consumePortalSync(formatoId: string): PortalSyncResult {
  const result = lastPortalSync.get(formatoId) ?? { changed: false };
  lastPortalSync.delete(formatoId);
  return result;
}
