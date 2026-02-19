

## Plan: Documentacion Completa del Sistema SAFA + Fix de Error de Build

### 1. Corregir error de compilacion

Antes de crear la documentacion, se debe corregir el error en `src/components/matriculas/MatriculaDetailSheet.tsx` linea 731. El archivo termina con `}` sin cerrar correctamente la funcion exportada. Se revisara la estructura de llaves/parentesis para identificar el cierre faltante o sobrante.

### 2. Crear archivo de documentacion

**Archivo**: `Docs/DOCUMENTACION_SISTEMA.md`

Contenido completo del documento:

---

#### Seccion 1: Introduccion al Sistema SAFA

- Proposito: Sistema de administracion para centros de formacion en trabajo seguro en alturas (Resolucion 4272 de 2021, Colombia).
- Arquitectura: Frontend-first con backend emulado. React + TypeScript + Vite + Tailwind CSS + TanStack Query.
- Patron de servicios: Capa de servicios asincrona que simula latencia de red (delay artificial) operando sobre arrays en memoria (`mockData.ts`). Cada operacion genera logs de auditoria automaticos.

#### Seccion 2: Modulo de Personas (Modulo A)

- **Entidad**: `Persona` (identificacion, datos personales, laborales, contacto de emergencia, firma digital).
- **Rutas**: `/personas`, `/personas/nuevo`, `/personas/:id`, `/personas/:id/editar`.
- **Operaciones**: CRUD completo con validacion de unicidad por numero de documento.
- **Componentes clave**: `PersonasPage` (tabla con busqueda, filtros por genero/sector/nivel educativo, seleccion multiple, columnas configurables), `PersonaDetailSheet` (panel lateral deslizable), `PersonaDetallePage` (vista completa), `PersonaFormPage` (formulario de creacion/edicion).
- **Logica de negocio**: Validacion de documento unico, busqueda por documento/nombre/email, eliminacion con log de auditoria.

#### Seccion 3: Modulo de Matriculas (Modulo B)

- **Entidad**: `Matricula` (vinculacion de una persona a un curso con toda la gestion documental, financiera y de certificacion).
- **Rutas**: `/matriculas`, `/matriculas/nueva`, `/matriculas/:id`.
- **Estados**: `creada`, `pendiente`, `completa`, `certificada`, `cerrada`.
- **Tipos de formacion**: Inicial, Reentrenamiento, Avanzado, Coordinador de Alturas.
- **Subsistemas**:
  - **Vinculacion laboral**: Empresa (con NIT, representante legal, nivel de formacion, contacto) o Independiente.
  - **Documentos requeridos**: Generacion dinamica segun nivel de formacion (`documentoService.ts`). Jefe de area: Cedula + ARL + EPS. Trabajador autorizado: + Examen Medico. Coordinador: + Certificado de Curso Previo. Modos de carga: Individual y Consolidado (PDF unico con checklist). Integracion simulada con Google Drive (`driveService.ts`).
  - **Consentimiento de salud**: Restricciones medicas, alergias, medicamentos, embarazo, nivel de lectoescritura.
  - **Cartera y pagos**: Valor del cupo, abonos, saldo calculado automaticamente, datos de facturacion (CTA-FACT, titular, fecha, forma de pago). Estado `pagado` se activa cuando saldo <= 0.
  - **Certificacion**: Fecha de generacion automatica y entrega manual del certificado.
  - **Comentarios**: Sistema dinamico con historial para secciones "cartera" y "observaciones".
  - **Formatos para formacion**: InfoAprendiz, RegistroAsistencia, ParticipacionPtaAts (documentos PDF previsualizables).
- **Historial**: Al crear una nueva matricula para una persona que ya tiene matriculas completadas, se puede prellenar informacion desde la matricula mas reciente.

#### Seccion 4: Modulo de Cursos (Modulo C)

- **Entidad**: `Curso` (nombre, descripcion, fechas, duracion, horas, entrenador, supervisor, capacidad maxima, estado).
- **Rutas**: `/cursos`, `/cursos/nuevo`, `/cursos/:id`.
- **Estados**: `abierto`, `en_progreso`, `cerrado`.
- **Subsistemas**:
  - **Gestion de estudiantes**: Modal para agregar matriculas existentes al curso (busqueda por cedula, seleccion multiple). Eliminacion de estudiantes con confirmacion.
  - **Validaciones**: No se puede cerrar un curso con matriculas pendientes. No se puede eliminar un curso con matriculas asociadas. Capacidad maxima controlada al matricular.
  - **Vista Calendario**: Vista alternativa al listado con modos Mes/Semana/Dia. Filtros por entrenador (multi-select con colores) y supervisor. Panel de resumen de horas ejecutadas por entrenador.
  - **Estadisticas**: Total matriculas, completas, pendientes, certificadas por curso.

#### Seccion 5: Dashboard

- Estadisticas globales: Total personas, matriculas (con pendientes), cursos (con activos), tasa de certificacion.
- Acciones rapidas: Nueva persona, nueva matricula, nuevo curso.
- Matriculas recientes con estado visual.

#### Seccion 6: Componentes Compartidos

- `DataTable`: Tabla generica con paginacion, seleccion multiple, acciones en lote.
- `DetailSheet`: Panel lateral deslizable reutilizable.
- `EditableField`: Campo editable inline con soporte para texto, select, fecha y badges.
- `SearchInput`, `FilterPopover`, `ColumnSelector`: Herramientas de busqueda y filtrado.
- `StatusBadge`: Badge de estado con colores semanticos.
- `ComentariosSection`: Historial de comentarios con CRUD.
- `ConfirmDialog`: Dialogo de confirmacion para acciones destructivas.
- `BulkActionsBar`: Barra de acciones masivas.
- `DocumentHeader`: Encabezado para documentos PDF.

#### Seccion 7: Capa de Servicios y Datos

- `api.ts`: Utilidades base (delay, simulateApiCall, ApiError).
- `personaService.ts`, `matriculaService.ts`, `cursoService.ts`, `comentarioService.ts`: Servicios CRUD con logs de auditoria.
- `documentoService.ts`: Generacion dinamica de documentos requeridos.
- `driveService.ts`: Simulacion de subida a Google Drive.
- `mockData.ts`: Datos iniciales en memoria.
- `formOptions.ts`: Catalogos (tipos de documento, generos, niveles educativos, sectores economicos, EPS, ARL, paises, etc.).

#### Seccion 8: Relacion entre Modulos

- Persona (1) --- (N) Matricula: Una persona puede tener multiples matriculas.
- Curso (1) --- (N) Matricula: Un curso contiene multiples matriculas (estudiantes).
- Matricula (1) --- (N) Documento: Cada matricula tiene documentos requeridos dinamicos.
- Matricula (1) --- (N) Comentario: Comentarios por seccion (cartera, observaciones).
- AuditLog: Registro transversal de todas las acciones CRUD en el sistema.

#### Seccion 9: Hooks (React Query)

Documentar cada hook custom y su proposito.

---

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| `Docs/DOCUMENTACION_SISTEMA.md` | Crear |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Corregir error de build (linea 731) |

