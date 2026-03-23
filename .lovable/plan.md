

## Plan: Corregir duplicación en calendario y unificar componente

### Problema raíz
La propiedad `captionLayout="dropdown-buttons"` de react-day-picker v8 genera selectores nativos para mes/año, pero el componente `Calendar` no tiene estilos para las clases `caption_dropdowns`, `dropdown_month`, `dropdown_year`, `dropdown` ni `vhidden`. Esto provoca que se muestre simultáneamente el encabezado "March 2026", los labels "Month: March" / "Year: 2026", y los valores duplicados debajo.

### Solución

#### 1. Actualizar `src/components/ui/calendar.tsx`
Agregar las classNames faltantes para el modo dropdown:

- `caption_dropdowns`: contenedor flex para los selectores de mes y año
- `dropdown_month` / `dropdown_year`: espaciado entre selectores
- `dropdown`: estilos del `<select>` nativo (borde, padding, rounded, tamaño)
- `vhidden`: clase para ocultar los labels redundantes ("Month:", "Year:") que react-day-picker genera internamente como accesibilidad

Estas clases se agregan al objeto `classNames` existente sin modificar las demás.

#### 2. Revisar `src/components/shared/EditableField.tsx`
El `captionLayout="dropdown-buttons"` ya está configurado aquí (línea 215). Confirmar que `pointer-events-auto` esté presente en la clase del Calendar para interactividad dentro de popovers. No requiere cambios adicionales.

#### 3. Resultado
- Un solo archivo principal modificado (`calendar.tsx`)
- El fix aplica automáticamente a todos los módulos que usan `EditableField` con `type="date"`: Matrículas, Cartera, Personas, Personal, Certificación
- Consistencia visual garantizada porque toda la app usa el mismo componente `Calendar` de `@/components/ui/calendar`

### Detalle técnico
Clases que se agregarán al objeto `classNames` en `calendar.tsx`:
```
caption_dropdowns: "flex items-center gap-2"
dropdown_month: ""
dropdown_year: ""
dropdown: "appearance-none border rounded px-2 py-1 text-sm bg-background cursor-pointer"
vhidden: "hidden"       // oculta labels redundantes "Month:" / "Year:"
```

