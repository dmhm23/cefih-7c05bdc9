

## Plan: Persistir el código del estudiante en BD + sincronización automática con cambios del nombre del curso

### Diagnóstico

Hoy `codigo_estudiante` **no existe en BD**. Se calcula en runtime con `useCodigosCurso` → `calcularCodigosCurso` → `generarCodigoEstudiante`, ordenando matrículas por `created_at ASC`. Además, la función actual tiene un bug: usa `parseInt(curso.numeroCurso)` sobre nombres como `FIH-R-26-04-18`, que devuelve `NaN`, así que el segmento "consecutivo del curso" siempre cae al fallback `01` y nunca refleja el último segmento real del nombre del curso.

### Objetivo

1. Persistir el código del estudiante en la tabla `matriculas` como columna `codigo_estudiante`.
2. Calcular y guardar el código automáticamente cuando un estudiante es asignado a un curso.
3. Recalcular el código de **todos los estudiantes del curso** cuando el `nombre` del curso (número del curso) cambia manualmente.
4. Que Matrículas, Cursos, Certificados, Exportaciones y Portal lean el código persistido como fuente única de verdad — sin romper certificados ya emitidos.

---

### Arquitectura propuesta

#### 1. Esquema de BD

Agregar a `matriculas`:

| Columna | Tipo | Comentario |
|---|---|---|
| `codigo_estudiante` | `TEXT` (nullable) | Código persistido. Único por curso (índice parcial). |

Índice parcial único: `UNIQUE (curso_id, codigo_estudiante) WHERE codigo_estudiante IS NOT NULL AND deleted_at IS NULL`.

#### 2. Función SQL pura `calcular_codigo_estudiante`

`calcular_codigo_estudiante(_config JSONB, _nombre_curso TEXT, _fecha_inicio DATE, _index INT) RETURNS TEXT`

Replica la lógica de `generarCodigoEstudiante` en plpgsql:
- Construye prefijo + tipo + año + mes según flags del config.
- Para el "consecutivo del curso", **extrae el último segmento numérico del nombre del curso** (`FIH-R-26-04-18` → `18`) usando el separador del config y, como fallback, el guion. Si no hay número, cae a `01`.
- Concatena con el correlativo del estudiante con `lpad` según `longitudConsecutivoEstudiante`.

Esta función es la única fuente de verdad para el formato.

#### 3. Trigger de recálculo `recalcular_codigos_curso(_curso_id UUID)`

Función `SECURITY DEFINER` que:
1. Lee el curso, su `nivel_formacion_id` y la `config_codigo_estudiante` del nivel.
2. Si el nivel no tiene config activo → no hace nada (mantiene `NULL`).
3. Selecciona todas las matrículas del curso (`activo=TRUE AND deleted_at IS NULL`) ordenadas por `created_at ASC, id ASC` (mismo orden que el frontend).
4. Para cada matrícula, calcula el código con `calcular_codigo_estudiante` y hace `UPDATE` solo si cambió.

#### 4. Triggers que la disparan

- **`trg_matricula_codigo_assign`** en `matriculas` AFTER INSERT/UPDATE OF `curso_id, nivel_formacion_id, deleted_at, activo`: recalcula los códigos del curso afectado (y del curso anterior si cambió de curso).
- **`trg_curso_codigo_resync`** en `cursos` AFTER UPDATE OF `nombre, fecha_inicio, nivel_formacion_id`: recalcula los códigos de todas las matrículas de ese curso. **Esto resuelve el caso de edición manual del número del curso.**
- **`trg_nivel_codigo_resync`** en `niveles_formacion` AFTER UPDATE OF `config_codigo_estudiante`: recalcula los códigos de todos los cursos vinculados a ese nivel.

Todos usan `pg_trigger_depth() < 2` para evitar recursión.

#### 5. Backfill por demanda (sin alterar datos históricos)

Migración corre **una sola vez** la función `recalcular_codigos_curso` para cada `curso_id` distinto presente en `matriculas` activas, llenando `codigo_estudiante` para todas las matrículas existentes. Esto **no toca certificados ya emitidos** (siguen leyendo su `snapshot_datos.codigo`).

#### 6. Frontend: leer la columna persistida

- `Matricula` (tipo TS) y `rowToMatricula` ya mapean snake→camel automáticamente: `codigo_estudiante` → `codigoEstudiante`. Solo agregar el campo opcional al tipo.
- `useCodigosCurso` se mantiene como compat y simplemente devuelve el `codigoEstudiante` de cada matrícula leída de BD (ya no recalcula). Cero cambios en consumidores (`EnrollmentsTable`, `MatriculaDetallePage`, `CertificacionSection`, `exportCursoListado`, formatos dinámicos).
- Mostrar el `codigoEstudiante` también como columna nativa en:
  - **Cursos → EnrollmentsTable**: ya lo muestra vía `codigosMapa[m.id]`. Ahora viene de BD directamente.
  - **Matrículas (lista y detalle)**: ya lo lee `MatriculaDetallePage`. Agregar la columna en la tabla principal de Matrículas.
- **Eliminar la dependencia de react-query/recalculo en cliente** para el código (queda solo como fallback de presentación si el campo está vacío en cursos sin config activa).

#### 7. Comportamiento esperado tras el cambio

| Acción del usuario | Efecto en BD |
|---|---|
| Crear matrícula y asignarle un curso | Trigger `INSERT/UPDATE` calcula y guarda `codigo_estudiante`. |
| Editar el campo "Número del Curso" (`cursos.nombre`) de `FIH-R-26-04-18` a `FIH-R-26-04-25` | Trigger en `cursos` recalcula y actualiza `codigo_estudiante` de las N matrículas → de `…-18-001` a `…-25-001`. |
| Eliminar (soft-delete) una matrícula | Trigger recalcula los correlativos del curso (los demás se compactan). |
| Cambiar `config_codigo_estudiante` en el nivel | Trigger recalcula todos los códigos de cursos de ese nivel. |
| Certificado ya emitido | **No se altera** — usa snapshot histórico en `certificados.snapshot_datos`. |

### Detalles técnicos

- **Migración SQL**: una sola migración con `ALTER TABLE matriculas ADD COLUMN codigo_estudiante TEXT`, índice parcial único, las dos funciones (`calcular_codigo_estudiante` pura + `recalcular_codigos_curso`), los tres triggers, y al final un `DO $$ ... $$` que recorre `SELECT DISTINCT curso_id FROM matriculas WHERE deleted_at IS NULL` y llama a `recalcular_codigos_curso(curso_id)` para hacer backfill.
- **Type guards**: `formToRow` en `matriculaService` debe **excluir** `codigo_estudiante` de las escrituras del frontend (campo derivado, lo gestiona el trigger).
- **TS types**: agregar `codigoEstudiante?: string` a `Matricula` en `src/types/matricula.ts`. `src/integrations/supabase/types.ts` se regenera automáticamente.
- **`useCodigosCurso`**: refactor a hook delgado que retorna `Object.fromEntries(matriculas.map(m => [m.id, m.codigoEstudiante ?? '']))`. Mantiene firma pública (cero cambios en consumidores).
- **`generarPreviewCodigo`** se mantiene tal cual para el editor de configuración del nivel.
- **Función `extraerConsecutivoDeNombre`** vive solo en SQL (no se necesita en TS al persistir todo en BD).

### Validación

1. Crear curso `FIH-R-26-04-18`, asignar 3 estudiantes → BD muestra `…-18-001`, `…-18-002`, `…-18-003`.
2. Editar nombre del curso → `FIH-R-26-04-25`. Verificar que las 3 matrículas pasan a `…-25-001..003` automáticamente, sin recargar nada manual.
3. Soft-delete de la 2ª matrícula → las restantes quedan con códigos `…-25-001` y `…-25-002` (recompactado).
4. Editar `config_codigo_estudiante` del nivel (cambiar separador o longitud) → todos los códigos de los cursos del nivel se recalculan.
5. Generar certificado: usa el código persistido. Tras emitir, editar el nombre del curso → el certificado emitido conserva el código histórico (snapshot), pero la matrícula muestra el nuevo (es lo correcto: el certificado es inmutable).
6. Exportar CSV de inscripciones (Cursos): la columna "Código del Estudiante" usa el valor de BD.
7. Curso sin config activa de código → `codigo_estudiante` queda `NULL` y la UI muestra vacío (sin romper).

### Sin impacto colateral

- Cero cambios en estructura de certificados, plantillas, formatos o portal.
- Cero cambios en RLS (la columna nueva hereda las policies de `matriculas`).
- Cero cambios visibles en el editor de cursos (el campo "Número del Curso" sigue siendo editable manualmente).
- Cero cambios en los consumidores de `useCodigosCurso` (firma idéntica).
- Único impacto: una migración + ajustes mínimos en `matriculaService.formToRow`, `Matricula` type y `useCodigosCurso`.

