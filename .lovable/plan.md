

# Fix: Panel lateral se actualiza al hacer clic en otra fila (sin clic extra)

## Problema raiz

El componente `Sheet` usa `Radix Dialog` en modo **modal** (por defecto). Esto activa un **focus trap** que intercepta y consume los clics fuera del panel antes de que lleguen a las filas de la tabla. Por eso se necesitan dos clics: el primero es "tragado" por el focus trap, el segundo ya llega a la fila.

## Solucion

Pasar `modal={false}` al componente `Sheet`. Esto desactiva el focus trap y permite que los clics en la tabla lleguen directamente a las filas, actualizando el panel sin cerrarlo.

## Archivos a modificar

### 1. `src/components/shared/DetailSheet.tsx`

- Agregar `modal={false}` al componente `<Sheet>`
- Mantener el handler `handleClickOutside` existente para cerrar al hacer clic fuera del panel Y fuera de la tabla

```typescript
// Antes:
<Sheet open={open} onOpenChange={onOpenChange}>

// Despues:
<Sheet open={open} onOpenChange={onOpenChange} modal={false}>
```

### 2. `src/components/ui/sheet.tsx` (limpieza opcional)

- Se puede remover `preventCloseOnOutsideClick` y los handlers `onPointerDownOutside`/`onInteractOutside` ya que con `modal={false}` Radix no intenta cerrar en clics externos. Sin embargo, para minimizar cambios y riesgo, se puede dejar como esta.

## Comportamiento resultante

- Panel abierto + clic en otra fila: el panel actualiza su contenido inmediatamente (un solo clic)
- Panel abierto + clic fuera del panel y de la tabla: el panel se cierra
- Dropdowns dentro del panel: siguen funcionando sin cerrar el panel
