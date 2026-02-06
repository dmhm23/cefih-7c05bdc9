

# Plan: Clic en fila actualiza el panel en vez de cerrarlo

## Cambio

Modificar una sola linea en `DetailSheet.tsx`: en el handler `handleClickOutside`, antes de cerrar el panel, verificar si el clic fue sobre una fila de la tabla (`[data-table-container]`). Si fue sobre la tabla, no hacer nada (dejar que el evento llegue a la fila y su `onRowClick` actualice el panel). Solo cerrar si el clic fue fuera del panel Y fuera de la tabla.

## Archivo a modificar

`src/components/shared/DetailSheet.tsx`

## Cambio exacto

Reemplazar la logica actual:

```typescript
const isInSheet = sheetRef.current?.contains(target);

if (!isInSheet) {
  onOpenChange(false);
}
```

Por:

```typescript
const isInSheet = sheetRef.current?.contains(target);
const isInTable = target.closest('[data-table-container]');

if (!isInSheet && !isInTable) {
  onOpenChange(false);
}
```

## Comportamiento resultante

- Clic en el panel: no se cierra (igual que antes)
- Clic en una fila de la tabla: no se cierra, el `onRowClick` de la fila actualiza el contenido del panel
- Clic fuera del panel y fuera de la tabla (sidebar, header, etc): se cierra el panel
