
## Plan: Recalcular duracionDias al cambiar fechas (sin tocar horasTotales)

### Objetivo
Cuando el usuario modifica `fechaFin` (o `fechaInicio`), el campo `duracionDias` se actualiza automáticamente con la diferencia en días calendario entre ambas fechas. Las `horasTotales` permanecen intactas.

La formula es: `duracionDias = Math.max(1, differenceInCalendarDays(fechaFin, fechaInicio))`

---

### Cambio 1 — `/cursos/nuevo` (`src/pages/cursos/CursoFormPage.tsx`)

Agregar un helper `recalcularDuracion(inicio, fin)` que calcula la diferencia en días y llama `form.setValue("duracionDias", dias)` sin tocar `horasTotales`.

Luego, en los campos `fechaInicio` y `fechaFin`, reemplazar el `<Input type="date" {...field} />` con un `onChange` que:
1. Llama `field.onChange(e)` para actualizar el campo nativo.
2. Lee el valor actual del otro campo de fecha con `form.getValues()`.
3. Si ambas fechas son válidas, llama `recalcularDuracion`.

```tsx
// Helper (dentro del componente)
const recalcularDuracion = (inicio: string, fin: string) => {
  if (!inicio || !fin) return;
  const dias = differenceInCalendarDays(new Date(fin), new Date(inicio));
  if (dias >= 1) form.setValue("duracionDias", dias);
};

// En fechaInicio
<Input
  type="date"
  value={field.value}
  onChange={(e) => {
    field.onChange(e);
    recalcularDuracion(e.target.value, form.getValues("fechaFin"));
  }}
/>

// En fechaFin
<Input
  type="date"
  value={field.value}
  onChange={(e) => {
    field.onChange(e);
    recalcularDuracion(form.getValues("fechaInicio"), e.target.value);
  }}
/>
```

Importar `differenceInCalendarDays` de `date-fns` (ya está instalado).

---

### Cambio 2 — `/cursos/:id` (`src/components/cursos/CourseInfoCard.tsx`)

El componente recibe `onFieldChange` para cada campo. Actualmente el `EditableField` de `fechaFin` y `fechaInicio` llama `onFieldChange("fechaFin", v)` directamente.

Modificar para que al cambiar `fechaFin` o `fechaInicio`:
1. Llame `onFieldChange` con la nueva fecha.
2. Calcule la duración usando el valor actual del otro campo (tomándolo de `formData` si existe, o de `curso` si no).
3. Llame `onFieldChange("duracionDias", dias)` automáticamente.

```tsx
// En CourseInfoCard
import { differenceInCalendarDays } from "date-fns";

const handleFechaChange = (
  campo: "fechaInicio" | "fechaFin",
  nuevoValor: string
) => {
  onFieldChange(campo, nuevoValor);
  const inicio = campo === "fechaInicio" ? nuevoValor : (formData.fechaInicio ?? curso.fechaInicio);
  const fin    = campo === "fechaFin"    ? nuevoValor : (formData.fechaFin    ?? curso.fechaFin);
  if (inicio && fin) {
    const dias = differenceInCalendarDays(new Date(fin), new Date(inicio));
    if (dias >= 1) onFieldChange("duracionDias", dias);
  }
};
```

Luego en los `EditableField` de `fechaInicio` y `fechaFin`:
```tsx
onChange={(v) => handleFechaChange("fechaInicio", v)}
onChange={(v) => handleFechaChange("fechaFin", v)}
```

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/cursos/CursoFormPage.tsx` | Helper `recalcularDuracion` + onChange en inputs de fecha |
| `src/components/cursos/CourseInfoCard.tsx` | Helper `handleFechaChange` + recalculo en EditableField de fechas |

### Casos edge cubiertos
- Si `fechaFin < fechaInicio`: no actualizar `duracionDias` (solo actualizar si `dias >= 1`).
- Si alguna fecha está vacía: no calcular.
- `horasTotales` nunca se toca en este flujo.
