import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { catalogoService, CatalogoNombre, CatalogoOpcion } from "@/services/catalogoService";

const KEY = (c: CatalogoNombre, onlyActive: boolean) => ["catalogo_opciones", c, onlyActive];

export function useCatalogo(catalogo: CatalogoNombre, opts: { onlyActive?: boolean } = {}) {
  const onlyActive = opts.onlyActive ?? true;
  return useQuery({
    queryKey: KEY(catalogo, onlyActive),
    queryFn: () => catalogoService.list(catalogo, { onlyActive }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCatalogoMutations(catalogo: CatalogoNombre) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["catalogo_opciones", catalogo] });
  };
  const create = useMutation({
    mutationFn: (label: string) => catalogoService.create(catalogo, label),
    onSuccess: invalidate,
  });
  const updateLabel = useMutation({
    mutationFn: ({ id, label }: { id: string; label: string }) => catalogoService.updateLabel(id, label),
    onSuccess: invalidate,
  });
  const setActivo = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => catalogoService.setActivo(id, activo),
    onSuccess: invalidate,
  });
  return { create, updateLabel, setActivo };
}

/**
 * Helper: convierte opciones del catálogo a {value,label}[] para selects.
 * Si `currentValue` está presente y no aparece en `options` (por estar inactiva
 * o eliminada), se inyecta al final marcada como "(inactiva)" para no perder
 * el valor durante la edición.
 */
export function toSelectOptions(
  options: CatalogoOpcion[] | undefined,
  currentValue?: string | null,
): Array<{ value: string; label: string }> {
  const list = (options ?? []).map((o) => ({ value: o.value, label: o.label }));
  if (currentValue && !list.some((o) => o.value === currentValue)) {
    list.push({ value: currentValue, label: `${currentValue} (inactiva)` });
  }
  return list;
}
