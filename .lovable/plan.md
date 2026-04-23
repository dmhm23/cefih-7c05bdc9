

## Plan: Fix `login_portal_estudiante` + prueba automatizada

### Problema confirmado
El RPC usa `IF _found IS NOT NULL THEN` para validar el resultado del `SELECT ... INTO _found`. En PL/pgSQL, un `RECORD` cuyos campos son todos `NULL` (o cualquier campo `NULL` proveniente de `LEFT JOIN`) puede evaluarse como `NULL` en esa comparación, haciendo que estudiantes con `nivel_formacion_id` pero sin `curso_id` (caso cédula `1110482552`) caigan al branch de `'sin_matricula'` aunque la consulta sí encontró fila.

### Cambios a implementar

#### 1. Migración: corregir el RPC

Una sola línea cambia. Reemplazar:

```sql
IF _found IS NOT NULL THEN
```

por:

```sql
IF FOUND THEN
```

`FOUND` es la variable booleana especial de PL/pgSQL que se setea a `TRUE` cuando el `SELECT ... INTO` devolvió al menos una fila, **independientemente de si los campos son `NULL`**. Es la forma correcta y idiomática de comprobar resultado en este patrón.

El resto del RPC se mantiene idéntico:
- La prioridad (curso activo → sin curso → curso cerrado) sigue funcionando.
- El fallback `COALESCE(c.nombre, nf.nombre, 'Portal del Estudiante')` ya cubre el `curso_nombre` cuando no hay curso.
- El `COALESCE(nf.tipo_formacion, c.tipo_formacion)` ya cubre el tipo.
- El branch final `'sin_matricula'` queda solo para los casos donde realmente no se encontró ninguna matrícula con nivel asignado.

#### 2. Prueba automatizada

Crear una edge function de pruebas Deno en `supabase/functions/login-portal-estudiante/login-portal-estudiante_test.ts` (siguiendo la convención de `supabase--test_edge_functions`) que:

a. **Setup**: usando el `SERVICE_ROLE_KEY`, inserta:
   - Una `persona` de prueba con cédula `TEST-PORTAL-NO-CURSO-{timestamp}` (cédula sintética para no chocar con datos reales).
   - Un `nivel_formacion` ya existente o crea uno temporal.
   - Una `matricula` con `nivel_formacion_id = <id>`, `curso_id = NULL`, `activo = TRUE`, `deleted_at = NULL`.

b. **Caso 1 — fix principal**: invoca `supabase.rpc('login_portal_estudiante', { p_cedula: '<cédula sintética>' })` y verifica:
   - `data[0].resultado === 'ok'`
   - `data[0].matricula_id` no nulo
   - `data[0].curso_id` es `NULL`
   - `data[0].curso_nombre` no vacío (debe caer al nombre del nivel o al literal `'Portal del Estudiante'`)
   - `data[0].portal_habilitado === true`

c. **Caso 2 — regresión**: invoca con una cédula inexistente y verifica `resultado === 'persona_no_encontrada'`.

d. **Caso 3 — regresión**: crea una persona con matrícula activa pero **sin** `nivel_formacion_id`, invoca y verifica `resultado === 'sin_matricula'`.

e. **Teardown**: hard-delete de las filas de prueba creadas (matrícula, persona y, si aplica, nivel temporal) usando `service_role` para evitar contaminar la BD.

Usa `Deno.test()` con steps (`t.step(...)`) y aserciones de `jsr:@std/assert`.

### Archivos a crear/modificar

1. **`supabase/migrations/<timestamp>_fix_login_portal_found.sql`** — migración con el `CREATE OR REPLACE FUNCTION public.login_portal_estudiante(...)` completo, idéntico al actual salvo el cambio `IF FOUND THEN`.
2. **`supabase/functions/login-portal-estudiante/login-portal-estudiante_test.ts`** — archivo Deno de pruebas con los 3 casos descritos. (Es el primer test del proyecto bajo esta convención; no se necesita una edge function "real" — el archivo `_test.ts` corre por sí solo con `supabase--test_edge_functions`).

### Cómo ejecuto la prueba

Tras desplegar la migración, corro `supabase--test_edge_functions` con `{"functions": ["login-portal-estudiante"]}` y reporto el resultado (esperado: 3 sub-tests verdes). Si falla, ajusto y repito.

### Riesgos y mitigación

- **Riesgo**: que la prueba deje datos huérfanos si revienta a mitad. **Mitigación**: usar un `try/finally` por step y cédulas con prefijo `TEST-PORTAL-` fácilmente identificables si hay que limpiar manualmente.
- **Riesgo**: que `nivel_formacion` requerido no exista en el entorno de test. **Mitigación**: el test consulta primero `niveles_formacion` y reusa el primer `id` activo; si no hay ninguno, hace skip explícito con mensaje claro.
- **Riesgo**: efectos colaterales en otros consumidores del RPC. **Mitigación**: ninguno — el cambio sólo elimina un falso negativo; los casos que antes retornaban `'ok'` lo siguen haciendo, y los que retornaban `'sin_matricula'` correctamente lo siguen haciendo.

### Sin cambios colaterales

- Cero cambios en frontend, hooks, servicios o tipos.
- Cero cambios en otras funciones, triggers o RLS.
- Cero cambios en datos productivos (la prueba se autolimpia).

