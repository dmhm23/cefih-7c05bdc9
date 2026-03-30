

## Plan: Eliminar "duración en días" de niveles y recalcular días desde fechas del curso

### Resumen

- Eliminar el campo `duracionDias` del módulo de niveles de formación (formulario, detalle, listado, tipo)
- Las horas de formación se parametrizan solo en niveles y no se modifican por fechas del curso
- `duracionDias` en el curso se calcula automáticamente a partir de `fechaInicio` y `fechaFin` (ya ocurre parcialmente en `CourseInfoCard`)
- El campo `horasTotales` del curso se pre-llena desde el nivel pero sigue siendo editable solo por admin, no por cambio de fechas

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/types/nivelFormacion.ts` | Eliminar `duracionDias` de `NivelFormacion` |
| `src/pages/niveles/NivelFormPage.tsx` | Eliminar campo `duracionDias` del schema, formulario y payload. Ajustar validación a solo `duracionHoras > 0` |
| `src/pages/niveles/NivelDetallePage.tsx` | Mostrar solo horas en la sección Duración |
| `src/pages/niveles/NivelesPage.tsx` | Columna Duración muestra solo horas |
| `src/data/mockData.ts` | Eliminar `duracionDias` de los mocks de niveles (si existe) |
| `src/components/cursos/CourseInfoCard.tsx` | Hacer `Duración (días)` read-only y calculado desde fechas. `Horas Totales` no editable por cambio de fechas |
| `src/pages/cursos/CursoFormPage.tsx` | Al crear curso, pre-llenar `horasTotales` desde el nivel seleccionado; calcular `duracionDias` desde fechas |
| `src/components/cursos/CursosListView.tsx` | Sin cambios funcionales (ya muestra días del curso, que sigue existiendo) |

### Detalle técnico

**Niveles** — `duracionDias` se elimina del tipo y del formulario. Solo queda `duracionHoras` como campo obligatorio.

**Cursos** — `duracionDias` sigue existiendo en `Curso` pero se calcula automáticamente desde fechas (ya existe lógica en `handleFechaChange`). Se marca como no editable manualmente. `horasTotales` se hereda del nivel al seleccionar tipo de formación y no cambia al modificar fechas.

