

# Plan: Corregir desfase de fechas por zona horaria en toda la aplicación

## Problema

Cuando la base de datos devuelve una fecha como `"2026-04-10"`, JavaScript la interpreta como **UTC midnight** (`2026-04-10T00:00:00Z`). En Colombia (UTC-5), eso se convierte en `2026-04-09T19:00:00`, mostrando **un día menos**.

El proyecto ya tiene `parseLocalDate()` en `src/utils/dateUtils.ts` que parsea correctamente sin desfase UTC, pero solo se usa en 5 archivos. El resto de la aplicación (~26 archivos) usa `new Date(dateStr)` directamente.

## Solución

Crear una función auxiliar `fmtDateLocal(dateStr, formatStr)` en `dateUtils.ts` que combine `parseLocalDate` con `date-fns/format`, y reemplazar todas las instancias de `format(new Date(dateStr), ...)` y `new Date(dateStr).toLocaleDateString(...)` donde `dateStr` es una fecha sin hora (YYYY-MM-DD).

**No se tocan** las fechas con timestamp completo (ISO con hora), como `createdAt` o `updatedAt`, ya que esas incluyen zona horaria y se parsean correctamente.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/utils/dateUtils.ts` | Agregar `fmtDateLocal(dateStr, formatStr, locale?)` |
| `src/utils/resolveAutoField.ts` | `fmtDate` → usar `parseLocalDate` en vez de `new Date` |
| `src/utils/certificadoGenerator.ts` | Igual |
| `src/utils/codigoEstudiante.ts` | Usar `parseLocalDate` para extraer año/mes |
| `src/components/cursos/CursosListView.tsx` | `fechaInicio`, `fechaFin` → `fmtDateLocal` |
| `src/components/cursos/CursosCalendarioView.tsx` | `fechaInicio`, `fechaFin` → `parseLocalDate` |
| `src/components/cursos/CursoDetailSheet.tsx` | Fechas de curso → `fmtDateLocal` |
| `src/components/cursos/CourseInfoCard.tsx` | Fechas de curso → `fmtDateLocal` |
| `src/pages/cursos/CursoFormPage.tsx` | `new Date(fechaInicio/Fin)` → `parseLocalDate` |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | `fechaInicio`, `fechaFin` del curso → `fmtDateLocal` |
| `src/pages/matriculas/MatriculasPage.tsx` | Fechas de matrícula → `fmtDateLocal` |
| `src/pages/personas/PersonasPage.tsx` | `fechaNacimiento` → `fmtDateLocal` |
| `src/pages/empresas/EmpresaDetallePage.tsx` | Fechas de matrícula |
| `src/components/cartera/FacturaCard.tsx` | `fechaEmision`, `fechaVencimiento`, `fechaPago` |
| `src/pages/cartera/GrupoCarteraDetallePage.tsx` | `fechaVencimiento` comparación |
| `src/components/cursos/EnrollmentsTable.tsx` | Fechas ARL/examen |
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | Fechas auto-resueltas del curso |
| `src/components/portal-admin/MonitoreoDetalleDialog.tsx` | Fechas del curso |
| `src/components/dashboard/TodoWidget.tsx` | `toLocaleDateString` → `fmtDateLocal` |
| `src/pages/certificacion/HistorialCertificadosPage.tsx` | `fechaGeneracion` |
| `src/components/matriculas/ExcepcionesPanel.tsx` | `fechaSolicitud` |
| `src/components/matriculas/HistorialVersiones.tsx` | `fechaGeneracion` |

## Criterio de distinción

- **Fechas date-only** (YYYY-MM-DD): `fechaInicio`, `fechaFin`, `fechaNacimiento`, `fechaPago`, `fechaEmision`, `fechaVencimiento`, `fechaCarga`, `fechaDocumento` → usar `parseLocalDate` / `fmtDateLocal`
- **Timestamps con hora** (ISO completo): `createdAt`, `updatedAt`, `fechaGeneracion` (certificados) → **no tocar**, `new Date()` funciona bien con estos

## Nueva función en dateUtils.ts

```typescript
export function fmtDateLocal(
  dateStr: string | undefined | null,
  formatStr: string = "dd/MM/yyyy",
  locale?: Locale
): string {
  if (!dateStr) return "—";
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return format(d, formatStr, { locale });
}
```

Esto centraliza el parseo seguro y el formateo en una sola llamada, minimizando cambios en cada archivo.

