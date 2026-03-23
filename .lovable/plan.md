

## Plan: Eliminar duplicidad de mes/año en el calendario

### Problema
El CSS actual usa `.rdp-caption_dropdowns + .rdp-caption_label` para ocultar el label duplicado, pero en react-day-picker v8 el orden del DOM es `caption_label` primero y `caption_dropdowns` después, así que el selector `+` nunca aplica y ambos se muestran.

### Solución (1 archivo)

**`src/components/ui/calendar.tsx`** — línea 19:

Cambiar:
```
caption_label: "text-sm font-medium",
```
Por:
```
caption_label: "hidden",
```

Esto oculta el label estático ("April 2024") ya que los dropdowns de mes/año ya cumplen esa función. Toda instancia de `Calendar` en la app usa `captionLayout="dropdown-buttons"`, así que no hay caso donde se necesite el label visible.

Opcionalmente, limpiar la regla CSS redundante en `src/index.css` (líneas 125-131) ya que deja de ser necesaria.

### Impacto
- Un solo cambio de una línea en `calendar.tsx`
- Aplica automáticamente en todos los módulos: Matrículas, Cartera, Cursos, Personas

