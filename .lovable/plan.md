

# Fix: Duración del curso no se actualiza al cambiar fechas

## Diagnóstico

En `CourseInfoCard.tsx` (línea 83), la prioridad de resolución es:

```typescript
const duracionActual = (formData.duracionDias as number | undefined) ?? curso.duracionDias ?? duracionDiasCalculada;
```

El problema es que `curso.duracionDias` (valor persistido en DB, por defecto `0`) **siempre está definido**, así que `duracionDiasCalculada` nunca se alcanza como fallback. Además, cuando el usuario cambia una fecha, `handleFechaChange` llama a `onFieldChange("duracionDias", ...)` pero hay una condición de carrera: la lectura de `formData` dentro de `handleFechaChange` puede tener valores stale del render anterior.

## Corrección

**Archivo:** `src/components/cursos/CourseInfoCard.tsx`

1. **Simplificar la resolución de duración**: usar `duracionDiasCalculada` directamente como fuente de verdad cuando las fechas están presentes, y solo permitir override manual si el usuario edita explícitamente el campo de duración.

2. **Cambiar la prioridad**: 
   ```typescript
   // Antes (roto):
   const duracionActual = (formData.duracionDias as number | undefined) ?? curso.duracionDias ?? duracionDiasCalculada;
   
   // Después (correcto):
   const duracionActual = duracionDiasCalculada || (formData.duracionDias as number | undefined) ?? curso.duracionDias ?? 0;
   ```
   
   Esto asegura que cuando hay fechas válidas, la duración calculada siempre se muestre. El campo de duración manual solo aplica si no hay fecha fin.

3. **Asegurar que el valor calculado se persista al guardar**: En `handleFechaChange`, eliminar la dependencia de `formData` stale — usar directamente los valores conocidos del curso como fallback.

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/cursos/CourseInfoCard.tsx` | Corregir prioridad de `duracionActual` para usar `duracionDiasCalculada` como fuente primaria cuando hay fechas válidas |

