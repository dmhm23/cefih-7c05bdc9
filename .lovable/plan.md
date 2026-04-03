

# Plan: Permitir recrear personas eliminadas (soft-delete)

## Problema

La tabla `personas` tiene un constraint `UNIQUE (numero_documento)` que aplica a **todas** las filas, incluyendo las eliminadas (soft-delete con `deleted_at IS NOT NULL`). Cuando se elimina una persona y se intenta crear otra con el mismo documento, Postgres rechaza el INSERT por duplicado.

## Solución

Reemplazar el constraint `UNIQUE (numero_documento)` por un **índice parcial único** que solo aplique a registros activos (no eliminados):

```sql
ALTER TABLE public.personas DROP CONSTRAINT personas_numero_documento_key;
CREATE UNIQUE INDEX personas_numero_documento_activo_uq 
  ON public.personas (numero_documento) 
  WHERE deleted_at IS NULL;
```

Esto permite que existan múltiples filas con el mismo `numero_documento` siempre que las anteriores estén soft-deleted.

## Archivos afectados

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | 1 migración SQL | Reemplazar constraint por índice parcial único |

**Total: 1 migración, 0 archivos de código**

