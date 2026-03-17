

## Plan: Rediseño minimalista de las tarjetas de métricas

Reemplazar el estilo actual (borde izquierdo coloreado, sombras al hover) por un diseño limpio y moderno sin bordes de color.

### Cambios en `src/components/dashboard/StatCard.tsx`

- Eliminar `borderColors` y la clase `border-l-4`
- Reemplazar por tarjetas planas: sin borde lateral, borde general sutil (`border`), hover con `bg-muted/30` en vez de `shadow-lg`
- El icono se coloca dentro de un contenedor circular sutil con fondo `bg-muted/50` en tono neutro (sin colores semafóricos en el icono)
- El color semafórico se conserva solo como un **punto indicador** (dot) pequeño junto al valor, para mantener la señalización sin ser invasivo
- Tipografía: valor en `text-3xl font-semibold`, título en `text-xs uppercase tracking-wider text-muted-foreground`, descripción en `text-xs text-muted-foreground`
- Skeleton sin borde lateral
- Transición suave: `transition-colors` en vez de `transition-shadow`

Resultado visual por tarjeta:
```text
┌─────────────────────────┐
│  [○ icon]               │
│                         │
│  FACTURADO Y PAGADO     │
│  $12.500.000  ●         │
│  Acumulado total        │
└─────────────────────────┘
```

El dot `●` (6px) junto al valor usa el color semafórico (verde/rojo/naranja) como indicador discreto de estado.

