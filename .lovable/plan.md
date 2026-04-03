
# Plan de Implementación Backend — FASE 4 y FASE 5

## Estado Actual
- **DB existente:** `perfiles`, `empresas`, `tarifas_empresa`, `cargos`, `personal`, `personal_adjuntos`, `niveles_formacion`, `personas`, `cursos`, `cursos_fechas_mintrabajo`, `matriculas`, `documentos_matricula`, `formatos_formacion`, `versiones_formato`, `formato_respuestas`, `audit_logs`
- **ENUMs existentes con valores incorrectos (necesitan recrearse):**
  - `estado_factura`: tiene `pendiente, parcial, pagada` → necesita `por_pagar, parcial, pagada`
  - `estado_grupo_cartera`: tiene `pendiente, parcial, pagado, vencido, anulado` → necesita `sin_facturar, facturado, abonado, pagado, vencido`
  - `tipo_actividad_cartera`: tiene `nota, llamada, correo, sistema` → necesita `llamada, promesa_pago, comentario, sistema`
- **ENUMs faltantes:** `tipo_responsable`, `tipo_doc_portal`, `estado_doc_portal`
- **ENUMs existentes OK:** `estado_certificado`, `estado_excepcion_certificado`, `seccion_comentario`, `metodo_pago`
- **Servicios mock a migrar:** `carteraService.ts`, `certificadoService.ts`, `plantillaService.ts`, `excepcionCertificadoService.ts`, `portalEstudianteService.ts`, `portalAdminService.ts`, `portalMonitoreoService.ts`
- **Storage buckets ya creados:** `firmas`, `documentos-matricula`, `adjuntos-personal`, `facturas`, `certificados`

---

## Paso 1 — Migración: Corregir ENUMs + crear faltantes

- Recrear 3 ENUMs con valores correctos (DROP/CREATE o ALTER TYPE ADD VALUE):
  - `estado_factura` → `por_pagar, parcial, pagada`
  - `estado_grupo_cartera` → `sin_facturar, facturado, abonado, pagado, vencido`
  - `tipo_actividad_cartera` → `llamada, promesa_pago, comentario, sistema`
- Crear 3 ENUMs nuevos:
  - `tipo_responsable` (`empresa`, `independiente`, `arl`)
  - `tipo_doc_portal` (`firma_autorizacion`, `evaluacion`, `formulario`, `solo_lectura`)
  - `estado_doc_portal` (`bloqueado`, `pendiente`, `completado`)
- Agregar valores faltantes a `tipo_entidad_audit`: `plantilla_certificado`, `excepcion_certificado`, `responsable_pago`, `actividad_cartera`

**Nota:** Como estos ENUMs no están en uso todavía (no hay tablas de cartera/certificados), se pueden hacer DROP + CREATE sin riesgo.

---

## Paso 2 — Migración: Módulo de Cartera (7 tablas + 4 funciones + triggers)

### Tablas:
- `responsables_pago`: tipo, nombre, nit, empresa_id (FK opcional a empresas), contacto, dirección
- `grupos_cartera`: responsable_pago_id (FK RESTRICT), estado, total_valor, total_abonos, saldo, observaciones
- `grupo_cartera_matriculas`: tabla de vinculación (grupo_cartera_id, matricula_id) — PK compuesto
- `facturas`: grupo_cartera_id (FK RESTRICT), numero_factura, fechas, subtotal, total, estado, archivo_factura
- `factura_matriculas`: tabla de vinculación con valor_asignado — PK compuesto
- `pagos`: factura_id (FK CASCADE), fecha, valor, metodo_pago, soporte_pago, observaciones
- `actividades_cartera`: grupo_cartera_id (FK CASCADE), factura_id (FK SET NULL), tipo, descripción, fecha, usuario

### Funciones SQL:
1. `recalcular_grupo_cartera(p_grupo_id)` — Recalcula totales y estado del grupo basado en matrículas vinculadas y pagos acumulados
2. `recalcular_estado_factura()` — Trigger AFTER INSERT/UPDATE/DELETE en pagos que recalcula estado de factura + llama a recalcular_grupo_cartera
3. `sync_factura_a_matriculas()` — Trigger AFTER INSERT/UPDATE en facturas que sincroniza factura_numero y fecha_facturacion en matrículas
4. `on_delete_factura()` — Trigger BEFORE DELETE en facturas que limpia datos en matrículas y recalcula grupo
5. `registrar_actividad_sistema_factura()` — Trigger AFTER INSERT en facturas que auto-registra actividad de sistema
6. `registrar_actividad_sistema_pago()` — Trigger AFTER INSERT en pagos que auto-registra actividad de sistema

### RLS en todas las tablas:
- SELECT para autenticados
- ALL para admin/global

### Triggers de auditoría en: responsables_pago, grupos_cartera, facturas, pagos

**Reglas cubiertas:** RN-CAR-001 a RN-CAR-019, RN-INT-004, RN-INT-005, RN-INT-008

---

## Paso 3 — Migración: Módulo de Certificación (3 tablas)

### Tablas:
- `plantillas_certificado`: nombre, tipo_formacion, svg_template, token_mappings JSONB, niveles_asignados UUID[], reglas JSONB, version, activa, soft-delete
- `plantilla_certificado_versiones`: plantilla_id (FK CASCADE), svg_snapshot, token_mappings_snapshot, version, creador
- `certificados`: matricula_id (FK RESTRICT), plantilla_id (FK), plantilla_version, codigo_unico (UNIQUE), estado, datos_snapshot JSONB, svg_renderizado, storage_path, revocación (por/motivo/fecha), version_certificado
- `excepciones_certificado`: matricula_id (FK CASCADE), tipo, motivo, estado, aprobado_por, fecha_resolucion

### RLS, triggers de auditoría

**Reglas cubiertas:** RN-CER-001 a RN-CER-006

---

## Paso 4 — Migración: Portal del Estudiante (2 tablas + 2 funciones)

### Tablas:
- `portal_config_documentos`: key (UNIQUE), nombre, tipo (tipo_doc_portal), requiere_firma, depende_de TEXT[], orden, habilitado_por_nivel JSONB, activo
- `documentos_portal`: matricula_id (FK CASCADE), documento_key, estado (estado_doc_portal), enviado_en, firma_base64, puntaje, respuestas JSONB, intentos JSONB, UNIQUE(matricula_id, documento_key)

### Funciones SQL:
1. `login_portal_estudiante(p_cedula TEXT)` — Busca matrícula vigente con portal habilitado, retorna JSONB con datos del estudiante
2. `get_documentos_portal(p_matricula_id UUID)` — Retorna documentos con evaluación de dependencias (desbloqueo automático)

### RLS:
- `portal_config_documentos`: SELECT autenticados, ALL admin/global
- `documentos_portal`: SELECT autenticados, ALL admin/global

**Reglas cubiertas:** RN-POR-001 a RN-POR-008

---

## Paso 5 — Reescritura: `carteraService.ts`

- Reemplazar todos los mock por queries Supabase a las 7 tablas de cartera
- Operaciones: CRUD responsables, grupos, facturas, pagos, actividades
- `asignarMatriculaACartera()`: buscar/crear responsable_pago + grupo_cartera + insertar en grupo_cartera_matriculas
- Los recálculos de estado se delegan a los triggers (ya no se hacen en el frontend)
- Eliminar importaciones de `mockCartera`, `mockData`, `mockEmpresas`

---

## Paso 6 — Reescritura: `certificadoService.ts` + `plantillaService.ts` + `excepcionCertificadoService.ts`

- `plantillaService`: CRUD contra `plantillas_certificado` + `plantilla_certificado_versiones`
- `certificadoService`: CRUD contra `certificados`, generar certificado con snapshot
- `excepcionCertificadoService`: CRUD contra `excepciones_certificado`
- Storage: subir SVG/PDF al bucket `certificados`
- Eliminar todas las dependencias de `mockCertificados`

---

## Paso 7 — Reescritura: `portalEstudianteService.ts` + `portalAdminService.ts` + `portalMonitoreoService.ts`

- `portalEstudianteService`: usar RPC `login_portal_estudiante` + `get_documentos_portal`, queries a `documentos_portal`
- `portalAdminService`: CRUD contra `portal_config_documentos`, toggle por nivel
- `portalMonitoreoService`: queries con joins (matriculas + personas + cursos + documentos_portal) para tabla de monitoreo
- Eliminar dependencias de `mockData`, `portalAdminConfig`, `portalEstudianteConfig`

---

## Archivos afectados

| Paso | Migraciones | Servicios | Tipos |
|------|------------|-----------|-------|
| 1 | 1 migración (ENUMs) | — | — |
| 2 | 1 migración (cartera) | — | — |
| 3 | 1 migración (certificación) | — | — |
| 4 | 1 migración (portal) | — | — |
| 5 | — | `carteraService.ts` | `cartera.ts` |
| 6 | — | `certificadoService.ts`, `plantillaService.ts`, `excepcionCertificadoService.ts` | `certificado.ts` |
| 7 | — | `portalEstudianteService.ts`, `portalAdminService.ts`, `portalMonitoreoService.ts` | `portalEstudiante.ts`, `portalAdmin.ts` |

**Total: 4 migraciones SQL, 7 servicios reescritos, 4 tipos ajustados. Los hooks no cambian.**

## Orden de dependencias

```text
Paso 1: Corregir/crear ENUMs
  │
  ├── Paso 2: Cartera (responsables_pago, grupos_cartera, facturas, pagos, actividades)
  │     └── Paso 5: carteraService.ts
  │
  ├── Paso 3: Certificación (plantillas, certificados, excepciones)
  │     └── Paso 6: certificadoService.ts + plantillaService.ts + excepcionCertificadoService.ts
  │
  └── Paso 4: Portal (config_documentos, documentos_portal, RPCs)
        └── Paso 7: portalEstudianteService.ts + portalAdminService.ts + portalMonitoreoService.ts
```
