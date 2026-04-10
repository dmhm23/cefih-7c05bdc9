

# Plan: Implementar eliminación masiva de cursos con validación de inscritos

## Diagnóstico

En `CursosListView.tsx` línea 160-161, la acción masiva "Eliminar" solo muestra un toast con texto `"Eliminar N cursos (pendiente)"` sin ejecutar ninguna lógica real. No valida si los cursos tienen estudiantes inscritos ni pide confirmación.

Cada curso ya tiene `matriculasIds` (array de UUIDs de matrículas asignadas) disponible en el frontend, por lo que la validación se puede hacer sin consultas adicionales.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/cursos/CursosListView.tsx` | Reemplazar la acción bulk "Eliminar" con lógica real: (1) Filtrar los cursos seleccionados en dos grupos: los que tienen `matriculasIds.length > 0` (bloqueados) y los que tienen 0 (eliminables). (2) Si todos tienen inscritos, mostrar toast de error indicando que no se pueden eliminar. (3) Si algunos tienen inscritos y otros no, mostrar toast de advertencia con los cursos bloqueados y proceder solo con los eliminables. (4) Para los eliminables, abrir un `ConfirmDialog` pidiendo confirmación antes de ejecutar la eliminación. (5) Al confirmar, llamar a `useDeleteCurso` para cada curso y mostrar toast de éxito. Agregar estado para el diálogo de confirmación (`deleteConfirmOpen`, `cursosToDelete`). Importar `useDeleteCurso` y `ConfirmDialog`. |

**Total: 1 archivo editado, 0 migraciones**

