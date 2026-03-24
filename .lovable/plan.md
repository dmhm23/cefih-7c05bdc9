

## Plan: Ajustar TodoWidget — altura fija con scroll y fecha de creación

### Cambios en `src/components/dashboard/TodoWidget.tsx`

**1. Altura fija con scroll vertical**
- Hacer que la Card use `h-full flex flex-col` para igualarse a la gráfica vecina.
- Cambiar el `ScrollArea` de `max-h-64` a `flex-1 min-h-0` para que ocupe el espacio restante y haga scroll interno sin expandir la tarjeta.

**2. Mostrar fecha de creación**
- Junto al botón de eliminar (al final de cada fila), agregar un `<span>` con la fecha formateada en `text-xs text-muted-foreground/60`.
- Formato corto: `dd/mm/yyyy` usando `toLocaleDateString('es-CO')`.
- La fecha será siempre visible (no solo en hover como el botón eliminar).

### Detalle técnico

```
Card (h-full flex flex-col)
  CardHeader
  CardContent (flex-1 flex flex-col min-h-0)
    Input row
    ScrollArea (flex-1 min-h-0 overflow-y-auto)
      cada tarea:
        [✓] Texto de la tarea          12/03/2026  🗑
```

Un solo archivo modificado: `src/components/dashboard/TodoWidget.tsx`.

