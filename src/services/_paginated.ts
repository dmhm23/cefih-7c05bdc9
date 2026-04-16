/**
 * Helper para superar el límite máximo de PostgREST (1000 filas por request).
 *
 * Ejecuta múltiples SELECTs paginados con `.range(from, to)` en bloques de
 * `pageSize` (por defecto 1000) hasta agotar los datos. Devuelve el array
 * completo, transparente para el código que lo consume.
 *
 * Uso:
 * ```ts
 * const data = await fetchAllPaginated<any>((from, to) =>
 *   supabase.from('personas').select('*').is('deleted_at', null).order('nombres').range(from, to)
 * );
 * ```
 *
 * Notas:
 * - El callback debe construir la query completa incluyendo `.range(from, to)`.
 * - Termina cuando una página devuelve menos de `pageSize` filas.
 * - Si una página falla, propaga el error (no se reintenta).
 */
export async function fetchAllPaginated<T = any>(
  buildQuery: (from: number, to: number) => any,
  pageSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  // Hard cap defensivo para evitar bucles infinitos por error de configuración.
  // 100 páginas × 1000 = 100.000 filas. Más allá, algo está mal.
  const MAX_PAGES = 100;
  let page = 0;

  while (page < MAX_PAGES) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < pageSize) break; // última página
    from += pageSize;
    page++;
  }

  return all;
}
