

# Plan: Corregir contador de estudiantes inscritos en Cursos

## Diagnóstico

El problema es sistémico y afecta **todos** los cursos, no solo los mencionados. En `cursoService.ts` línea 56, el campo `matriculasIds` está hardcodeado como array vacío:

```typescript
matriculasIds: [],  // ← siempre vacío, nunca se consulta la BD
```

La BD confirma que sí hay matrículas asignadas (FI-0001 tiene 1, FIH-C-26-04-03 tiene 1), pero el servicio nunca las consulta.

## Solución

Enriquecer `mapCursoRow` con un conteo real de matrículas desde la BD. Hay dos enfoques:

**Enfoque elegido**: Agregar una subconsulta en `getAll()` y `getById()` que traiga los IDs de matrículas asociadas al curso, y poblar `matriculasIds` con esos datos reales.

Concretamente, en las queries de `cursoService.ts`:
1. Agregar un join/select a `matriculas` filtrando por `curso_id` y `deleted_at IS NULL`
2. Mapear los IDs resultantes al campo `matriculasIds` en `mapCursoRow`

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/services/cursoService.ts` | En `getAll()` y `getById()`, agregar select de `matriculas(id)` al query de Supabase. En `mapCursoRow`, poblar `matriculasIds` con los IDs reales en lugar de `[]` |

**Total: 1 archivo, 0 migraciones**

