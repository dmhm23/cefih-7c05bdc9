

# Plan: Implementar eliminación real de matrículas

## Problema

La acción "Eliminar" en la tabla de matrículas (bulk action y posiblemente individual) solo muestra un toast con texto "(pendiente)" — nunca ejecuta la eliminación. Es un placeholder.

## Solución

### 1. Agregar acción de eliminar individual en RowActions

En `MatriculasPage.tsx`, agregar una acción de eliminación por fila en el `RowActions` (línea 407), usando un diálogo de confirmación antes de ejecutar.

### 2. Implementar eliminación real en bulk action

Reemplazar el toast placeholder (línea 225) por lógica que:
- Muestre un `ConfirmDialog` pidiendo confirmación
- Llame a `deleteMatricula` del hook `useDeleteMatricula` para cada ID seleccionado
- Limpie la selección tras completar

### 3. Estado y diálogo de confirmación

Agregar estado local para controlar el diálogo de confirmación (`idsToDelete`, `showDeleteConfirm`). Usar el componente `ConfirmDialog` existente en `src/components/shared/ConfirmDialog.tsx`.

### 4. Verificar RLS

La tabla `matriculas` tiene política `Admin gestiona matriculas` con `ALL` para superadministrador/administrador — ya cubre DELETE. Pero el servicio usa soft-delete (`deleted_at` + `activo: false`), no DELETE real, así que la política de UPDATE es suficiente.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/matriculas/MatriculasPage.tsx` | Reemplazar placeholder por eliminación real con confirmación, agregar acción individual de eliminar |

