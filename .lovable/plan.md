

# Añadir "Obligatorio" a bloques especiales

## Análisis

El array `HIDE_REQUIRED` en `InspectorFields.tsx` oculta el toggle de "Obligatorio" para ciertos bloques. Actualmente incluye 4 bloques de campo/especiales que deberían tenerlo:

| Bloque | Tiene "Obligatorio" | Acción |
|---|---|---|
| `text`, `textarea`, `email`, `date`, `number` | ✅ Sí | Ninguna |
| `radio`, `select`, `multi_choice`, `checkbox` | ✅ Sí | Ninguna |
| `auto_field`, `file` | ✅ Sí | Ninguna |
| `signature_capture` | ❌ No | **Añadir** |
| `health_consent` | ❌ No | **Añadir** |
| `evaluation_quiz` | ❌ No | **Añadir** |
| `satisfaction_survey` | ❌ No | **Añadir** |
| `section_title`, `heading`, `paragraph`, `divider`, `document_header` | ❌ No | Correcto — son estructurales |
| `attendance_by_day` | ❌ No | Correcto — es auto-generado |

## Cambio

Un solo archivo: `src/components/formatos/editor/InspectorFields.tsx`

Reducir `HIDE_REQUIRED` a solo los bloques estructurales:

```typescript
const HIDE_REQUIRED: TipoBloque[] = [
  'section_title', 'heading', 'paragraph', 'divider',
  'document_header', 'attendance_by_day',
];
```

Esto habilita el toggle "Obligatorio" en `signature_capture`, `health_consent`, `evaluation_quiz` y `satisfaction_survey`.

