

# Grupo 1 -- Nucleo de Matricula (MVP Funcional)

## Analisis de brechas: Estado actual vs. Requerimientos

| Requerimiento | Estado actual | Ajuste necesario |
|---|---|---|
| Busqueda por documento Y por nombre/apellido | Solo busca por documento (`usePersonaByDocumento`) | Agregar busqueda por nombre |
| Mensaje UX claro "No encontramos a esta persona" | Existe mensaje pero dice "No se encontro persona con este documento" | Ajustar UX writing |
| Creacion de persona en modal (sin navegar) | Actualmente navega a `/personas/nuevo` (sale del flujo) | Crear modal con formulario de persona embebido |
| Al guardar persona, queda seleccionada automaticamente | No aplica porque navega fuera | Implementar con el modal |
| Fecha inicio/fin se autocompletan al asignar curso | No existen estos campos en matricula | Agregar campos de lectura (autocompletados desde el curso seleccionado) |
| Curso NO obligatorio al crear | Curso es obligatorio (`z.string().min(1)`) | Hacer cursoId opcional |
| Historial de formacion previa | No existe | Crear seccion con campos: nivel previo, centro de formacion, fecha certificacion |
| Autocompletado de historial si existe matricula anterior | No existe | Buscar matriculas previas de la persona y prellenar |
| Vinculacion laboral: Empresa vs Independiente | No existe, solo hay `areaTrabajo` y `sectorEconomico` en Persona | Crear seccion completa en matricula |
| Campos de empresa: nombre, NIT, representante legal, cargo, nivel de formacion, contacto | No existen | Agregar al modelo y formulario |
| Mover `areaTrabajo` y `sectorEconomico` de Persona a Matricula | Actualmente viven en Persona | Migrar campos al modelo de Matricula |

## Plan de implementacion

### Paso 1: Actualizar tipos y modelo de datos

**Archivo: `src/types/matricula.ts`**

Agregar nuevos campos al tipo `Matricula`:

- `fechaInicio?: string` (autocompletado desde curso)
- `fechaFin?: string` (autocompletado desde curso)
- Historial de formacion previa:
  - `nivelPrevio?: 'trabajador_autorizado' | 'avanzado'`
  - `centroFormacionPrevio?: string`
  - `fechaCertificacionPrevia?: string`
- Vinculacion laboral:
  - `tipoVinculacion?: 'empresa' | 'independiente'`
  - `empresaNombre?: string`
  - `empresaNit?: string`
  - `empresaRepresentanteLegal?: string`
  - `empresaCargo?: string`
  - `empresaNivelFormacion?: string`
  - `empresaContactoNombre?: string`
  - `empresaContactoTelefono?: string`
  - `areaTrabajo?: string` (migrado desde Persona)
  - `sectorEconomico?: string` (migrado desde Persona)

Agregar constantes de labels para los nuevos tipos.

### Paso 2: Actualizar opciones de formulario

**Archivo: `src/data/formOptions.ts`**

Agregar nuevas listas:

- `NIVELES_PREVIOS`: Trabajador Autorizado, Avanzado Trabajo en Alturas
- `TIPOS_VINCULACION`: Empresa, Independiente
- `NIVELES_FORMACION_EMPRESA`: Jefe de area, Trabajador autorizado, Reentrenamiento, Coordinador T.A.

### Paso 3: Actualizar mock data

**Archivo: `src/data/mockData.ts`**

Agregar los nuevos campos a las matriculas existentes con valores de ejemplo.

### Paso 4: Actualizar servicio de matricula

**Archivo: `src/services/matriculaService.ts`**

- Aceptar los nuevos campos en `create()` y `update()`
- Al crear, si se asigna un curso, copiar `fechaInicio` y `fechaFin` del curso
- Buscar matriculas previas de la persona para prellenar historial

### Paso 5: Crear modal de creacion de persona

**Nuevo archivo: `src/components/matriculas/CrearPersonaModal.tsx`**

- Dialog/modal que contiene el formulario completo de persona (reutilizando la estructura de `PersonaFormPage`)
- Al guardar exitosamente, cierra el modal y devuelve el ID de la persona creada via callback `onPersonaCreated(id: string)`

### Paso 6: Redisenar el formulario de matricula

**Archivo: `src/pages/matriculas/MatriculaFormPage.tsx`**

Reorganizar en secciones progresivas con Cards:

**Seccion 1 - Busqueda de Estudiante (mejorada)**
- Campo de busqueda unificado: busca por documento O por nombre/apellido
- Mensaje UX: "No encontramos a esta persona en el sistema"
- Boton "Crear persona" que abre el modal (no navega fuera)
- Al crear persona en modal, se selecciona automaticamente
- Se elimina el select de "seleccionar de la lista" (la busqueda lo reemplaza)

**Seccion 2 - Curso (opcional)**
- Select de curso (ya NO obligatorio)
- Al seleccionar curso: se muestran fecha inicio y fecha fin (autocompletados, solo lectura)
- Tipo de formacion (mantener)

**Seccion 3 - Historial de Formacion Previa (nueva)**
- Si la persona tiene matriculas previas: mostrar datos autocompletados con opcion de editar
- Si no tiene: campos vacios para ingreso manual
- Campos: nivel previo (select), centro de formacion (input), fecha de certificacion (date)

**Seccion 4 - Vinculacion Laboral (nueva)**
- Toggle/select: Empresa o Independiente
- Si Empresa: mostrar campos de empresa (nombre con autocomplete, NIT, representante legal, cargo, nivel de formacion, contacto)
- Si Independiente: ocultar campos de empresa
- Area de trabajo y sector economico (migrados desde el formulario de persona)

### Paso 7: Actualizar el panel lateral (DetailSheet)

**Archivo: `src/components/matriculas/MatriculaDetailSheet.tsx`**

Agregar las nuevas secciones al panel deslizable:
- Seccion de historial formativo
- Seccion de vinculacion laboral
- Mostrar area de trabajo y sector economico en el contexto de la matricula

### Paso 8: Actualizar la pagina de detalle

**Archivo: `src/pages/matriculas/MatriculaDetallePage.tsx`**

Agregar cards para las nuevas secciones de informacion.

### Paso 9: Migrar campos de Persona a Matricula

**Archivos afectados:**
- `src/types/persona.ts`: Marcar `areaTrabajo` y `sectorEconomico` como `@deprecated` (no eliminar aun para no romper datos existentes)
- `src/components/personas/PersonaDetailSheet.tsx`: Ocultar los campos migrados
- `src/pages/personas/PersonaFormPage.tsx`: Mantener por ahora pero agregar nota visual de que estos campos se gestionan desde la matricula

## Secuencia de implementacion

1. Tipos y opciones (pasos 1-2)
2. Mock data y servicio (pasos 3-4)
3. Modal de persona (paso 5)
4. Formulario de matricula rediseñado (paso 6)
5. Panel lateral y detalle (pasos 7-8)
6. Migracion de campos (paso 9)

## Notas importantes

- Los campos de Grupo 2 (consentimientos, firma digital, documentos) y Grupo 3 (cobros, certificados, estados finales) NO se tocan en esta fase, pero la estructura se prepara para recibirlos
- El formulario usa guardado explicito (boton "Crear Matricula"), no guardado automatico por seccion (eso se implementa progresivamente en grupos posteriores)
- La busqueda de persona en el formulario de matricula sera un componente de busqueda inteligente que consulta por documento o nombre, diferente al SearchInput actual que solo filtra texto

