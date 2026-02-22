## Descarga CSV MinTrabajo desde vista de Curso

### Resumen

Agregar la opcion "Descargar CSV MinTrabajo" en el dropdown de acciones del CourseHeader. Al hacer clic, genera y descarga un archivo CSV sin encabezados con 15 columnas por estudiante, separado por columnas. Si el curso no tiene matriculas, genera un archivo de prueba con 3 filas dummy.

### Archivos a crear

**1. `src/utils/csvMinTrabajo.ts**` — Funcion pura de generacion CSV

Exporta dos funciones:

- `generateMinTrabajoCsv(matriculas, personas, curso)`: recorre las matriculas, cruza con personas, y genera el contenido CSV (string) con 15 columnas por fila, separadas por `columnas`, sin encabezados.
- `downloadCsv(content, filename)`: crea un Blob UTF-8, genera un link temporal y dispara la descarga.
- El contenido debe estar en mayuscula sin tildes

Logica de columnas (orden fijo):

1. `tipoDocumento` — de Persona, solo abreviatura (CC, CE, PA, PE, PP)
2. `numeroDocumento` — de Persona, sin puntos ni espacios (replace con regex)
3. Primer nombre — split de `persona.nombres` por espacio, indice 0
4. Segundo nombre — split de `persona.nombres` por espacio, indice 1 o vacio
5. Primer apellido — split de `persona.apellidos` por espacio, indice 0
6. Segundo apellido — split de `persona.apellidos` por espacio, indice 1 o vacio
7. Genero — de Persona (F, M)
8. Pais nacimiento — de Persona, buscar label en PAISES de formOptions
9. Fecha nacimiento — de Persona, formateada a MM/DD/AAAA (o vacio si invalida)
10. Nivel educativo — de Persona, buscar label en NIVELES_EDUCATIVOS de formOptions
11. Area de trabajo — de Matricula `areaTrabajo`, buscar label en AREAS_TRABAJO
12. Cargo actual — de Matricula `empresaCargo` o vacio
13. Sector economico — de Matricula `sectorEconomico`, buscar label en SECTORES_ECONOMICOS
14. Empleador — de Matricula `empresaNombre` o "Independiente"
15. ARL — de Matricula `arl` o vacio

Funcion de prueba:

- `generateDummyCsv()`: retorna 3 filas con datos coherentes hardcodeados (documentos, nombres, fechas en formato correcto).

Nombre del archivo: `Curso_<numeroCurso>_MinTrabajo.csv`

### Archivos a modificar

**2. `src/components/cursos/CourseHeader.tsx**`

- Agregar prop `onDownloadCsvMinTrabajo: () => void` a `CourseHeaderProps`.
- Agregar nueva opcion en el DropdownMenuContent (antes de "Generar certificados"):
  ```
  <DropdownMenuItem onClick={onDownloadCsvMinTrabajo}>
    <Download className="h-4 w-4 mr-2" />
    Descargar CSV MinTrabajo
  </DropdownMenuItem>
  ```

**3. `src/pages/cursos/CursoDetallePage.tsx**`

- Importar `generateMinTrabajoCsv`, `generateDummyCsv`, `downloadCsv` desde `@/utils/csvMinTrabajo`.
- Crear handler `handleDownloadCsvMinTrabajo`:
  - Si `matriculas.length > 0`: generar CSV real con `generateMinTrabajoCsv(matriculas, personas, curso)`.
  - Si `matriculas.length === 0`: generar CSV dummy con `generateDummyCsv()`.
  - Descargar con `downloadCsv(content,` Curso_${curso.numeroCurso}_MinTrabajo.csv`)`.
  - Mostrar toast indicando descarga completada (o "CSV de prueba generado" si fue dummy).
- Pasar `onDownloadCsvMinTrabajo={handleDownloadCsvMinTrabajo}` al `CourseHeader`.

### Comportamiento esperado

- La opcion siempre esta visible en el dropdown, independientemente del estado del curso.
- Con matriculas: genera CSV real con datos cruzados persona+matricula.
- Sin matriculas: genera CSV de prueba con 3 filas dummy y muestra toast informativo.
- El archivo se descarga automaticamente al navegador.
- Encoding UTF-8, separador `;`, sin fila de encabezados.