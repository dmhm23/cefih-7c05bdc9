
# Plan: Refactorización para Autonomía Total en Gestión de Formatos

## Estado: Fases 1, 2, 3 y 5 completadas ✅

### Fase 1 ✅ — Resolución dinámica de nivel de formación
- `resolveAutoField.ts` ahora usa `resolveNivelFormacionLabel()` (cache dinámica desde DB) en vez del mapa legacy `NIVELES_FORMACION_EMPRESA`
- Se agregó `nivelFormacionNombre` al `AutoFieldContext` para resolución directa

### Fase 2 ✅ — Asistencia dinámica con fallback
- El bloque `attendance_by_day` muestra mensaje claro cuando `duracionDias` es 0 o null

### Fase 3 ✅ — Portal: habilitación por UUID de nivel
- Migración DB: nueva columna `niveles_habilitados UUID[]`, eliminada `habilitado_por_nivel` JSONB
- `get_documentos_portal` ahora filtra por `nivel_formacion_id` del curso
- Frontend actualizado: `DocumentoConfigDialog`, `DocumentosCatalogoTable`, `NivelesHabilitacionGrid`

### Fase 5 ✅ — Auto-vinculación Portal ↔ Formato
- Al guardar un formato con `visible_en_portal_estudiante = true`, se crea/reactiva automáticamente en `portal_config_documentos`
- Al desactivar, se marca `activo = false` (preserva historial)

### Fase 4 — Pendiente (proyecto separado)
- Desacoplar bloques especiales (`health_consent`, `data_authorization`, `evaluation_quiz`, `satisfaction_survey`) del código hardcodeado
- Convertirlos en composiciones de bloques primitivos editables desde el constructor
