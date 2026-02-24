

## Mejora del bloque "Campo Automatico" en el Editor de Formatos

### Objetivo

Mejorar la experiencia del administrador al insertar bloques de tipo `auto_field` en el constructor de formatos. Actualmente el selector muestra una lista plana de 20 claves tecnicas. El cambio organiza estos campos por categoria, agrega nuevos campos disponibles desde la matricula, y muestra claramente de donde proviene cada dato.

---

### Cambios por archivo

#### 1. `src/types/formatoFormacion.ts` -- Agregar nuevas claves de AutoFieldKey

Ampliar el tipo `AutoFieldKey` con campos adicionales provenientes de la Matricula y Persona que actualmente no estan disponibles:

- `telefono_aprendiz` (Persona.telefono)
- `email_aprendiz` (Persona.email)
- `eps_aprendiz` (Matricula.eps)
- `arl_aprendiz` (Matricula.arl)
- `sector_economico` (Matricula.sectorEconomico / Persona.sectorEconomico)
- `empresa_nit` (Matricula.empresaNit)
- `empresa_representante_legal` (Matricula.empresaRepresentanteLegal)
- `tipo_vinculacion` (Matricula.tipoVinculacion)
- `nivel_previo` (Matricula.nivelPrevio)
- `centro_formacion_previo` (Matricula.centroFormacionPrevio)
- `numero_curso` (Curso.numeroCurso)
- `duracion_dias_curso` (Curso.duracionDias)
- `horas_totales_curso` (Curso.horasTotales)

#### 2. `src/data/autoFieldCatalog.ts` -- Nuevo archivo: catalogo centralizado

Crear un catalogo que agrupe los campos automaticos por origen/categoria, con metadata legible:

```typescript
export interface AutoFieldOption {
  key: AutoFieldKey;
  label: string;         // Nombre legible (ej: "Nombre completo")
  category: string;      // Grupo (ej: "Datos del aprendiz")
  source: string;        // Origen tecnico (ej: "Persona")
  description?: string;  // Tooltip opcional
}

export const AUTO_FIELD_CATALOG: AutoFieldOption[] = [
  // --- Datos del Aprendiz (Persona) ---
  { key: 'nombre_aprendiz', label: 'Nombre completo', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'documento_aprendiz', label: 'Numero de documento', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'tipo_documento_aprendiz', label: 'Tipo de documento', category: 'Datos del Aprendiz', source: 'Persona' },
  // ... (todos los campos de Persona)

  // --- Datos Laborales (Matricula) ---
  { key: 'empresa_nombre', label: 'Nombre de la empresa', category: 'Datos Laborales', source: 'Matricula' },
  { key: 'empresa_cargo', label: 'Cargo', category: 'Datos Laborales', source: 'Matricula' },
  // ... (todos los campos laborales)

  // --- Datos del Curso ---
  { key: 'nombre_curso', label: 'Nombre del curso', category: 'Datos del Curso', source: 'Curso' },
  { key: 'fecha_inicio_curso', label: 'Fecha de inicio', category: 'Datos del Curso', source: 'Curso' },
  // ... (todos los campos del curso)

  // --- Personal asignado ---
  { key: 'entrenador_nombre', label: 'Entrenador', category: 'Personal Asignado', source: 'Curso' },
  { key: 'supervisor_nombre', label: 'Supervisor', category: 'Personal Asignado', source: 'Curso' },
];

export const AUTO_FIELD_CATEGORIES = [...new Set(AUTO_FIELD_CATALOG.map(f => f.category))];
```

#### 3. `src/pages/formatos/FormatoEditorPage.tsx` -- Mejorar el selector de auto_field

Reemplazar el `<Select>` plano actual (lineas 149-182) por un selector agrupado por categorias:

- Usar `<Select>` con `<SelectGroup>` + `<SelectLabel>` por cada categoria (Datos del Aprendiz, Datos Laborales, Datos del Curso, Personal Asignado).
- Cada opcion muestra el label legible, con un indicador sutil del origen (ej: badge con "Persona", "Matricula", "Curso").
- Importar el catalogo desde `autoFieldCatalog.ts` en vez de listar `<SelectItem>` inline.

Ademas, en la vista previa (`PreviewDialog`), cuando se renderiza un `auto_field`:
- Mostrar el label legible del catalogo en vez de la key tecnica.
- Indicar la categoria de origen entre parentesis.

---

### Detalles tecnicos

- El catalogo es un array constante exportado, sin logica de fetching. Se usa tanto en el editor como en la vista previa.
- Las nuevas `AutoFieldKey` se agregan al union type existente. La resolucion real de valores (cuando se construya el renderer en partes futuras) leera de Persona, Matricula o Curso segun corresponda.
- No se modifica ninguna logica de matriculas ni formatos existentes. Solo se amplia la paleta de campos disponibles y se mejora la UX del editor.

