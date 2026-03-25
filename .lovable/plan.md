

## Plan: Agregar barra flotante de acciones masivas en tabla de estudiantes inscritos

### Decisión de diseño

La aplicación ya usa el componente `BulkActionsBar` (barra flotante inferior) en todas las tablas con selección múltiple (`DataTable` lo integra automáticamente). La tabla de `EnrollmentsTable` es una tabla custom que no usa `DataTable`, por lo que no tiene esta barra. **La mejor opción es reutilizar `BulkActionsBar`** directamente, manteniendo consistencia con el resto de la app y sin modificar el botón "Generar certificados" del header.

### Cambios — `src/components/cursos/EnrollmentsTable.tsx`

1. **Importar** `BulkActionsBar` y `BulkAction` desde `@/components/shared/BulkActionsBar`
2. **Eliminar el botón "Generar certificados" del header** (líneas 328-337), ya que la acción se moverá a la barra flotante
3. **Agregar `<BulkActionsBar>`** al final del componente con dos acciones:
   - **Generar certificados** (`Award` icon) → ejecuta `handleGeneracionMasiva` con los IDs seleccionados
   - **Eliminar seleccionados** (`Trash2` icon, variant `destructive`) → abre un `ConfirmDialog` de confirmación y luego ejecuta `removerEstudiante` para cada ID seleccionado
4. **Agregar estado** `bulkDeleteConfirm` para el diálogo de confirmación de eliminación masiva
5. **Agregar función** `handleBulkDelete` que itera sobre los IDs seleccionados, llama `removerEstudiante.mutateAsync` para cada uno, muestra toast de éxito y limpia la selección

### Archivo modificado
- `src/components/cursos/EnrollmentsTable.tsx`

