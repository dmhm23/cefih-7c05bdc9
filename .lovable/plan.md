
# Plan de Implementación Backend — FASE 3

## Estado Actual
- **DB existente:** `perfiles`, `empresas`, `tarifas_empresa`, `cargos`, `personal`, `personal_adjuntos`, `niveles_formacion`, `personas`, `cursos`, `cursos_fechas_mintrabajo`, `audit_logs`
- **ENUMs existentes:** `estado_matricula`, `tipo_vinculacion`, `metodo_pago`, `estado_documento_matricula`, `tipo_documento_matricula`, `estado_formato`, `categoria_formato`, `scope_formato`, y todos los demás de Fase 1/2
- **ENUMs faltantes:** `nivel_previo`, `motor_render`, `estado_formato_respuesta`
- **Servicios mock a migrar:** `matriculaService.ts`, `documentoService.ts`, `formatoFormacionService.ts`, `driveService.ts`

---

## Paso 1 — Migración: Tabla `matriculas` + triggers

### SQL
- Crear ENUMs faltantes: `nivel_previo` (`trabajador_autorizado`, `avanzado`), `motor_render` (`bloques`, `plantilla_html`), `estado_formato_respuesta` (`pendiente`, `completado`, `firmado`)
- Tabla `matriculas` con 40+ columnas (schema completo del spec lineas 785-869):
  - FKs: `persona_id → personas(id) ON DELETE RESTRICT`, `curso_id → cursos(id) ON DELETE RESTRICT` (nullable), `empresa_id → empresas(id) ON DELETE RESTRICT`
  - Campos de vinculacion laboral (snapshot), salud, evaluaciones (JSONB), cartera, portal (JSONB)
  - UNIQUE(`persona_id`, `curso_id`) WHERE `curso_id IS NOT NULL` — evita duplicados
  - Indices en persona_id, curso_id, empresa_id, estado
- 3 triggers:
  1. **`snapshot_empresa_matricula()`** — BEFORE INSERT/UPDATE OF empresa_id: copia nombre, nit, representante desde empresas
  2. **`sync_fechas_curso_matricula()`** — BEFORE INSERT/UPDATE OF curso_id: copia fecha_inicio, fecha_fin desde cursos
  3. **`calcular_pagado_matricula()`** — BEFORE INSERT/UPDATE OF valor_cupo, abono: calcula `pagado = abono >= valor_cupo`
- Triggers estándar: `update_updated_at`, `audit_log_trigger_fn('matricula')`
- RLS: SELECT autenticados (deleted_at IS NULL), ALL para admin/global

**Reglas cubiertas:** RN-MAT-001 a RN-MAT-010, RN-MAT-014 a RN-MAT-022

---

## Paso 2 — Migración: Tabla `documentos_matricula`

### SQL
- Tabla `documentos_matricula`: id, matricula_id (FK CASCADE), tipo (`tipo_documento_matricula`), nombre, estado (`estado_documento_matricula`), storage_path, fecha_carga, fecha_documento, fecha_inicio_cobertura, opcional, archivo_nombre, archivo_tamano, created_at
- RLS: SELECT autenticados, ALL admin/global
- Trigger audit

**Reglas cubiertas:** RN-MAT-011 a RN-MAT-013

---

## Paso 3 — Migración: Tablas `formatos_formacion`, `versiones_formato`, `formato_respuestas`

### SQL
- Tabla `formatos_formacion`: 25+ columnas (nombre, codigo, categoria, motor `motor_render`, estado, visible_en_matricula, asignacion_scope `scope_formato`, niveles_asignados UUID[], tipos_curso_asignados `tipo_formacion[]`, html_template, css_template, bloques JSONB, legacy_component_id, encabezado_config JSONB, firmas, plantilla_base_id, deleted_at, etc.)
- Tabla `versiones_formato`: id, formato_id (FK CASCADE), html_snapshot, css_snapshot, creador, created_at
- Tabla `formato_respuestas`: id, matricula_id (FK CASCADE), formato_id (FK RESTRICT), estado `estado_formato_respuesta`, respuestas JSONB, firma_base64, firma_fecha, UNIQUE(matricula_id, formato_id)
- RPC `duplicar_formato(formato_id)` — copia formato con nombre "Copia de ...", estado borrador
- Función `get_formatos_for_matricula(matricula_id)` — resuelve formatos visibles por tipo/nivel
- RLS, triggers audit, update_updated_at en las 3 tablas

**Reglas cubiertas:** RN-FMT-001 a RN-FMT-033

---

## Paso 4 — Seed: 4 formatos legacy precargados

- INSERT de los 4 formatos legacy existentes en mock (`info_aprendiz`, `registro_asistencia`, `participacion_pta_ats`, `evaluacion_reentrenamiento`) con sus bloques JSONB completos
- Esto preserva la funcionalidad actual tras la migración

---

## Paso 5 — Reescritura: `matriculaService.ts`

- Reemplazar mock por `supabase.from('matriculas')` + `supabase.from('documentos_matricula')`
- Operaciones: getAll, getById (con join a documentos), getByPersona, getByCurso, getByEstado, getHistorialByPersona, create, update, cambiarEstado, delete (soft-delete)
- `capturarFirma` → update campo firma_base64 + upload a bucket `firmas`
- `registrarPago` → update campos de cartera en matrícula
- Eliminar dependencia de `mockMatriculas`, `mockCursos`, `mockPersonas`

---

## Paso 6 — Reescritura: `documentoService.ts` + `driveService.ts`

- `documentoService.ts`: Reemplazar funciones mock por queries a `documentos_matricula` + `niveles_formacion.documentos_requeridos`
- `driveService.ts`: Reemplazar URLs ficticias por `supabase.storage.from('documentos-matricula').upload()`
- Sincronización on-demand: al consultar matrícula, comparar documentos existentes vs requisitos del nivel y agregar faltantes

---

## Paso 7 — Reescritura: `formatoFormacionService.ts`

- Reemplazar mock completo por `supabase.from('formatos_formacion')`, `.from('versiones_formato')`, `.from('formato_respuestas')`
- Operaciones: getAll, getById, create, update, toggleActivo, duplicate (via RPC), archive (soft-delete), delete, search
- Versiones: saveVersion (INSERT snapshot), getVersiones, restoreVersion
- getForMatricula: llamar RPC `get_formatos_for_matricula`
- getPlantillasBase: query directa o datos estáticos en frontend (las plantillas base son templates UI, no datos de negocio)

---

## Archivos afectados

| Paso | Migraciones | Servicios | Tipos |
|------|------------|-----------|-------|
| 1 | 1 migración (matriculas + triggers) | — | — |
| 2 | 1 migración (documentos_matricula) | — | — |
| 3 | 1 migración (formatos + versiones + respuestas + RPCs) | — | — |
| 4 | 1 migración (seed datos legacy) | — | — |
| 5 | — | `matriculaService.ts` | `matricula.ts` (ajustar tipos) |
| 6 | — | `documentoService.ts`, `driveService.ts` | — |
| 7 | — | `formatoFormacionService.ts` | `formatoFormacion.ts` (ajustar AsignacionScope) |

**Total: 4 migraciones, 4 servicios reescritos, 2 archivos de tipos ajustados. Los hooks no cambian.**

## Dependencias
```text
Paso 1: matriculas (depende de personas, cursos, empresas — ya existen)
  │
  ├── Paso 2: documentos_matricula (depende de matriculas)
  │
  └── Paso 3: formatos + versiones + respuestas (depende de matriculas)
       │
       └── Paso 4: seed formatos legacy
            │
            ├── Paso 5: matriculaService.ts
            ├── Paso 6: documentoService.ts + driveService.ts
            └── Paso 7: formatoFormacionService.ts
```

## Notas
- Los hooks React Query (`useMatriculas`, `useFormatos`, etc.) no se modifican
- El tipo `AsignacionScope` del frontend incluye `'todos'` pero el ENUM DB usa `scope_formato` con `'nivel_formacion' | 'tipo_curso'`. El servicio mapeará `'todos'` como registros sin filtro de niveles/tipos
- Las plantillas base se mantienen como datos estáticos en el frontend (son templates UI preconstruidos, no datos de negocio persistidos)
- El campo `portal_estudiante` JSONB en matrículas se dejará como está para ser migrado en FASE 5
