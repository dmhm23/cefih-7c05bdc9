import { useCallback } from "react";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";

const LEGACY_LABELS: Record<string, string> = {
  jefe_area: "Jefe de Área",
  trabajador_autorizado: "Trabajador Autorizado",
  reentrenamiento: "Reentrenamiento",
  coordinador_ta: "Coordinador T.A.",
};

/**
 * Hook reactivo que resuelve el nombre de un nivel de formación
 * a partir de su UUID o slug legacy usando datos de React Query.
 */
export function useResolveNivel() {
  const { data: niveles = [] } = useNivelesFormacion();

  const resolve = useCallback(
    (idOrSlug?: string | null): string => {
      if (!idOrSlug) return "";
      // Try matching by UUID
      const byId = niveles.find((n) => n.id === idOrSlug);
      if (byId) return byId.nombreNivel;
      // Fallback to legacy labels
      return LEGACY_LABELS[idOrSlug] || idOrSlug;
    },
    [niveles]
  );

  return resolve;
}
