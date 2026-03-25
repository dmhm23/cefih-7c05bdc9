

## Plan: Mejoras al widget de Tareas Rápidas

### Cambios

1. **Placeholder del input** — Cambiar `"Nueva tarea..."` por `"Escribe una nueva tarea…"` (línea 108)

2. **Edición inline de tareas** — Al hacer doble clic en el texto de una tarea, se convierte en un input editable. Al presionar Enter o perder foco se guarda; Escape cancela. Se añade estado `editingId` y `editText` al componente.

3. **Drag & drop para reordenar** — Instalar `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`. Envolver la lista de tareas en `DndContext` + `SortableContext`, y cada fila en un `useSortable`. Se añade un ícono de agarre (`GripVertical`) visible en hover. Al soltar, se reordena el array y se persiste. Se elimina el sort automático por fecha para respetar el orden manual del usuario.

### Archivos modificados
- `src/components/dashboard/TodoWidget.tsx` — placeholder, edición inline, integración drag & drop
- `package.json` — añadir `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

