

## Plan: Aumentar tamaño de texto en bloques del canvas del editor

### Problema

Los textos dentro de los bloques renderizados en el canvas usan tamaños muy pequeños (`text-[9px]`, `text-[10px]`, `text-[11px]`, `text-xs` = 12px). En pantallas normales esto obliga al usuario a forzar la vista para leer preguntas, opciones y etiquetas.

### Escala propuesta

| Actual | Nuevo | Uso |
|---|---|---|
| `text-[9px]` | `text-xs` (12px) | Badges, etiquetas secundarias |
| `text-[10px]` | `text-sm` (14px) | Opciones de respuesta, filas de encuesta, ítems de salud |
| `text-[11px]` | `text-sm` (14px) | Texto de preguntas |
| `text-xs` (12px) | `text-sm` (14px) | Labels de campos, placeholders, textos generales |
| `text-sm` (14px) | `text-base` (16px) | Headings de sección |

### Cambios en `src/components/formatos/editor/BlockPreview.tsx`

1. **Componente `L` (label genérico)**: `text-xs` → `text-sm`
2. **Inputs/Textarea**: `text-xs` → `text-sm`, altura `h-8` → `h-9`
3. **Section title**: `text-[10px]` → `text-xs`
4. **Paragraph**: `text-xs` → `text-sm`
5. **Auto field**: label `text-xs` → `text-sm`, badge `text-[9px]` → `text-xs`, valor `text-xs` → `text-sm`
6. **EvaluationQuizPreview**:
   - Label: `text-xs` → `text-sm`
   - Badges: `text-[9px]` → `text-xs`
   - Pregunta: `text-[11px]` → `text-sm`
   - Opciones: `text-[10px]` → `text-sm`, radio `h-3 w-3` → `h-4 w-4`
7. **SatisfactionSurveyPreview**:
   - Label: `text-xs` → `text-sm`
   - Header grid: `text-[9px]` → `text-xs`
   - Filas: `text-[10px]` → `text-sm`
   - Pregunta Sí/No: `text-[10px]` → `text-sm`
8. **HealthConsentPreview**:
   - Label: `text-xs` → `text-sm`
   - Preguntas: `text-[10px]` → `text-sm`
9. **DataAuthorizationPreview**:
   - Label: `text-xs` → `text-sm`
   - Items y texto: `text-[10px]` → `text-sm`
10. **Attendance by day**: badge `text-[10px]` → `text-xs`, párrafo `text-xs` → `text-sm`

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/components/formatos/editor/BlockPreview.tsx` | Escalar todos los tamaños de fuente un nivel arriba |

