

# Plan: Vincular matrículas existentes a Cartera y prevenir desincronización futura

## Diagnóstico

Las 2 matrículas existentes (IDs `9e0d12d4...` y `95b654ae...`) fueron creadas **antes** de que se integrara la llamada a `asignarMatriculaACartera` en el formulario. Por eso las tablas `responsables_pago`, `grupos_cartera` y `grupo_cartera_matriculas` están vacías.

El código actual **sí invoca** `asignarMatriculaACartera` al crear nuevas matrículas, pero hay dos problemas adicionales:

1. **Las matrículas existentes no tienen grupo de cartera** — necesitan ser vinculadas manualmente o mediante un proceso de sincronización.
2. **El query de búsqueda de responsable existente no filtra por `deleted_at IS NULL`** — podría encontrar responsables eliminados y reutilizarlos.

## Solución

### Paso 1: Migración de datos — vincular las 2 matrículas existentes

Ejecutar una migración SQL que:
- Cree el responsable de pago para "Gerenciar SAS" (empresa, NIT `800073419-7`, empresa_id `6aabe8d5...`)
- Cree un grupo de cartera para ese responsable
- Vincule las 2 matrículas al grupo
- Recalcule el grupo

### Paso 2: Corregir filtro `deleted_at` en `asignarMatriculaACartera`

En `src/services/carteraService.ts`, agregar `.is('deleted_at', null)` a las queries que buscan responsables existentes (líneas 109 y 137) para evitar reutilizar responsables soft-deleted.

### Paso 3: Agregar botón "Sincronizar Cartera" en la página de detalle de matrícula

En `MatriculaDetallePage.tsx`, detectar si la matrícula no tiene grupo de cartera asignado y mostrar un botón para vincularla. Esto cubre matrículas huérfanas que se crearon antes de la integración.

## Archivos afectados

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | 1 migración SQL | Crear responsable, grupo y vincular matrículas existentes |
| 2 | `src/services/carteraService.ts` | Agregar filtro `deleted_at IS NULL` en búsqueda de responsables |
| 3 | `src/pages/matriculas/MatriculaDetallePage.tsx` | Botón para vincular matrícula huérfana a cartera |

**Total: 1 migración, 2 archivos editados**

