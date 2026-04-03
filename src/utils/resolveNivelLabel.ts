import { supabase } from "@/integrations/supabase/client";

// In-memory cache for niveles loaded from Supabase
let _cache: { id: string; nombre: string }[] | null = null;
let _cachePromise: Promise<{ id: string; nombre: string }[]> | null = null;

const LEGACY_LABELS: Record<string, string> = {
  jefe_area: "Jefe de Área",
  trabajador_autorizado: "Trabajador Autorizado",
  reentrenamiento: "Reentrenamiento",
  coordinador_ta: "Coordinador T.A.",
};

async function loadNiveles(): Promise<{ id: string; nombre: string }[]> {
  if (_cache) return _cache;
  if (_cachePromise) return _cachePromise;
  _cachePromise = (async () => {
    const { data, error } = await supabase
      .from("niveles_formacion")
      .select("id, nombre")
      .is("deleted_at", null)
      .order("nombre");
    if (error) {
      console.error("Error loading niveles_formacion:", error);
      return [];
    }
    _cache = (data || []).map((r) => ({ id: r.id, nombre: r.nombre }));
    return _cache;
  })();
  return _cachePromise;
}

/** Force cache refresh (call after creating/updating niveles) */
export function invalidateNivelesCache() {
  _cache = null;
  _cachePromise = null;
}

/** Get cached niveles synchronously (returns [] if not loaded yet) */
export function getCachedNiveles(): { id: string; nombre: string }[] {
  return _cache || [];
}

/** Preload niveles into cache */
export async function preloadNiveles() {
  await loadNiveles();
}

/**
 * Resuelve dinámicamente el label de un nivel/tipo de formación.
 * Busca por id → por nombre → fallback legacy → valor crudo.
 * Usa cache síncrona; si no está cargada aún, retorna el valor crudo.
 */
function resolve(value: string | undefined): string {
  if (!value) return "";
  const niveles = _cache || [];
  const byId = niveles.find((n) => n.id === value);
  if (byId) return byId.nombre;
  const byName = niveles.find((n) => n.nombre === value);
  if (byName) return byName.nombre;
  return LEGACY_LABELS[value] || value;
}

/** Resuelve el label de un nivel de formación (usado en matrículas). */
export function resolveNivelFormacionLabel(value: string | undefined): string {
  return resolve(value);
}

/** Resuelve el label del tipo de formación de un curso. */
export function resolveNivelCursoLabel(value: string | undefined): string {
  return resolve(value);
}

/**
 * Devuelve todos los niveles dinámicos como opciones { value, label }
 * para usar en selects. Usa cache síncrona.
 */
export function getNivelesAsOptions(): { value: string; label: string }[] {
  return (_cache || []).map((n) => ({ value: n.id, label: n.nombre }));
}
