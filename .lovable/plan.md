

# Plan: Sincronizar formatos de formación con el portal de estudiantes

## Diagnóstico

Existen **dos sistemas completamente desconectados** para registrar el progreso de documentos del estudiante:

1. **`documentos_portal`** — Usado por el portal de estudiantes (`/estudiante`). Almacena estado de documentos como `info_aprendiz` y `evaluacion`. Cuando el estudiante firma o completa la evaluación, se escribe aquí vía `portalEstudianteService.enviarDocumento()`.

2. **`formato_respuestas`** — Usado por el lado administrativo (`/matriculas/:id`). Almacena respuestas y estado de los formatos de formación diligenciados desde el admin. Actualmente está **vacío** en la base de datos.

**No existe ningún puente entre ambas tablas.** Cuando un estudiante completa `info_aprendiz` con firma en el portal, eso se guarda en `documentos_portal` pero:
- No se refleja en `formato_respuestas` (que es lo que consulta `EnrollmentsTable` para elegibilidad de certificados).
- El admin ve los formatos como "pendientes" aunque el estudiante ya los haya completado.

Además, la tabla `portal_config_documentos` tiene una columna `formato_id` (que permite vincular un documento del portal con un formato de formación), pero actualmente está en `NULL` para ambos registros (`info_aprendiz` y `evaluacion`).

## Solución propuesta

Crear una sincronización bidireccional mediante un trigger de base de datos que, al completar un documento en `documentos_portal`, inserte o actualice el registro correspondiente en `formato_respuestas` si existe un `formato_id` vinculado.

### Cambios

| # | Tipo | Cambio |
|---|------|--------|
| 1 | **Migración** | Crear función + trigger `sync_portal_to_formato_respuestas`: cuando un registro en `documentos_portal` cambia a `estado = 'completado'` y el `documento_key` tiene un `formato_id` asociado en `portal_config_documentos`, hacer upsert en `formato_respuestas` con `estado = 'completado'`, `completado_at = now()`, y `answers = metadata`. |
| 2 | **Migración** | Crear función + trigger inverso `sync_formato_respuestas_to_portal`: cuando un `formato_respuestas` cambia a `estado = 'completado'`, buscar si existe un `portal_config_documentos` con ese `formato_id` y hacer upsert en `documentos_portal` con `estado = 'completado'`. |
| 3 | **Código** | En `portalEstudianteService.enviarDocumento()`, tras el upsert en `documentos_portal`, si el documento tiene `formato_id`, también hacer upsert en `formato_respuestas` desde el cliente (como respaldo del trigger, dado que las escrituras anon podrían no activar triggers con SECURITY DEFINER). |
| 4 | **Código** | En el servicio que guarda respuestas de formatos desde admin (dentro de `DynamicFormatoDocument` o similar), al completar un formato que está vinculado a `portal_config_documentos`, también actualizar `documentos_portal`. |
| 5 | **Admin UI** | En `portal_config_documentos`, vincular los documentos existentes con sus formatos correspondientes (actualizar `formato_id` para los registros que tienen formato asociado). Esto requiere identificar qué formatos en `formatos_formacion` corresponden a `info_aprendiz` y `evaluacion`. |

### Caso especial: documentos sin formato_id

Los documentos `info_aprendiz` y `evaluacion` actualmente no tienen `formato_id` vinculado. Para estos:
- `info_aprendiz` es un tipo `firma_autorizacion` que no corresponde a un formato de formación del constructor visual; su completitud se debe leer directamente de `documentos_portal`.
- `evaluacion` puede estar vinculada a un formato con bloque `evaluation_quiz`.

La sincronización debe funcionar para ambos escenarios:
1. Documentos del portal **con** `formato_id` → sincronización bidireccional vía DB.
2. Documentos del portal **sin** `formato_id` → la elegibilidad de certificados debe consultar también `documentos_portal` directamente.

### Impacto en elegibilidad de certificados

El `evaluarElegibilidad` recién implementado en `certificadoGenerator.ts` ya consulta `formato_respuestas`. Con esta sincronización, los datos del portal se reflejarán automáticamente. Para los documentos sin `formato_id` (como `info_aprendiz`), se debe agregar una consulta adicional a `documentos_portal` en `EnrollmentsTable` para verificar completitud.

## Archivos a modificar

| Archivo | Acción |
|---------|--------|
| Nueva migración SQL | Triggers de sincronización bidireccional |
| `src/services/portalEstudianteService.ts` | Agregar escritura a `formato_respuestas` al enviar documento con formato vinculado |
| `src/components/cursos/EnrollmentsTable.tsx` | Consultar `documentos_portal` para documentos sin `formato_id` en la validación de elegibilidad |
| `src/utils/certificadoGenerator.ts` | Ampliar `evaluarElegibilidad` para aceptar estado de documentos del portal |

**Total: 2-3 archivos editados, 1 migración**

