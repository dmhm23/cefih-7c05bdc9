## Plan: Actualizar documento de requerimientos backend

### Objetivo
Sobrescribir `/mnt/documents/Requerimientos_Backend_Supabase_por_Fases.md` con el contenido completo de `Requerimientos_Backend_Supabase_por_Fases_v2.md`, que contiene la versión enriquecida (v4.0) con cobertura del 100% de las reglas de negocio.

### Cambios
- Reemplazar el contenido del archivo original (120 líneas, ~60% cobertura) con el documento v2 completo (1262 líneas, 100% cobertura)
- El archivo v2 ya mantiene la misma estructura por fases del original pero con:
  - Tablas detalladas con columnas, tipos, restricciones y referencias a reglas
  - 16 enums SQL definidos explícitamente
  - 12 triggers/functions con código SQL
  - 8 Edge Functions especificadas
  - Fase 6 (Dashboard) agregada
  - Tabla de trazabilidad completa (190+ reglas → fase de implementación)
  - Resolución de las 11 inconsistencias mapeadas

### Archivo afectado
| Archivo | Acción |
|---------|--------|
| `/mnt/documents/Requerimientos_Backend_Supabase_por_Fases.md` | Sobrescribir con contenido de v2 |

### Nota
El archivo v2 se conserva como respaldo.