

## Plan: Selección múltiple y eliminación masiva en Gestión de Formatos

### Cambios en `src/pages/formatos/FormatosPage.tsx`

1. **Habilitar selección múltiple** — Agregar props `selectable`, `selectedIds`, `onSelectionChange` y `bulkActions` al `DataTable` existente
2. **Estado de selección** — Agregar `selectedIds: string[]` y `bulkDeleteConfirm: boolean`
3. **Acción masiva "Eliminar"** — Un `BulkAction` con icono `Trash2`, variant `destructive`, que abre un `ConfirmDialog` de confirmación
4. **Handler `handleBulkDelete`** — Itera sobre los IDs seleccionados, llama `archiveMutation.mutateAsync` para cada uno (archivar como eliminación lógica), muestra toast y limpia selección

### Cambios en `src/services/formatoFormacionService.ts`

5. **Agregar método `delete(id)`** — Elimina el formato del array mock (eliminación real para el mock; en producción sería soft-delete)

### Cambios en `src/hooks/useFormatosFormacion.ts`

6. **Agregar hook `useDeleteFormato()`** — Mutation que llama al nuevo `delete()` e invalida queries

### Resumen de archivos
- `src/services/formatoFormacionService.ts` — agregar método `delete`
- `src/hooks/useFormatosFormacion.ts` — agregar `useDeleteFormato`
- `src/pages/formatos/FormatosPage.tsx` — selección + barra flotante con acción eliminar

