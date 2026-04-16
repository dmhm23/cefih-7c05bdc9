

# Exportar listado con selector de columnas desde Cursos

## Resumen

Reemplazar la exportación directa actual (`handleExportarListado`) por un modal que permita al usuario elegir qué columnas incluir en el archivo CSV antes de descargarlo. Las columnas disponibles cubrirán datos de Personas, Matrículas y Cursos.

## Componente nuevo: `ExportarListadoDialog`

**Archivo:** `src/components/cursos/ExportarListadoDialog.tsx`

Un Dialog modal que:
- Recibe `curso`, `matriculas`, `personas` y controla `open/onOpenChange`
- Define un catálogo de ~30 columnas exportables, cada una con `key`, `header`, `visible` (por defecto), y una función `resolver(persona, matricula, curso) => string`
- Usa checkboxes para seleccionar/deseleccionar columnas
- Incluye botones "Seleccionar todas" / "Deseleccionar todas"
- Botón "Exportar CSV" que genera y descarga el archivo con las columnas seleccionadas

### Columnas seleccionadas por defecto
1. Nombre completo (nombres + apellidos)
2. Cédula (número documento)
3. Nivel de formación (resuelto desde `nivelFormacionId`)
4. Duración en horas del curso
5. Nombre empresa
6. Representante legal
7. NIT
8. ARL

### Catálogo completo de columnas disponibles
Agrupadas por origen:

**Persona:** tipo documento, número documento, nombres, apellidos, nombre completo, género, fecha nacimiento, país nacimiento, RH, nivel educativo, email, teléfono, contacto emergencia (nombre, teléfono, parentesco)

**Matrícula:** estado, tipo vinculación, empresa nombre, empresa NIT, representante legal, cargo, ARL, EPS, sector económico, área trabajo, valor cupo, abono, pagado, fecha inicio, fecha fin, contacto cobro nombre, contacto cobro celular

**Curso:** número curso, nivel formación, tipo formación, duración horas, duración días, fecha inicio curso, fecha fin curso, entrenador, supervisor, lugar

### Resolución de labels
Reutilizar las funciones `findLabel` y `capitalize` de `csvMinTrabajo.ts` (exportarlas si son privadas) y el hook `useResolveNivel` para resolver el nombre del nivel de formación.

## Integración en `CursoDetallePage`

- Agregar estado `exportarListadoOpen`
- Reemplazar `handleExportarListado` por `() => setExportarListadoOpen(true)`
- Renderizar `<ExportarListadoDialog>` pasando curso, matriculas, personas

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/cursos/ExportarListadoDialog.tsx` | **Nuevo** — Modal con selector de columnas y generación CSV |
| `src/utils/csvMinTrabajo.ts` | Exportar `capitalize`, `findLabel`, `cleanDocumento`, `formatDate` como funciones públicas |
| `src/pages/cursos/CursoDetallePage.tsx` | Reemplazar exportación directa por apertura del modal |

