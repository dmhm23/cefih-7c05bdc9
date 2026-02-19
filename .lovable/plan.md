

## Plan: Reestructurar Modulo de Cursos (Creacion y Detalle)

Este plan cubre la refactorizacion completa del modulo de Cursos: nuevo formulario de creacion, nueva vista de detalle operativa, nuevos campos MinTrabajo, flujo de cierre con validaciones, y observaciones con motivo de cambio.

---

### Fase 1 — Actualizar tipos y datos

**Archivo: `src/types/curso.ts`**
- Agregar nuevos campos al tipo `Curso`:
  - `tipoFormacion`: `'jefe_area' | 'trabajador_autorizado' | 'reentrenamiento' | 'coordinador_ta'`
  - `numeroCurso`: string (alfanumerico)
  - `supervisorId`, `supervisorNombre` (ya existen como opcionales)
  - `minTrabajoRegistro`: string (opcional)
  - `minTrabajoResponsable`: string (opcional)
  - `minTrabajoFechaCierrePrincipal`: string (opcional)
  - `minTrabajoFechasAdicionales`: array de `{ id: string, fecha: string, motivo: string, createdBy: string, createdAt: string }`
- Crear tipo `TipoFormacion` y constante `TIPO_FORMACION_LABELS`
- Actualizar `CursoFormData` para incluir los nuevos campos

**Archivo: `src/data/formOptions.ts`**
- Agregar constante `TIPOS_FORMACION_CURSO` con las 4 opciones y valores default de duracion/horas por tipo:
  - Jefe de Area: 8h/1d
  - Trabajador Autorizado: 24h/3d
  - Reentrenamiento: 16h/2d
  - Coordinador T.A.: 40h/5d
- Agregar lista de supervisores mock

**Archivo: `src/data/mockData.ts`**
- Actualizar los 5 cursos existentes con los nuevos campos (`tipoFormacion`, `numeroCurso`, `minTrabajoRegistro`, etc.)
- Asignar `minTrabajoRegistro` y `minTrabajoFechaCierrePrincipal` solo a cursos cerrados (c3, c4) para demo

---

### Fase 2 — Actualizar servicio y hooks

**Archivo: `src/services/cursoService.ts`**
- Actualizar `cambiarEstado` para validar MinTrabajo al cerrar:
  - Si `nuevoEstado === 'cerrado'` y no hay `minTrabajoRegistro` o `minTrabajoFechaCierrePrincipal` -> lanzar `ApiError('Debe registrar el numero MinTrabajo y la fecha de cierre MinTrabajo', 400, 'MINTRABAJO_REQUERIDO')`
  - Mantener la validacion existente de matriculas pendientes despues
- Agregar metodos:
  - `actualizarMinTrabajo(id, data)`: actualiza campos MinTrabajo del curso
  - `agregarFechaAdicional(id, { fecha, motivo })`: push a `minTrabajoFechasAdicionales`
  - `eliminarFechaAdicional(id, fechaId)`: remove de la lista

**Archivo: `src/hooks/useCursos.ts`**
- Agregar hooks: `useActualizarMinTrabajo`, `useAgregarFechaAdicional`, `useEliminarFechaAdicional`

---

### Fase 3 — Comentarios para cursos

**Archivo: `src/types/comentario.ts`**
- Ampliar `SeccionComentario` para incluir `'curso_observaciones'`
- Agregar campo opcional `entidadTipo?: 'matricula' | 'curso'` y `entidadId?: string` al tipo `Comentario` (o alternativamente hacer que `matriculaId` sea generico como `entidadId`)
- Alternativa mas simple: mantener `matriculaId` pero usarlo como `entidadId` generico (reutilizar la infraestructura existente sin cambiar la interfaz del componente)

**Archivo: `src/services/comentarioService.ts`**
- Ajustar para que acepte un `entidadId` generico (internamente sigue filtrando por `matriculaId` del mock)

**Archivo: `src/components/shared/ComentariosSection.tsx`**
- Cambiar prop `matriculaId` a `entidadId` (con backwards compatibility)
- El componente ya funciona genericamente, solo renombrar la prop

---

### Fase 4 — Nuevo formulario de creacion (`/cursos/nuevo`)

**Archivo: `src/pages/cursos/CursoFormPage.tsx`** (reescribir)

Secciones del formulario:

**Card A - Identificacion del Curso**
- Tipo/Nivel de Formacion (select con 4 opciones) — al cambiar, autopoblar duracion y horas
- Numero del Curso (input alfanumerico)
- Fecha Inicio (date picker)
- Fecha Fin (date picker)

**Card B - Duracion**
- Duracion (dias) — autopoblado pero editable
- Horas Totales — autopoblado pero editable

**Card C - Operacion**
- Entrenador (selector existente)
- Supervisor (selector/input)
- Capacidad Maxima (input numerico pequeno, sin barra de progreso)

Eliminar del formulario:
- Campo "Nombre" (se elimina de UI, se autogenera internamente como `{TipoFormacion} - #{numeroCurso}`)
- Campo "Descripcion" (se elimina de UI)
- Campo "Estado Inicial" (siempre sera `abierto` al crear)

Validacion con Zod actualizada acorde a los nuevos campos.

---

### Fase 5 — Nueva vista de detalle (`/cursos/:id`)

**Archivo: `src/pages/cursos/CursoDetallePage.tsx`** (reescribir)

Compuesta por componentes pequenos. Layout:

**Header**
- Titulo: `{TIPO_FORMACION_LABELS[tipoFormacion]} - #{numeroCurso}`
- Meta: `Fecha inicio -> Fecha fin | Duracion | Horas`
- Badge de estado (StatusBadge existente)
- Boton CTA: "Cerrar Curso" (si no esta cerrado) o badge "Cerrado" en modo lectura
- Menu 3 puntos (DropdownMenu): Generar certificados, Generar PDFs, Exportar listado

**Card 1 — Informacion del Curso** (componente `CourseInfoCard`)
- Tipo/nivel de formacion, Numero del curso
- Fecha inicio/fin (editables con motivo de cambio)
- Duracion/horas (editables con motivo de cambio)
- Entrenador, Supervisor
- Ultima actualizacion

**Card 2 — Registro MinTrabajo** (componente `MinTrabajoCard`)
- Numero de registro MinTrabajo (input editable)
- Responsable del registro (input editable)
- Fecha de cierre MinTrabajo principal (date picker)
- Lista de fechas adicionales (cada una con fecha + motivo)
- Boton "Agregar fecha adicional" -> abre dialog simple con fecha + motivo obligatorio
- Cada fecha adicional tiene acciones editar/eliminar

**Card 3 — Tabla de Estudiantes** (componente `EnrollmentsTable`)
- Columnas: Nombres/Apellidos, Empresa, Fecha Cobertura ARL, Fecha Examen, Estado Documental, Estado Financiero
- Filtro rapido: Todos | Pendientes/Creadas
- Accion por fila: "Abrir matricula" (navegar a `/matriculas/:id`)
- Boton "Agregar estudiante" (modal existente `AgregarEstudiantesModal`)

**Card 4 — Resumen Compacto** (componente `CourseStatsChips`)
- Chips/contadores: Total, Completas, Pendientes, Certificadas
- Sin grafico grande, solo numeros en badges

**Card 5 — Observaciones** (componente `CourseObservations`)
- Wrapper de `ComentariosSection` con `entidadId={cursoId}` y seccion `'curso_observaciones'`
- Se registran automaticamente motivos de cambio cuando se editan campos sensibles

---

### Fase 6 — Flujo de cierre de curso

**Nuevo componente: `src/components/cursos/CloseCourseDialog.tsx`**
- Al hacer clic en "Cerrar Curso":
  1. Validar MinTrabajo (front): si falta `minTrabajoRegistro` o `minTrabajoFechaCierrePrincipal`, mostrar modal con mensaje y CTA "Completar Registro MinTrabajo" (scroll a Card 2)
  2. Llamar `cursoService.cambiarEstado(id, 'cerrado')` que valida matriculas pendientes en backend
  3. Si falla con `MATRICULAS_PENDIENTES`: mostrar modal con lista de estudiantes afectados y CTA "Ver pendientes" (aplica filtro en tabla)
  4. Si pasa: modal de confirmacion -> ejecutar cierre

---

### Fase 7 — Actualizar panel lateral (DetailSheet)

**Archivo: `src/components/cursos/CursoDetailSheet.tsx`**
- Adaptar para reflejar la nueva estructura:
  - Header con tipo formacion + numero en vez de nombre/descripcion
  - Reemplazar barra de capacidad grande por texto compacto (chip)
  - Agregar seccion MinTrabajo resumida
  - Mantener lista de estudiantes compacta existente

---

### Fase 8 — Actualizar tabla de listado

**Archivo: `src/components/cursos/CursosListView.tsx`**
- Cambiar columna "Nombre del Curso" por "Tipo Formacion - #Numero"
- Ajustar DEFAULT_COLUMNS si es necesario

---

### Nuevos archivos a crear

| Archivo | Proposito |
|---------|-----------|
| `src/components/cursos/CourseHeader.tsx` | Header del detalle con titulo, meta, badge, CTA y menu |
| `src/components/cursos/CourseInfoCard.tsx` | Card de informacion del curso |
| `src/components/cursos/MinTrabajoCard.tsx` | Card de registro MinTrabajo con fechas adicionales |
| `src/components/cursos/EnrollmentsTable.tsx` | Tabla de estudiantes inscritos con filtro y acciones |
| `src/components/cursos/CourseStatsChips.tsx` | Resumen compacto con chips |
| `src/components/cursos/CourseActionsMenu.tsx` | Menu 3 puntos con acciones masivas |
| `src/components/cursos/CloseCourseDialog.tsx` | Dialog de cierre con validaciones |
| `src/components/cursos/CourseObservations.tsx` | Wrapper de ComentariosSection para cursos |
| `src/components/cursos/AddFechaMinTrabajoDialog.tsx` | Dialog para agregar fecha adicional MinTrabajo |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/types/curso.ts` | Nuevos campos y tipos |
| `src/types/comentario.ts` | Ampliar seccion para cursos |
| `src/data/formOptions.ts` | Tipos de formacion con defaults |
| `src/data/mockData.ts` | Actualizar cursos mock |
| `src/services/cursoService.ts` | Validacion MinTrabajo + nuevos metodos |
| `src/services/comentarioService.ts` | Soporte generico para entidad |
| `src/hooks/useCursos.ts` | Nuevos hooks MinTrabajo |
| `src/hooks/useComentarios.ts` | Soporte generico |
| `src/pages/cursos/CursoFormPage.tsx` | Reescribir formulario |
| `src/pages/cursos/CursoDetallePage.tsx` | Reescribir con componentes nuevos |
| `src/components/cursos/CursoDetailSheet.tsx` | Adaptar a nueva estructura |
| `src/components/cursos/CursosListView.tsx` | Actualizar columnas |
| `src/components/shared/ComentariosSection.tsx` | Prop generica `entidadId` |

### Orden de implementacion

1. Tipos y datos (Fase 1)
2. Servicios y hooks (Fase 2)
3. Comentarios genericos (Fase 3)
4. Componentes nuevos de detalle (Fase 5-6: CourseHeader, CourseInfoCard, MinTrabajoCard, EnrollmentsTable, CourseStatsChips, CourseActionsMenu, CloseCourseDialog, CourseObservations, AddFechaMinTrabajoDialog)
5. Formulario de creacion (Fase 4)
6. Vista de detalle reescrita (Fase 5)
7. Panel lateral y listado (Fases 7-8)

