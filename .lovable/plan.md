# Fase 1.1 — Corrección de la cascada de firmas server-side

## Problema detectado

La migración de Fase 1 creó la **función** `cascade_firma_to_targets()` correctamente, pero el **trigger** `trg_cascade_firma` no quedó registrado en `formato_respuestas` (el sistema reporta "There are no triggers in the database"). Por eso, cédulas como **1020405073** y **1010163760** siguen viendo los formatos hijos en estado pendiente, aun cuando el formato origen "Información del Aprendiz" ya fue diligenciado y firmado.

Evidencia complementaria:

- Las firmas existentes en `firmas_matricula` para esos estudiantes tienen `user_agent` del navegador del estudiante, no `'cascade_firma_to_targets'` → confirma que el trigger nunca se ejecutó.
- No existen filas en `formato_respuestas` para "PARTICIPACIÓN PTA - ATS" en esas matrículas, aunque el formato cumple los filtros de nivel.

## Cambios propuestos (1 sola migración SQL)

### 1) Re-crear el trigger faltante

```sql
DROP TRIGGER IF EXISTS trg_cascade_firma ON public.formato_respuestas;

CREATE TRIGGER trg_cascade_firma
AFTER INSERT OR UPDATE OF estado, answers
ON public.formato_respuestas
FOR EACH ROW
EXECUTE FUNCTION public.cascade_firma_to_targets();
```

### 2) Backfill forzado retroactivo

Tocar todas las respuestas ya completadas de formatos origen para que el trigger se dispare y propague firmas + cree los registros hijos faltantes:

```sql
UPDATE public.formato_respuestas fr
SET updated_at = now()
FROM public.formatos_formacion ff
WHERE fr.formato_id = ff.id
  AND fr.estado = 'completado'
  AND ff.es_origen_firma = TRUE
  AND ff.deleted_at IS NULL;
```

La función `cascade_firma_to_targets()` ya hace `ON CONFLICT DO UPDATE` con merge JSONB (`answers || EXCLUDED.answers`), por lo que **no sobrescribe respuestas existentes** — solo inyecta la firma donde falta y marca como completado los hijos.

### 3) Validación post-ejecución

Después de aplicar la migración, verificaré con SQL de solo lectura:

- Que `trg_cascade_firma` aparezca listado en `pg_trigger` para `formato_respuestas`.
- Que existan registros nuevos en `firmas_matricula` con `user_agent = 'cascade_firma_to_targets'` para las matrículas de 1020405073 y 1010163760.
- Que los formatos hijos (ej. "PARTICIPACIÓN PTA - ATS" y "**REGISTRO DE ASISTECIA DE FORMACION Y ENTRENAMIENTO EN ALTURAS" y para nuevos formatos que hereden firma origen**) tengan `estado = 'completado'` para esas matrículas.

## Riesgos y mitigaciones

- **Riesgo**: el `UPDATE` masivo dispara el trigger sobre cientos/miles de filas → la función tiene guarda `pg_trigger_depth() > 1` para evitar recursión y usa `ON CONFLICT DO UPDATE` idempotente.
- **Riesgo**: sobrescribir respuestas manuales en formatos hijos → mitigado por el merge `answers || EXCLUDED.answers` (las nuevas claves de firma se agregan sin tocar el resto) y por `COALESCE(completado_at, now())` (no pisa la fecha original si ya estaba completado).
- **No se borra ni se altera ningún dato existente** — solo se agregan firmas faltantes y se marcan como completados los hijos que aún estaban pendientes.

## Archivos que se tocarán

- **Nueva migración SQL** (1 archivo): re-creación del trigger + backfill.
- No hay cambios en código frontend (Fase 1 ya dejó el listener cliente como no-op).

¿Apruebas que ejecute esta Fase 1.1?