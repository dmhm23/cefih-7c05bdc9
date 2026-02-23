import { mockNivelesFormacion } from "@/data/mockData";

/**
 * Resuelve el label de un nivel de formación desde los datos del módulo de Niveles.
 * Fallback: busca por id, luego por nombreNivel, y si no coincide muestra el valor tal cual.
 */
export function resolveNivelFormacionLabel(value: string | undefined): string {
  if (!value) return "";
  const byId = mockNivelesFormacion.find((n) => n.id === value);
  if (byId) return byId.nombreNivel;
  const byName = mockNivelesFormacion.find((n) => n.nombreNivel === value);
  if (byName) return byName.nombreNivel;
  // Legacy fallback labels
  const legacyLabels: Record<string, string> = {
    jefe_area: "Jefe de Área",
    trabajador_autorizado: "Trabajador Autorizado",
    reentrenamiento: "Reentrenamiento",
    coordinador_ta: "Coordinador T.A.",
  };
  return legacyLabels[value] || value;
}
