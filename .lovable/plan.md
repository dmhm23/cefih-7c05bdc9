

## Plan: Cambiar filtro de nivel de formación a dropdown simple

### Cambio

En `src/components/cursos/CursosListView.tsx`, cambiar el filtro `tipoFormacion` de `multiselect` a `select` (igual que el de estado), y ajustar la lógica de filtrado para comparar un string en vez de un array.

### Detalle

1. En `filterConfigs`, cambiar `type: "multiselect"` → `type: "select"` para `tipoFormacion`
2. Inicializar `filters.tipoFormacion` como `"todos"` en vez de `[]`
3. Actualizar lógica de filtrado: `filters.tipoFormacion === "todos" || c.tipoFormacion === filters.tipoFormacion`
4. Actualizar `handleClearFilters` para resetear a `"todos"`

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/components/cursos/CursosListView.tsx` | Cambiar tipo de filtro y ajustar lógica |

