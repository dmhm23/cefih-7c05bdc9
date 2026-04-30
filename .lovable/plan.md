# Fase 3: Backfill de consolidados históricos

## Diagnóstico confirmado


| Métrica                              | Valor |
| ------------------------------------ | ----- |
| Consolidados cargados                | 13    |
| Matrículas afectadas                 | 13    |
| Documentos individuales a actualizar | 72    |


Todos los consolidados fueron cargados antes del fix de Fase 1. Los 72 documentos individuales cubiertos permanecen en `estado='pendiente'` con `storage_path=NULL`.

El caso de Andrés Fabián Camilo Vega Oviedo (`a9e91457-c6a0-4488-8017-a4c821203847`) tiene 5 requisitos pendientes (cedula, examen_medico, certificado_eps, arl, curso_previo) cubiertos por un consolidado cargado el 2026-04-23.

## Plan de implementación

### Paso 1 — Edge function temporal `backfill-consolidados`

Crea una edge function que:

1. Identifica todos los consolidados con `estado='cargado'`
2. Parsea los tipos cubiertos del campo `nombre` (formato: `Consolidado: tipo1|tipo2|...`)
3. Para cada consolidado, busca requisitos individuales de la misma matrícula que cumplan:
  - `estado = 'pendiente'`
  - `storage_path IS NULL`
  - `tipo` incluido en los tipos cubiertos
4. Actualiza esos requisitos con: `estado='cargado'`, `storage_path`, `archivo_nombre`, `fecha_carga` del consolidado
5. Soporta dos acciones: `dry-run` (solo cuenta) y `execute` (aplica cambios)

### Paso 2 — Deploy y dry-run

Desplegar la función, ejecutar dry-run para confirmar los 72 docs en 13 matrículas.

### Paso 3 — Paso 3 — Crear backup previo obligatorio

Antes de ejecutar el backfill, crear una tabla backup con las filas exactas de `documentos_matricula` que serán modificadas.

Tabla sugerida:

`_backup_documentos_consolidados_20260430`

Debe incluir como mínimo:

- id

- matricula_id

- tipo

- estado

- storage_path

- archivo_nombre

- fecha_carga

- updated_at

- backup_at

El backup debe incluir únicamente los documentos individuales que cumplen estas condiciones:

- estado = 'pendiente'

- storage_path IS NULL

- tipo incluido en los tipos cubiertos por un consolidado cargado

- misma matricula_id del consolidado

Este backup debe conservarse después del cleanup de la edge function.

Paso 4 — Ejecutar backfill

Después de crear el backup y confirmar el dry-run, llamar la función con `action: "execute"` y verificar el resultado.

La función solo debe actualizar documentos individuales que cumplan:

- estado = 'pendiente'

- storage_path IS NULL

- tipo incluido en los tipos cubiertos por el consolidado

- misma matricula_id del consolidado

No debe modificar documentos individuales que ya tengan archivo propio, storage_path diferente o estado cargado.

### Paso 5 — Validación del caso Andrés

Consultar `documentos_matricula` para `a9e91457-c6a0-4488-8017-a4c821203847` y confirmar que los 5 requisitos quedaron en `estado='cargado'`.

### Paso 6 — Validación global

Confirmar que no quedan consolidados con individuales cubiertos pendientes.

### Paso 7 — Cleanup

Eliminar la edge function temporal.

### Archivos a crear/modificar

- `supabase/functions/backfill-consolidados/index.ts` (temporal, se elimina al final)

### Riesgos

- Bajo: la función usa service role key internamente, no expone datos. Solo actualiza filas que cumplen las 3 condiciones (pendiente + NULL path + tipo cubierto).
- Los datos originales se pueden verificar con la query de dry-run si se necesita rollback manual.