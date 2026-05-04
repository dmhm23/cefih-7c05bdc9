/**
 * Helper centralizado para resolver el label visible de un campo parametrizado
 * que admite la opción "Otra" / "Otro" con texto libre asociado.
 *
 * Reglas:
 * 1. Si el value coincide con un sentinel "Otra" (otra_arl, otro_sector, otra_eps...):
 *    - retorna el texto libre si está presente y no vacío
 *    - retorna "Otra (sin especificar)" si el texto libre está vacío
 * 2. En caso contrario, busca el label en la lista de opciones.
 * 3. Si no encuentra coincidencia, retorna el value tal cual.
 * 4. Si el value es vacío/nulo, retorna "".
 */

export interface CatalogOption {
  value: string;
  label: string;
}

/** Sentinels conocidos en la BD para opciones "Otra" */
const OTRA_SENTINELS = new Set<string>([
  "otra_arl",
  "otro_sector",
  "otra_eps",
]);

export function isOtraValue(value: string | null | undefined): boolean {
  if (!value) return false;
  if (OTRA_SENTINELS.has(value)) return true;
  // Heurística defensiva por si llegan otros sentinels en el futuro
  return /^otr[ao]_/.test(value);
}

export function resolveCatalogLabel(
  value: string | null | undefined,
  freeText: string | null | undefined,
  options: ReadonlyArray<CatalogOption>,
): string {
  if (!value) return "";
  if (isOtraValue(value)) {
    const txt = (freeText || "").trim();
    return txt.length > 0 ? txt : "Otra (sin especificar)";
  }
  const found = options.find((o) => o.value === value);
  return found ? found.label : value;
}
