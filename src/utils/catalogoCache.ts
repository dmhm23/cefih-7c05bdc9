/**
 * Caché síncrona en memoria para opciones de catálogo (ARL y Sector económico).
 *
 * Se hidrata al arrancar la app (`preloadCatalogos`) y vuelve a hidratarse
 * automáticamente cada vez que el admin crea/edita opciones (vía React Query
 * onSuccess en `useCatalogoMutations` → invalida `catalogo_opciones`, y este
 * módulo expone `refreshCatalogos` para refrescar la caché sync).
 *
 * Sirve para utilidades sync (CSV, exportadores, plantillas Excel) y para
 * componentes de vista que ya pasan opciones a `resolveCatalogLabel`.
 *
 * Si la caché aún no está cargada o falla, el getter cae al fallback estático
 * de `formOptions.ts` para no romper la UI.
 */
import { supabase } from "@/integrations/supabase/client";
import { ARL_OPTIONS, SECTORES_ECONOMICOS } from "@/data/formOptions";
import type { CatalogoNombre } from "@/services/catalogoService";

export interface CatalogOpt {
  value: string;
  label: string;
  activo: boolean;
}

const FALLBACK: Record<CatalogoNombre, CatalogOpt[]> = {
  arl: ARL_OPTIONS.map(o => ({ value: o.value, label: o.label, activo: true })),
  sector_economico: SECTORES_ECONOMICOS.map(o => ({ value: o.value, label: o.label, activo: true })),
};

const cache: Record<CatalogoNombre, CatalogOpt[] | null> = {
  arl: null,
  sector_economico: null,
};

let inflight: Promise<void> | null = null;

export async function preloadCatalogos(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const { data, error } = await supabase
        .from("catalogo_opciones" as any)
        .select("catalogo,value,label,activo,orden")
        .order("orden", { ascending: true });
      if (error) throw error;
      const arl: CatalogOpt[] = [];
      const sec: CatalogOpt[] = [];
      for (const r of (data ?? []) as any[]) {
        const opt: CatalogOpt = { value: r.value, label: r.label, activo: !!r.activo };
        if (r.catalogo === "arl") arl.push(opt);
        else if (r.catalogo === "sector_economico") sec.push(opt);
      }
      cache.arl = arl;
      cache.sector_economico = sec;
    } catch (e) {
      console.error("[catalogoCache] preload fallido, usando fallback:", e);
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export function refreshCatalogos(): Promise<void> {
  cache.arl = null;
  cache.sector_economico = null;
  return preloadCatalogos();
}

/** Devuelve TODAS las opciones (activas + inactivas) — útil para resolver labels históricos. */
export function getCatalogoOptions(catalogo: CatalogoNombre): CatalogOpt[] {
  return cache[catalogo] ?? FALLBACK[catalogo];
}

/** Devuelve sólo las opciones activas — útil para selects de creación/edición. */
export function getCatalogoOptionsActive(catalogo: CatalogoNombre): CatalogOpt[] {
  return getCatalogoOptions(catalogo).filter(o => o.activo);
}
