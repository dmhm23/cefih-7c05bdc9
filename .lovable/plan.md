

# Plan: Implementar "Exportar listado" de estudiantes en CSV

## Diagnóstico

En `CourseHeader.tsx` línea 66, la opción "Exportar listado" es un placeholder que solo muestra un toast con el texto "(pendiente)". No hay lógica de exportación implementada.

A diferencia de "Descargar CSV MinTrabajo" (que ya funciona con `generateMinTrabajoCsv`), esta opción no tiene handler ni función asociada.

## Solución

Implementar la exportación del listado de estudiantes inscritos como CSV, reutilizando los datos que ya se cargan en `CursoDetallePage` (`matriculas` y `personas`).

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/utils/csvMinTrabajo.ts` | Agregar función `generateListadoEstudiantesCsv(matriculas, personas, curso)` que genere un CSV con encabezados y columnas relevantes (documento, nombre, apellido, empresa, estado, etc.) |
| `src/components/cursos/CourseHeader.tsx` | Agregar prop `onExportarListado` al componente y conectar el `DropdownMenuItem` a ese callback en lugar del toast placeholder |
| `src/pages/cursos/CursoDetallePage.tsx` | Crear handler `handleExportarListado` que invoque la nueva función y pasarlo como prop a `CourseHeader` |

**Total: 3 archivos, 0 migraciones**

