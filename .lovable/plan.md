

# Plan de Implementación Backend — FASE 6: Analíticas, Comentarios y Auditoría

## Estado Actual

- **Tabla `comentarios`:** No existe. El servicio `comentarioService.ts` usa datos mock (`mockComentarios`).
- **Dashboard:** Calcula métricas en el frontend desde datos ya cargados (matrículas, cursos, grupos). Los generadores de gráficos en `mockDashboard.ts` usan datos hardcoded para volumen de matrículas e ingresos.
- **Auditoría:** La función `audit_log_trigger_fn()` existe y funciona. Los triggers están aplicados en tablas F3-F5 pero **faltan** en 7 tablas de F1-F2: `personas`, `empresas`, `tarifas_empresa`, `cursos`, `niveles_formacion`, `personal`, `cargos`.
- **ENUM `tipo_entidad_audit`:** Ya tiene los 20 valores necesarios (incluye `comentario`).

---

## Paso 1 — Migración: Tabla `comentarios` + auditoría faltante

### Tabla `comentarios`
- `id`, `entidad_tipo TEXT`, `entidad_id UUID`, `seccion seccion_comentario`, `texto TEXT`, `usuario_id UUID`, `usuario_nombre TEXT`, `editado_en TIMESTAMPTZ`, `created_at`
- Indice compuesto en `(entidad_tipo, entidad_id)`
- RLS: SELECT autenticados, ALL admin/global
- Trigger de auditoría: `audit_log_trigger_fn('comentario')`

### Triggers de auditoría faltantes (7 tablas)
Aplicar `audit_log_trigger_fn` en:
- `personas` → `'persona'`
- `empresas` → `'empresa'`
- `tarifas_empresa` → `'tarifa_empresa'`
- `cursos` → `'curso'`
- `niveles_formacion` → `'nivel_formacion'`
- `personal` → `'personal'`
- `cargos` → `'cargo'`

**Reglas cubiertas:** RN-COM-001 a RN-COM-003, INC-008, RN-AUD-001 a RN-AUD-004

---

## Paso 2 — Migración: Funciones SQL del Dashboard

### `get_dashboard_stats()`
Retorna JSONB con:
- `totalPersonas`, `totalMatriculas`, `matriculasActivas`, `cursosAbiertos`, `cursosEnProgreso`
- `certificadosEmitidos`, `ingresosMes`, `carteraPendiente`
- `matriculasIncompletas` (matrículas con documentos pendientes)
- `cursosSinCerrar` (en_progreso con fecha_fin pasada)
- `facturadoPagado` (suma abonos de grupos pagados)

### `get_dashboard_charts_data(p_periodo TEXT)`
Retorna JSONB con:
- `matriculasPorEstado`: conteo agrupado
- `cursosPorEstado`: conteo agrupado
- `ingresosPorMes`: pagos agrupados por mes (últimos 12 meses)
- `matriculasPorMes`: matrículas creadas por mes
- `distribucionTipoFormacion`: conteo por tipo de formación desde cursos

---

## Paso 3 — Reescritura: `comentarioService.ts`

- Reemplazar mock por queries Supabase a tabla `comentarios`
- `getByEntidadSeccion()`: SELECT con filtro `entidad_id` + `seccion`, ORDER BY `created_at DESC`
- `create()`: INSERT con `usuario_id` de auth y nombre del perfil
- `update()`: UPDATE `texto` + `editado_en = now()`
- `delete()`: DELETE real (sin soft-delete para comentarios)
- Eliminar dependencia de `mockComentarios` y `mockAuditLogs`

---

## Paso 4 — Reescritura: `mockDashboard.ts` → Dashboard con RPCs

- Reemplazar funciones de cálculo (`calcTotalFacturadoPagado`, `calcCarteraPorCobrar`, etc.) por llamada a RPC `get_dashboard_stats()`
- Reemplazar generadores hardcoded (`generateVolumenMatriculas`, `generateIngresosTiempo`) por RPC `get_dashboard_charts_data()`
- Actualizar `Dashboard.tsx` para usar las nuevas funciones
- Mantener el TodoWidget (localStorage) sin cambios
- Mantener `generateDistribucionNivel` como fallback frontend

---

## Archivos afectados

| Paso | Migraciones | Servicios | Páginas |
|------|------------|-----------|---------|
| 1 | 1 migración SQL | — | — |
| 2 | 1 migración SQL | — | — |
| 3 | — | `comentarioService.ts` | — |
| 4 | — | `mockDashboard.ts` | `Dashboard.tsx` |

**Total: 2 migraciones SQL, 1 servicio reescrito, 1 módulo de dashboard migrado, 1 página actualizada.**

## Orden de dependencias

```text
Paso 1: comentarios + audit triggers faltantes
Paso 2: funciones SQL dashboard (independiente de paso 1)
Paso 3: comentarioService.ts (depende de paso 1)
Paso 4: Dashboard RPCs (depende de paso 2)
```

