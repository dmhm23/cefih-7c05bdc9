

# Plan de Implementación Backend — FASE 3

## Estado Actual
- **DB existente:** `perfiles`, `empresas`, `tarifas_empresa`, `cargos`, `personal`, `personal_adjuntos`, `niveles_formacion`, `personas`, `cursos`, `cursos_fechas_mintrabajo`, `audit_logs`
- **ENUMs existentes:** `estado_matricula`, `tipo_vinculacion`, `metodo_pago`, `estado_documento_matricula`, `tipo_documento_matricula`, `estado_formato`, `categoria_formato`, `scope_formato`, y todos los demas de Fase 1/2
- **ENUMs faltantes:** `nivel_previo`, `motor_render`, `estado_formato_respuesta`
- **Servicios mock a migrar:** `matriculaService.ts`, `documentoService.ts`, `formatoFormacionService.ts`, `driveService.ts`

---

## Paso 1 — Migracion: Tabla `matriculas` + triggers

- Crear ENUMs faltantes: `nivel_previo` (`trabajador_autorizado`, `avanzado`), `motor_render` (`bloques`, `plantilla_html`), `estado_formato_respuesta` (`pendiente`, `completado`, `firmado`)
- Tabla `matriculas` con 40+ columnas:
  - FKs: `persona_id → personas ON DELETE RESTRICT`, `curso_id → cursos ON DELETE RESTRICT` (nullable), `empresa_id → empresas ON DELETE RESTRICT`
  - Campos snapshot vinculacion laboral, salud (6 booleanos + detalles), evaluaciones JSONB, cartera, portal JSONB
  - UNIQUE parcial `(persona_id, curso_id) WHERE curso_id IS NOT NULL`
  - Indices en persona_id, curso_id, empresa_id, estado
- 3 triggers de negocio:
  1. `snapshot_empresa_matricula()` — copia nombre/nit/representante desde empresas al INSERT/UPDATE de empresa_id
  2. `sync_fechas_curso_matricula()` — copia fechas del curso al INSERT/UPDATE de curso_id
  3. `calcular_pagado_matricula()` — calcula `pagado = abono >= valor_cupo`
- Triggers estandar: `update_updated_at`, `audit_log_trigger_fn('matricula')`
- RLS: SELECT autenticados (deleted_at IS NULL), ALL admin/global

**Reglas cubiertas:** RN-MAT-001 a RN-MAT-022

---

## Paso 2 — Migracion: Tabla `documentos_matricula`

- Tabla: id, matricula_id (FK CASCADE), tipo, nombre, estado, storage_path, fecha_carga, fecha_documento, fecha_inicio_cobertura, opcional, archivo_nombre, archivo_tamano, created_at
- RLS y trigger audit

**Reglas cubiertas:** RN-MAT-011 a RN-MAT-013

---

## Paso 3 — Migracion: Formatos (`formatos_formacion`, `versiones_formato`, `formato_respuestas`)

- Tabla `formatos_formacion`: 25+ columnas (motor, estado, scope, niveles_asignados UUID[], tipos_curso tipo_formacion[], html_template, bloques JSONB, legacy_component_id, encabezado_config JSONB, firmas, etc.)
- Tabla `versiones_formato`: snapshots HTML/CSS por formato
- Tabla `formato_respuestas`: respuestas por matricula+formato, UNIQUE(matricula_id, formato_id)
- RPC `duplicar_formato(formato_id)` — copia con nombre "Copia de ..."
- Funcion `get_formatos_for_matricula(matricula_id)` — resuelve formatos por tipo/nivel
- RLS, triggers audit en las 3 tablas

**Reglas cubiertas:** RN-FMT-001 a RN-FMT-033

---

## Paso 4 — Seed: 4 formatos legacy precargados

- INSERT de los 4 formatos legacy (`info_aprendiz`, `registro_asistencia`, `participacion_pta_ats`, `evaluacion_reentrenamiento`) con bloques JSONB completos
- Preserva funcionalidad actual post-migracion

---

## Paso 5 — Reescritura: `matriculaService.ts`

- Reemplazar mock por `supabase.from('matriculas')` + joins con documentos
- Operaciones: CRUD, cambiarEstado, capturarFirma (storage), registrarPago
- Eliminar dependencia de `mockMatriculas`, `mockCursos`, `mockPersonas`

---

## Paso 6 — Reescritura: `documentoService.ts` + `driveService.ts`

- `documentoService`: queries a `documentos_matricula` + `niveles_formacion.documentos_requeridos`
- `driveService`: reemplazar URLs ficticias por `supabase.storage.from('documentos-matricula').upload()`
- Sincronizacion on-demand al consultar matricula

---

## Paso 7 — Reescritura: `formatoFormacionService.ts`

- Reemplazar mock por queries Supabase a las 3 tablas
- Versiones: saveVersion, getVersiones, restoreVersion
- getForMatricula via RPC `get_formatos_for_matricula`
- Plantillas base se mantienen como datos estaticos en frontend

---

## Archivos afectados

| Paso | Migraciones | Servicios | Tipos |
|------|------------|-----------|-------|
| 1-4 | 4 migraciones SQL | — | — |
| 5 | — | `matriculaService.ts` | `matricula.ts` |
| 6 | — | `documentoService.ts`, `driveService.ts` | — |
| 7 | — | `formatoFormacionService.ts` | `formatoFormacion.ts` |

**Total: 4 migraciones, 4 servicios reescritos, 2 tipos ajustados. Los hooks no cambian.**

## Orden de dependencias

```text
Paso 1: matriculas (depende de personas, cursos, empresas)
  ├── Paso 2: documentos_matricula
  └── Paso 3: formatos + versiones + respuestas
       └── Paso 4: seed formatos legacy
            ├── Paso 5: matriculaService.ts
            ├── Paso 6: documentoService.ts + driveService.ts
            └── Paso 7: formatoFormacionService.ts
```

