## Plan: Plantilla fija de exportación, columna "Código del estudiante" y descarga individual

### 1. Plantilla fija con orden exacto de columnas

Hoy `ExportarListadoDialog` permite seleccionar libremente columnas, lo que rompe la consistencia. Se introducirá una **plantilla oficial fija** (preset) con tus 10 columnas en orden estricto, marcada por defecto al abrir el modal:


| #   | Columna                        | Origen                                         |
| --- | ------------------------------ | ---------------------------------------------- |
| 1   | Nombre Empresa                 | `matricula.empresaNombre` (o "Independiente")  |
| 2   | Representante Legal            | `matricula.empresaRepresentanteLegal`          |
| 3   | NIT                            | `matricula.empresaNit`                         |
| 4   | Tipo de Documento              | `persona.tipoDocumento` (label)                |
| 5   | Número de Cédula               | `persona.numeroDocumento`                      |
| 6   | Nombre Completo del Estudiante | `persona.nombres + apellidos`                  |
| 7   | ARL                            | `matricula.arl` (label)                        |
| 8   | Nivel de Formación             | `resolveNivel(curso.nivelFormacionId)`         |
| 9   | Duración                       | `curso.horasTotales` + " h"                    |
| 10  | Código del Estudiante          | `useCodigosCurso(curso).codigos[m.id]` (nuevo) |


**Cómo se aplica el orden:** la exportación dejará de iterar sobre `COLUMN_CATALOG` y pasará a iterar sobre un arreglo `PLANTILLA_OFICIAL` con el orden anterior. Las columnas seleccionadas en checkboxes se reordenarán según ese arreglo antes de armar el CSV — así nunca se exporta en un orden distinto al oficial. Y cuando el usuario añada más columnas, entonces se añaden despues de las columnas de la plantilla_oficial dentro del mismo archivo.

### 2. Nueva columna "Código del Estudiante" en el catálogo del modal

Actualmente `COLUMN_CATALOG` no tiene esta columna porque el código se calcula vía `useCodigosCurso` (hook), no leyendo un campo plano. La solución estructural:

- **Recibir el mapa de códigos como prop**: `CursoDetallePage` ya invoca `useCodigosCurso` indirectamente en `EnrollmentsTable`. Levantamos su uso al padre y lo pasamos al `ExportarListadoDialog` como `codigosEstudiante: Record<string, string>`.
- **Agregar al catálogo** un nuevo `ColumnDef` `m_codigo_estudiante` con resolver `(p, m) => codigosEstudiante[m.id] ?? ""`. Para no romper la firma actual del resolver, se añade un parámetro opcional `extras` al `ColumnDef.resolver` que transporta el mapa.
- En el agrupamiento del modal aparece bajo grupo **"Curso"** (o nuevo grupo **"Estudiante"** si quieres separarlo).
- Marcado por defecto = `true` cuando carga la plantilla oficial.

**Sin tocar lo construido:** el catálogo libre sigue funcionando igual; solo se agregan (a) la nueva columna y (b) un botón "Restaurar plantilla oficial" arriba del modal que setea selección y orden a los 10 campos.

### 3. Descarga individual por estudiante (CSV personal)

Se agrega una nueva acción en cada fila de `EnrollmentsTable.tsx`, junto a "Ver matrícula" y "Remover": **"Descargar CSV del estudiante"** (icono `Download`).

**Comportamiento:**

- Reutiliza exactamente el mismo `COLUMN_CATALOG` y resolvers existentes (cero duplicación).
- Genera un CSV con **una sola fila** correspondiente a esa matrícula y persona.
- Por defecto exporta **todas** las columnas disponibles del catálogo (Persona + Matrícula + Curso + Código del Estudiante) — así obtienes "toda la información que tenemos" del estudiante en un solo archivo.
- Nombre de archivo: `Curso_{numeroCurso}_{cedula}_{ApellidoNombre}.csv`.
- Misma codificación, separador y formato que el listado masivo.

**Disponibilidad:** acción visible tanto en el listado del curso (`EnrollmentsTable`) como — opcionalmente — desde el listado general de matrículas. Para mantener el alcance acotado y rápido, se entrega primero en `EnrollmentsTable`. Si lo quieres en `MatriculasPage` también, se replica con el mismo helper.

### 4. Refactor mínimo de soporte

Para evitar duplicar lógica, se extrae una función pura:

```ts
// src/utils/exportCursoListado.ts (nuevo)
export function buildCursoListadoCsv(
  matriculas: Matricula[],
  personaMap: Map<string, Persona>,
  curso: Curso,
  resolveNivel,
  codigosEstudiante: Record<string, string>,
  columnasSeleccionadas: ColumnDef[]
): { content: string; filename: string }
```

Tanto el modal masivo como la descarga individual la consumen. Sin cambios de contrato en hooks/services.

### Archivos tocados


| Archivo                                           | Cambio                                                                                                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/exportCursoListado.ts`                 | **Nuevo.** Función pura `buildCursoListadoCsv` + constante `PLANTILLA_OFICIAL_KEYS` con los 10 keys en orden                                                                      |
| `src/components/cursos/ExportarListadoDialog.tsx` | Añadir columna `m_codigo_estudiante`, recibir prop `codigosEstudiante`, botón "Restaurar plantilla oficial", reordenar selección según `PLANTILLA_OFICIAL_KEYS` antes de exportar |
| `src/components/cursos/EnrollmentsTable.tsx`      | Nueva acción de fila "Descargar CSV del estudiante" usando `buildCursoListadoCsv` + el mapa `codigosMapa` ya disponible                                                           |
| `src/pages/cursos/CursoDetallePage.tsx`           | Pasar `codigosEstudiante` al `ExportarListadoDialog` (obtenido vía `useCodigosCurso(curso)`)                                                                                      |


### Validación post-cambio

- Abrir "Exportar listado" → ver el botón "Restaurar plantilla oficial" → al pulsarlo quedan marcadas exactamente las 10 columnas pedidas y el CSV sale en ese orden.
- La columna "Código del Estudiante" aparece como opción en el catálogo (grupo "Curso") y se exporta con el código real (`FIH-R-26-04-01`, etc.).
- Desde la fila de un estudiante, click en "Descargar CSV del estudiante" → archivo con una fila y todas las columnas del catálogo, incluyendo el código.
- El listado masivo previo sigue funcionando igual cuando se selecciona manualmente cualquier subconjunto distinto de la plantilla oficial.

### Sin impacto colateral

- No toca BD, RPCs ni triggers.
- No afecta el CSV MinTrabajo (ese flujo es independiente).
- No cambia la lógica de `useCodigosCurso` ni `EnrollmentsTable` fuera de la nueva acción.
- No rompe selecciones libres existentes; la plantilla oficial es **opt-in** con el botón.