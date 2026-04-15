
## Ajuste tipográfico: Radio y Multi-choice

**Problema:** Los bloques `radio` (selección única) y `multi_choice` (selección múltiple) en `FormatoPreviewDocument.tsx` usan `text-xs` para las etiquetas de opciones, resultando en texto pequeño y poco legible comparado con las preguntas del bloque de evaluación.

**Cambio:** Archivo `src/components/formatos/FormatoPreviewDocument.tsx`

- **Línea 171** (radio): Cambiar `<span className="text-xs">` → `<span className="text-sm font-medium text-foreground">`
- **Línea 209** (multi_choice): Cambiar `<span className="text-xs">` → `<span className="text-sm font-medium text-foreground">`

Esto alinea la tipografía con el estándar de legibilidad del bloque de evaluación: tamaño `text-sm`, peso `font-medium`, y color `text-foreground` para máxima legibilidad.
