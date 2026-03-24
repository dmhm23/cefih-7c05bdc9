## Plan: Eliminar `areaTrabajo` y `sectorEconomico` de Persona

Estos campos ya existen en Matrícula (`src/types/matricula.ts` líneas 79-80) y se gestionan correctamente en el formulario y detalle de matrícula. El cambio consiste en eliminarlos del modelo Persona y todas sus referencias en el modulo de Personas, hay que dejarlo en Matriculas.

### Archivos a modificar

**1. `src/types/persona.ts**`

- Eliminar el tipo `AreaTrabajo` y las propiedades `areaTrabajo` y `sectorEconomico` de la interfaz `Persona`.

**2. `src/data/mockData.ts**`

- Eliminar `areaTrabajo` y `sectorEconomico` de cada objeto persona mock (p1–p24+).

**3. `src/pages/personas/PersonaFormPage.tsx**`

- Eliminar los campos `areaTrabajo` y `sectorEconomico` del schema Zod, valores por defecto, mapeo de datos y los dos `<FormField>` del formulario.

**4. `src/pages/personas/PersonasPage.tsx**`

- Eliminar la columna `sectorEconomico` de la tabla y la columna `areaTrabajo` de `DEFAULT_COLUMNS`.
- Eliminar el filtro `sectorEconomico` del array `filterConfigs`, del estado `filters` y de la lógica de filtrado.
- Eliminar el import de `SECTORES_ECONOMICOS` y la función `getSectorLabel` si ya no se usa.

**5. `src/components/personas/PersonaDetailSheet.tsx**`

- Eliminar los dos `EditableField` de Área de Trabajo y Sector Económico (y la nota "Estos campos se gestionan desde la matrícula").
- Eliminar imports no usados (`Briefcase`, `Building2`, `AREAS_TRABAJO`, `SECTORES_ECONOMICOS`).

**6. `src/components/matriculas/CrearPersonaModal.tsx**`

- Eliminar las líneas que asignan `areaTrabajo: 'operativa'` y `sectorEconomico: ''` al crear una persona desde matrícula.

**7. `src/pages/personas/PersonaDetallePage.tsx**`

- Eliminar cualquier referencia a estos dos campos si se muestran en la vista de detalle full-screen.

### Sin cambios necesarios

- `src/types/matricula.ts` — ya tiene sus propios campos `areaTrabajo` y `sectorEconomico`, se mantienen intactos.
- `src/pages/matriculas/MatriculaFormPage.tsx` y `MatriculaDetallePage.tsx` — siguen usando los campos desde Matrícula, sin cambios.
- `src/utils/resolveAutoField.ts` y `csvMinTrabajo.ts` — ya leen de `matricula`, no de `persona`.