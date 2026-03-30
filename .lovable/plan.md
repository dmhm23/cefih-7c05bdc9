

## Plan: Aumentar tamaño de texto en el panel de Propiedades (Inspector)

### Problema

Los textos en el inspector usan `text-xs` (12px) y `text-[10px]` (10px), lo que dificulta la lectura — especialmente en los bloques de evaluación, encuesta, consentimiento de salud y autorización de datos.

### Escala propuesta

| Actual | Nuevo | Contexto |
|---|---|---|
| `text-[10px]` | `text-xs` (12px) | Labels secundarios, numeración, badges |
| `text-xs` (12px) | `text-sm` (14px) | Labels, preguntas, opciones, textareas, inputs, info text |
| `h-6` / `h-7` | `h-8` / `h-9` | Inputs y botones pequeños |

### Cambios en `src/components/formatos/editor/InspectorFields.tsx`

**EvaluationQuizInspector** (líneas 306-347):
- Labels `text-xs` → `text-sm`
- Info box `text-xs` → `text-sm`
- **QuestionEditor** (líneas 350-428):
  - Trigger text `text-xs` → `text-sm`
  - Textarea preguntas `text-xs` → `text-sm`
  - Label opciones `text-[10px]` → `text-xs`
  - Textarea opciones `text-xs` → `text-sm`
  - Botones `h-7` → `h-8`

**SatisfactionSurveyInspector** (líneas 435-548):
- Info text `text-xs` → `text-sm`
- Labels `text-xs` → `text-sm`
- Inputs escala `text-xs` → `text-sm`, `h-7` → `h-8`
- Numeración `text-[10px]` → `text-xs`
- Textareas `text-xs` → `text-sm`

**HealthConsentInspector** (líneas 555-615):
- Labels `text-xs` → `text-sm`
- Textareas `text-xs` → `text-sm`
- Label "Detalle" `text-[10px]` → `text-xs`
- Input condicional `text-[10px]` → `text-xs`, `h-6` → `h-8`

**DataAuthorizationInspector** (líneas 622-672):
- Labels `text-xs` → `text-sm`
- Bullets `text-[10px]` → `text-xs`
- Inputs `text-xs` → `text-sm`, `h-7` → `h-8`
- Textarea `text-xs` → `text-sm`

**Attendance by day** (línea 269):
- `text-xs` → `text-sm`

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/components/formatos/editor/InspectorFields.tsx` | Escalar tamaños de fuente un nivel arriba en inspectores especializados |

