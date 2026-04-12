# Plan: Refactorización para Autonomía Total en Gestión de Formatos

## Diagnóstico — Puntos de Dependencia Actuales

Después de examinar el código completo, identifico **4 puntos donde el sistema depende de código hardcodeado** en lugar de configuración del usuario:

### 1. Resolución de `empresa_nivel_formacion` usa mapa legacy

`resolveAutoField.ts` línea 96 busca el valor en `NIVELES_FORMACION_EMPRESA` (constantes hardcodeadas) en vez de consultar la tabla `niveles_formacion`. Resultado: muestra UUID crudo.

### 2. Bloques especiales (`health_consent`, `data_authorization`, `evaluation_quiz`, `satisfaction_survey`) son componentes React fijos

Estos 4 bloques tienen renderers hardcodeados. Si el usuario quisiera crear un nuevo formato con un "consentimiento de salud" personalizado, no puede modificar su estructura desde el editor — está fija en código.

### 3. Portal Estudiante: `habilitado_por_nivel` usa claves `tipo_formacion` (enum), no UUIDs de niveles

La tabla `portal_config_documentos` almacena `habilitado_por_nivel` como `{"reentrenamiento": true, "formacion_inicial": true, ...}`. Esto solo cubre los 4 tipos del enum y no distingue entre niveles que comparten el mismo `tipo_formacion`.

### 4. Sincronización Portal ↔ Formatos: depende de que `formato_id` esté correctamente vinculado

El trigger `sync_formato_respuestas_to_portal` busca por `formato_id` en `portal_config_documentos`. Si el admin crea un formato nuevo y lo agrega al portal, la vinculación funciona, **pero** si el formato se recrea (eliminar + volver a crear), el UUID cambia y el vínculo se rompe.

---

## Plan de Refactorización (por prioridad)

### Fase 1 — Resolución dinámica de nivel de formación (Bug inmediato)

**Archivo**: `src/utils/resolveAutoField.ts`

- Cambiar el case `empresa_nivel_formacion` para que **no use** `NIVELES_FORMACION_EMPRESA`
- En su lugar, recibir opcionalmente un `nivelFormacion` resuelto en el contexto (`AutoFieldContext`)
- El componente `DynamicFormatoDocument` ya recibe `curso` que tiene `nivelFormacionId` — enriquecer el contexto con el nombre del nivel resuelto desde la tabla `niveles_formacion`
- Agregar al `AutoFieldContext` un campo `nivelFormacionNombre: string | null`

### Fase 2 — Asistencia dinámica basada en nivel de formación

**Archivo**: `src/components/matriculas/formatos/DynamicFormatoDocument.tsx`

- En el bloque `attendance_by_day`, usar la cascada: `curso.duracionDias` → si es 0 o null, dejar vacío y colocar un texto claro como por ej "Sin fecha aún"

### Fase 3 — Portal: habilitación por UUID de nivel (no por enum)

**Migración DB + Frontend**

- **Migración**: Cambiar `habilitado_por_nivel` de JSONB con claves de enum a un **array de UUIDs** (`niveles_habilitados UUID[]`), similar a como `formatos_formacion.niveles_asignados` ya funciona
- **Actualizar** la función `get_documentos_portal` para filtrar por `nivel_formacion_id` del curso en vez de `tipo_formacion`
- **Frontend**: Actualizar `DocumentoConfigDialog`, `DocumentosCatalogoTable` y `NivelesHabilitacionGrid` para usar checkboxes de niveles por UUID

### Fase 4 — Desacoplar bloques especiales del código

**Objetivo**: Que `health_consent`, `data_authorization`, `evaluation_quiz` y `satisfaction_survey` sean configurables desde el editor

- Convertir estos bloques en **composiciones de bloques primitivos** (checkbox, radio, text, paragraph) con una propiedad `template_group` que los agrupe visualmente
- En el catálogo de bloques, mantener los accesos directos pero que al hacer clic inserten un **grupo de bloques primitivos** preconfigurados en vez de un bloque monolítico
- Esto permite al usuario modificar las preguntas, opciones y textos legales desde el editor

### Fase 5 — Auto-vinculación Portal ↔ Formato

**Objetivo**: Cuando el usuario activa "Visible en Portal Estudiante" en un formato, el sistema automáticamente lo registra en `portal_config_documentos`

- Al guardar un formato con `visible_en_portal_estudiante = true`, verificar si ya existe en `portal_config_documentos`; si no, crear la entrada automáticamente con `formato_id = formato.id`
- Al desactivar la visibilidad, marcar `activo = false` en `portal_config_documentos` (no eliminar, para preservar historial)
- Esto elimina el paso manual de "agregar al portal" después de crear el formato

---

## Orden de implementación recomendado


| Fase | Impacto                            | Complejidad | Archivos principales                                               |
| ---- | ---------------------------------- | ----------- | ------------------------------------------------------------------ |
| 1    | Alto — corrige UUID visible        | Baja        | `resolveAutoField.ts`, `DynamicFormatoDocument.tsx`                |
| 2    | Medio — asistencia correcta        | Baja        | `DynamicFormatoDocument.tsx`                                       |
| 5    | Alto — elimina paso manual         | Media       | `formatoFormacionService.ts`, `portalAdminService.ts`              |
| 3    | Alto — filtrado correcto por nivel | Media       | Migración DB, `portalAdminService.ts`, `DocumentoConfigDialog.tsx` |
| 4    | Alto — autonomía total             | Alta        | Refactor de 4 renderers, `BlockCatalog.tsx`, `EditorCanvas.tsx`    |


## Nota sobre Fase 4

La Fase 4 es la más compleja y podría dividirse en sub-fases. Recomiendo implementar las Fases 1, 2, 5 y 3 primero (resuelven el 80% de los problemas de autonomía) y luego abordar la Fase 4 como un proyecto separado.