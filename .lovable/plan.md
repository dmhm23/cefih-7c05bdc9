

## Plan: Agregar filtro por nivel de formación en cursos

### Cambio

Añadir un segundo filtro tipo `multiselect` en el `FilterPopover` de `CursosListView` que permita filtrar cursos por nivel de formación. Usa `getNivelesAsOptions()` (ya existe) para obtener las opciones dinámicamente.

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/components/cursos/CursosListView.tsx` | Agregar filtro `tipoFormacion` multiselect + lógica de filtrado |

### Detalle

1. Importar `getNivelesAsOptions` desde `@/utils/resolveNivelLabel`
2. Agregar a `filterConfigs` un segundo filtro:
   ```typescript
   { key: "tipoFormacion", label: "Nivel de Formación", type: "multiselect", options: getNivelesAsOptions() }
   ```
3. Inicializar `filters` con `tipoFormacion: []`
4. Agregar lógica en `filteredCursos`:
   ```typescript
   const matchesNivel = (filters.tipoFormacion as string[]).length === 0 
     || (filters.tipoFormacion as string[]).includes(c.tipoFormacion);
   ```
5. Actualizar `handleClearFilters` para resetear `tipoFormacion: []`

