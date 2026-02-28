

## Plan: Auto-habilitación del portal al crear/asignar matrícula

### Problema actual

El campo `portalEstudiante` de una matrícula solo se inicializa cuando el estudiante accede al portal por primera vez (`buscarMatriculaVigente`). Esto significa que en el monitoreo, las matrículas nuevas aparecen sin datos de portal hasta que el estudiante ingrese su cédula.

### Cambios

#### 1. `src/services/matriculaService.ts`
- En `create()`: después de crear la matrícula, si tiene `cursoId`, consultar `portalDocumentosCatalogo` para obtener los documentos habilitados por nivel del curso e inicializar `portalEstudiante: { habilitado: true, documentos: [...] }` automáticamente.
- En `update()`: si se cambia el `cursoId` y la matrícula no tenía `portalEstudiante`, inicializarlo con los documentos del nuevo curso.

#### 2. `src/hooks/useCursos.ts` — `useAgregarEstudiantesCurso`
- Revisar la mutación que asigna matrículas a un curso. Si reasigna `cursoId`, asegurar que el `portalEstudiante` se inicialice con los documentos correspondientes al tipo de formación del curso.

#### 3. `src/services/portalEstudianteService.ts`
- Extraer la lógica de inicialización de `portalEstudiante` a una función reutilizable `initPortalEstudiante(matricula, curso)` que pueda llamarse tanto desde `create` como desde `buscarMatriculaVigente`.
- En `buscarMatriculaVigente`, mantener la inicialización lazy como fallback (por si hay datos legacy sin portal).

#### 4. `src/services/portalMonitoreoService.ts`
- En `getMonitoreoData()`, si una matrícula no tiene `portalEstudiante`, tratarla con `portalHabilitado: true` y todos los documentos en estado `pendiente` (en lugar de `bloqueado`), ya que ahora se espera que siempre esté inicializado.

### No se modifica

- La lógica del `Switch` de deshabilitación manual en `MonitoreoDetalleDialog` permanece igual.
- La lógica de dependencias entre documentos no cambia.
- El `PortalGuard` y acceso por cédula no cambian.

