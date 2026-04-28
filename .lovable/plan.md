# Plan de corrección — Código de estudiante

## Parte A · Diagnóstico ampliado del índice único

### El índice que generó las colisiones

```text
Nombre  : uniq_matriculas_codigo_por_curso
Tabla   : public.matriculas
Tipo    : UNIQUE INDEX (parcial)
Columnas: (curso_id, codigo_estudiante)
WHERE   : codigo_estudiante IS NOT NULL AND deleted_at IS NULL
```

Creado en la migración `20260423111907` y desactivada la sincronización en `20260423153551` por colisiones durante el recálculo.

### Por qué se producían duplicados

La función original `recalcular_codigos_curso` hacía `UPDATE` fila a fila dentro de un mismo `curso_id`, **reusando el mismo espacio de claves del índice único**. Escenarios reproducibles:

1. **Eliminación intermedia.** Curso con códigos `0001..0005`. Se borra (soft) el `0003`. El recálculo recorre las 4 filas restantes en orden: cuando intenta poner `0003` al que era `0004`, la fila `0004` aún existe → colisión `(curso_id, '0003')` ya está… espera, no. El choque real ocurre con el otro caso:
2. **Reasignación entre cursos.** Matrícula con `0005` se mueve al curso B. El trigger dispara recálculo del curso B; si ya hay un `0005` allá, falla. Y si dispara recálculo del curso A para "compactar", la fila reasignada todavía no se ha persistido y el orden de eventos del trigger genera un estado intermedio inconsistente.
3. **Renumeración cíclica.** El recálculo no usa una etapa intermedia (NULL temporal) ni un sufijo provisional; intenta `UPDATE` directo a valores que pueden coincidir con códigos vigentes de otras filas del mismo curso aún no procesadas.
4. **Concurrencia.** Dos inserts casi simultáneos al mismo curso disparan dos recálculos en paralelo; sin `LOCK` o `advisory lock`, ambos calculan el mismo `idx` para distinto registro.

### Cómo evitar la colisión definitivamente

Tres mecanismos combinados:

- **Recálculo en dos fases:** primero `UPDATE … SET codigo_estudiante = NULL` para todas las filas del curso (las saca del índice parcial gracias al `WHERE codigo_estudiante IS NOT NULL`), luego asignar los nuevos valores. Sin solapamiento posible.
- **Serialización por curso:** `pg_advisory_xact_lock(hashtext('codigo_curso:' || curso_id))` al inicio de la función. Garantiza que dos recálculos del mismo curso no corran en paralelo.
- **Trigger `DEFERRABLE INITIALLY DEFERRED**` o ejecución `AFTER` con `STATEMENT`-level cuando aplique, para que el recálculo vea el estado final del statement y no estados intermedios.

---

## Parte B · Plan técnico atómico (10 pasos)

### Paso 1 — Corregir `parseInt` en frontend (parche temporal)

- Archivo: `src/utils/codigoEstudiante.ts`.
- Reemplazar `parseInt(curso.numeroCurso)` por una extracción real del último segmento numérico del `nombre`/`numeroCurso` con regex (`/(\d+)$/`), igual que la función SQL `extraer_consecutivo_nombre_curso`.
- Mantener este cálculo en memoria solo como **fallback de UI** mientras la BD aún no tenga `codigo_estudiante` persistido. Una vez completos los pasos 3–8, este cálculo deja de ser fuente de verdad.

### Paso 2 — Definir fuente de verdad

- **Fuente de verdad:** columna `matriculas.codigo_estudiante` poblada por la BD.
- Frontend solo lee. Hook `useCodigosCurso` se simplifica: devuelve `m.codigoEstudiante` directo desde la consulta de matrículas; si está `NULL`, muestra `—` o "Pendiente de asignación".
- Se elimina `calcularCodigosCurso` del flujo de visualización (queda únicamente `generarPreviewCodigo` para el editor de configuración del nivel).

### Paso 3 — Reescribir `recalcular_codigos_curso` (no reactivar la versión vieja)

Nueva implementación con tres garantías:

```text
1. pg_advisory_xact_lock(hashtext('codigo_curso:' || _curso_id))
2. UPDATE matriculas SET codigo_estudiante = NULL
   WHERE curso_id = _curso_id AND deleted_at IS NULL AND activo;
3. Loop ORDER BY created_at ASC, id ASC → asigna códigos nuevos
   con calcular_codigo_estudiante(...).
```

Ya no hay solapamiento porque entre el paso 2 y el 3 ninguna fila del curso participa del índice único parcial.

### Paso 4 — Matrículas nuevas asignadas a curso

- Trigger `trg_matriculas_resync_codigo_aiu` (AFTER INSERT) reactivado: dispara `recalcular_codigos_curso(NEW.curso_id)`.
- Cubre tanto creación con `curso_id` directo como asignación posterior vía formulario.

### Paso 5 — Matrículas reasignadas entre cursos

- Trigger `trg_matriculas_resync_codigo_au` (AFTER UPDATE OF curso_id, activo, deleted_at):
  - Si `OLD.curso_id IS DISTINCT FROM NEW.curso_id` → recalcular **curso anterior** (compactar) y **curso nuevo** (insertar al final).
  - Si `activo` o `deleted_at` cambian → recalcular el curso afectado.
- Gracias al lock por curso, no hay condición de carrera incluso si la reasignación es masiva.

### Paso 6 — Prevención de colisiones del índice único

- Mantener el índice `uniq_matriculas_codigo_por_curso` tal cual (sigue siendo la garantía de unicidad correcta).
- La fase intermedia `SET codigo_estudiante = NULL` los saca temporalmente del índice (es parcial sobre `IS NOT NULL`).
- Advisory lock por `curso_id` evita doble recálculo concurrente.
- `pg_trigger_depth() > 1` se mantiene para evitar recursión.

Paso 6.5 — Prueba controlada antes del backfill masivo

Antes de ejecutar el backfill sobre todos los cursos afectados, se debe probar la nueva función de recálculo en un curso controlado.

Curso sugerido: `FIH-R-26-04-25`.

Validar:

1. que los códigos dejan de usar `01`;  
2. que pasan a usar `25`;  
3. que no quedan códigos NULL;  
4. que no hay duplicados;  
5. que la UI muestra el valor persistido;  
6. que al refrescar la página el código permanece correcto;  
7. que no aparecen errores en consola ni red.

Solo después de esta validación se puede ejecutar el backfill normalizador.

### Paso 7 — Backfill normalizador de las 65 matrículas con `codigo_estudiante = NULL`

- Migración con bloque `DO $$` que recorre `SELECT DISTINCT curso_id FROM matriculas WHERE codigo_estudiante IS NULL AND curso_id IS NOT NULL AND deleted_at IS NULL` y llama `recalcular_codigos_curso(curso_id)`.
- Como la nueva función nulifica todo el curso primero, también re-numera los que ya tenían código → garantiza coherencia total por curso.

### Paso 8 — Corrección de matrículas con código de otro curso

- Caso detectado: matrícula `062511cb…` con código `FIH-R-26-04-20-0005` pero curso `FIH-R-26-04-24`.
- El backfill del paso 7 ya lo cubre: al recalcular `FIH-R-26-04-24` con la fase NULL→reasignar, esa fila recibe el código correcto del curso destino.
- Adicionalmente recalcular el curso **origen huérfano** (`FIH-R-26-04-20`) para compactar consecutivos vacíos.

### Paso 9 — Validación visual post-fix

Verificar en navegador que el código persistido coincide con la UI en:

- Tabla `EnrollmentsTable` (vista de curso): columna "Código".
- `MatriculaDetallePage`: header con código del estudiante.
- `EnrollmentsTable` de `MatriculasPage` (listado global).
- Generación de un certificado nuevo: token `{{matricula.codigo}}` en el SVG.

### Paso 10 — Plan de rollback

Si la nueva función o los triggers causan errores en producción:

1. **Rollback inmediato (sin perder datos):**
  ```sql
   DROP TRIGGER trg_matriculas_resync_codigo_aiu ON matriculas;
   DROP TRIGGER trg_matriculas_resync_codigo_au  ON matriculas;
   DROP TRIGGER trg_cursos_resync_codigos_au     ON cursos;
   DROP TRIGGER trg_niveles_resync_codigos_au    ON niveles_formacion;
  ```
   Los `codigo_estudiante` ya backfilleados quedan persistidos. La UI sigue mostrándolos correctamente (lectura directa).
2. **Reactivar fallback frontend** del Paso 1 (cálculo en memoria con regex corregido) si es necesario para nuevas matrículas mientras se diagnostica.
3. **Rollback completo:** restaurar la función no-op anterior (`RETURN;`). El índice único permanece, no rompe nada.
4. Backup de la columna `codigo_estudiante` antes del backfill: tabla auxiliar `_backup_codigos_estudiante` con `(matricula_id, codigo_estudiante_old, snapshot_at)` para restauración fila a fila.

---

## Resumen ejecutivo


| Capa                                  | Acción                                                |
| ------------------------------------- | ----------------------------------------------------- |
| Frontend `codigoEstudiante.ts`        | Fix de `parseInt`; pasa a fallback solamente          |
| Frontend `useCodigosCurso`            | Lee `m.codigoEstudiante` de BD como fuente única      |
| BD función `recalcular_codigos_curso` | Reescritura: lock + nulify + reasignar                |
| BD triggers (4)                       | Reactivar los 4 triggers existentes                   |
| BD datos                              | Backfill de 65 NULL + re-sync del registro huérfano   |
| Seguridad                             | Tabla `_backup_codigos_estudiante` antes del backfill |


¿Apruebas este plan para que proceda a implementarlo paso por paso?