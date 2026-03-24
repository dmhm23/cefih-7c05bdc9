import { mockNivelesFormacion } from "@/data/mockData";

const LEGACY_LABELS: Record<string, string> = {
  jefe_area: "Jefe de Área",
  trabajador_autorizado: "Trabajador Autorizado",
  reentrenamiento: "Reentrenamiento",
  coordinador_ta: "Coordinador T.A.",
};

/**
 * Resuelve dinámicamente el label de un nivel/tipo de formación.
 * Busca por id → por nombreNivel → fallback legacy → valor crudo.
 * Sirve tanto para matrículas como para cursos y cualquier módulo.
 */
function resolve(value: string | undefined): string {
  if (!value) return "";
  const byId = mockNivelesFormacion.find((n) => n.id === value);
  if (byId) return byId.nombreNivel;
  const byName = mockNivelesFormacion.find((n) => n.nombreNivel === value);
  if (byName) return byName.nombreNivel;
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
 * para usar en selects, reemplazando TIPO_FORMACION_OPTIONS hardcoded.
 */
export function getNivelesAsOptions(): { value: string; label: string }[] {
  return mockNivelesFormacion.map((n) => ({ value: n.id, label: n.nombreNivel }));
}
