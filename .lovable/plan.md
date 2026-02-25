

## Fix: Desbordamiento retardado en el panel deslizable de Matrículas

### Diagnostico

El problema ocurre porque el componente `ScrollArea` de Radix UI aplica un `style="overflow: scroll"` como **estilo inline** en su elemento Viewport interno, y lo hace **despues del render inicial** (por eso se ve bien al principio y luego se desborda). Aunque ya se agrego `[&>[data-radix-scroll-area-viewport]]:!overflow-x-hidden` como clase CSS, el estilo inline de Radix se aplica con un pequeno retraso y puede competir con la clase CSS, causando el efecto de "se ve bien y luego se rompe".

### Solucion

Reemplazar el `ScrollArea` de Radix en `DetailSheet.tsx` por un `div` nativo con `overflow-y-auto overflow-x-hidden`. Esto elimina por completo la dependencia del Viewport de Radix y su estilo inline problematico. Solo se necesita scroll vertical en este panel, asi que no se pierde funcionalidad.

### Cambio

**Archivo:** `src/components/shared/DetailSheet.tsx`

Linea 138 actual:
```
<ScrollArea className="flex-1 min-w-0 [&>[data-radix-scroll-area-viewport]]:!overflow-x-hidden">
  <div className="px-6 py-4 overflow-hidden min-w-0">
    {children}
  </div>
</ScrollArea>
```

Reemplazar por:
```
<div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
  <div className="px-6 py-4 min-w-0">
    {children}
  </div>
</div>
```

Tambien se elimina el import de `ScrollArea` ya que deja de usarse en este archivo.

### Por que funciona

- Un `div` nativo con `overflow-x-hidden` no tiene estilos inline que compitan.
- Se aplica desde el primer render, sin retraso.
- `overflow-y-auto` mantiene el scroll vertical solo cuando el contenido excede la altura.
- `min-w-0` evita que el flex child crezca mas alla del contenedor padre.

### Que NO cambia

- El componente `ScrollArea` sigue disponible para otros usos en la app.
- La estructura del `SheetContent`, header y footer no cambian.
- Ningun otro modulo se ve afectado (el fix es solo en `DetailSheet`).
- Los paneles de Personas, Cursos y Personal que usan `DetailSheet` tambien se benefician automaticamente.

