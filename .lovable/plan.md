

# Fix: Duración de curso inclusiva + editable + asistencia completa

## Problema identificado

El bloque de asistencia en `DynamicFormatoDocument.tsx` usa `ctx.curso?.duracionDias` para generar las filas. Si el valor almacenado en la base de datos es incorrecto (calculado sin el +1 inclusivo), la tabla muestra menos días de los esperados.

**Causa raíz**: `CourseInfoCard` calcula `duracionDiasCalculada` con la fórmula inclusiva correcta (+1), pero **nunca la persiste** en `formData` vía `onFieldChange("duracionDias", ...)`. Cuando se guardan cambios de fechas, el campo `duracionDias` no se incluye en el payload — el valor viejo del DB se mantiene.

Adicionalmente, la asistencia debería calcular las filas directamente desde las fechas del curso en vez de depender solo de `duracionDias`, para mayor robustez.

## Cambios

### 1. `CourseInfoCard.tsx` — Sincronizar duración al cambiar fechas + campo editable

- Cuando cambien `fechaInicio` o `fechaFin`, llamar `onFieldChange("duracionDias", diasCalculados)` automáticamente para que la duración entre en el payload de guardado.
- Reemplazar el `<div>` estático de duración por un `EditableField` que permita override manual.
- Mostrar hint "(auto)" cuando coincide con el cálculo, y "(manual)" cuando el usuario lo sobreescribió.

### 2. `CursoFormPage.tsx` — Habilitar edición manual del campo

- Quitar `disabled` del input de duración.
- Mantener auto-cálculo al cambiar fechas, pero permitir que el usuario escriba un valor diferente.

### 3. `DynamicFormatoDocument.tsx` — Calcular filas de asistencia desde fechas

- Cambiar la lógica del bloque `attendance_by_day`: en vez de usar solo `days = ctx.curso?.duracionDias`, recalcular inclusivamente desde `fechaInicio` y `fechaFin` cuando ambas existan.
- Fallback a `duracionDias` solo si no hay fechas disponibles.

### 4. `PortalFormatoRenderer.tsx` — Mismo fix para asistencia en portal

- Aplicar la misma lógica de cálculo inclusivo de fechas para generar las filas de asistencia en el portal del estudiante.

## Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/cursos/CourseInfoCard.tsx` | Auto-sync duracionDias + EditableField editable |
| `src/pages/cursos/CursoFormPage.tsx` | Quitar `disabled` del campo duración |
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | Calcular filas asistencia desde fechas inclusivas |
| `src/components/portal/PortalFormatoRenderer.tsx` | Mismo fix para asistencia en portal |

