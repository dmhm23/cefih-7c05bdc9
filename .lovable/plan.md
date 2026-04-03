

# Plan de Implementación Backend — FASE 4 y FASE 5

## Estado Actual
- **DB existente:** `perfiles`, `empresas`, `tarifas_empresa`, `cargos`, `personal`, `personal_adjuntos`, `niveles_formacion`, `personas`, `cursos`, `cursos_fechas_mintrabajo`, `matriculas`, `documentos_matricula`, `formatos_formacion`, `versiones_formato`, `formato_respuestas`, `audit_logs`
- **ENUMs con valores incorrectos (necesitan recrearse):**
  - `estado_factura`: tiene `pendiente, parcial, pagada` — necesita `por_pagar, parcial, pagada`
  - `estado_grupo_cartera`: tiene `pendiente, parcial, pagado, vencido, anulado` — necesita `sin_facturar, facturado, abonado, pagado, vencido`
  - `tipo_actividad_cartera`: tiene `nota, llamada, correo, sistema` — necesita `llamada, promesa_pago, comentario, sistema`
- **ENUMs faltantes:** `tipo_responsable`, `tipo_doc_portal`, `estado_doc_portal`
- **ENUMs existentes OK:** `estado_certificado`, `estado_excepcion_certificado`, `seccion_comentario`, `metodo_pago`
- **Servicios mock a migrar:** `carteraService.ts`, `certificadoService.ts`, `plantillaService.ts`, `excepcionCertificadoService.ts`, `portalEstudianteService.ts`, `portalAdminService.ts`, `portalMonitoreoService.ts`

---

## Paso 1 — Migración: Corregir ENUMs + crear faltantes

- Recrear 3 ENUMs con valores correctos (DROP + CREATE, no hay tablas usandolos aún):
  - `estado_factura` → `por_pagar, parcial, pagada`
  - `estado_grupo_cartera` → `sin_facturar, facturado, abonado, pagado, vencido`
  - `tipo_actividad_cartera` → `llamada, promesa_pago, comentario, sistema`
- Crear 3 ENUMs nuevos:
  - `tipo_responsable` (`empresa`, `independiente`, `arl`)
  - `tipo_doc_portal` (`firma_autorizacion`, `evaluacion`, `formulario`, `solo_lectura`)
  - `estado_doc_portal` (`bloqueado`, `pendiente`, `completado`)
- Agregar valores faltantes a `tipo_entidad_audit`: `plantilla_certificado`, `excepcion_certificado`, `responsable_pago`, `actividad_cartera`

---

## Paso 2 — Migración: Módulo de Cartera (7 tablas + triggers)

### Tablas
- `responsables_pago`: tipo, nombre, nit, empresa_id (FK opcional), contacto, dirección
- `grupos_cartera`: responsable_pago_id (FK RESTRICT), estado, total_valor, total_abonos, saldo
- `grupo_cartera_matriculas`: PK compuesto (grupo_cartera_id, matricula_id)
- `facturas`: grupo_cartera_id (FK RESTRICT), numero_factura, fechas, total, estado, archivo
- `factura_matriculas`: PK compuesto con valor_asignado
- `pagos`: factura_id (FK CASCADE), fecha, valor, metodo_pago, soporte
- `actividades_cartera`: grupo_cartera_id (FK CASCADE), tipo, descripción, fecha

### Funciones y triggers
1. `recalcular_grupo_cartera(p_grupo_id)` — Recalcula totales/estado del grupo
2. `recalcular_estado_factura()` — Trigger AFTER en pagos → recalcula factura + grupo
3. `sync_factura_a_matriculas()` — Trigger AFTER en facturas → sincroniza datos en matrículas
4. `on_delete_factura()` — Trigger BEFORE DELETE → limpia matrículas + recalcula grupo
5. `registrar_actividad_sistema_factura/pago()` — Auto-registra actividades de sistema

### RLS + triggers de auditoría en todas las tablas

**Reglas cubiertas:** RN-CAR-001 a RN-CAR-019

---

## Paso 3 — Migración: Módulo de Certificación (4 tablas)

- `plantillas_certificado`: SVG, token_mappings, reglas JSONB, versionado, soft-delete
- `plantilla_certificado_versiones`: snapshots SVG por versión
- `certificados`: matricula_id (FK RESTRICT), código único, snapshot inmutable, revocación
- `excepciones_certificado`: matricula_id (FK CASCADE), tipo, motivo, estado, resolución

### RLS + triggers de auditoría

**Reglas cubiertas:** RN-CER-001 a RN-CER-006

---

## Paso 4 — Migración: Portal del Estudiante (2 tablas + 2 funciones)

- `portal_config_documentos`: key UNIQUE, tipo, dependencias, orden, habilitado_por_nivel JSONB
- `documentos_portal`: matricula_id + documento_key UNIQUE, estado, firma, puntaje, intentos JSONB

### Funciones SQL
1. `login_portal_estudiante(p_cedula)` — Busca matrícula vigente con portal habilitado
2. `get_documentos_portal(p_matricula_id)` — Retorna documentos con evaluación de dependencias

### RLS en ambas tablas

**Reglas cubiertas:** RN-POR-001 a RN-POR-008

---

## Paso 5 — Reescritura: `carteraService.ts`

- Reemplazar mock por queries Supabase a las 7 tablas
- `asignarMatriculaACartera()`: buscar/crear responsable + grupo + vincular matrícula
- Recálculos delegados a triggers (sin lógica en frontend)
- Eliminar dependencias de `mockCartera`, `mockData`, `mockEmpresas`

---

## Paso 6 — Reescritura: Servicios de certificación

- `plantillaService.ts`: CRUD + versionado contra `plantillas_certificado`
- `certificadoService.ts`: CRUD + generación con snapshot contra `certificados`
- `excepcionCertificadoService.ts`: CRUD contra `excepciones_certificado`
- Storage: bucket `certificados` para SVG/PDF

---

## Paso 7 — Reescritura: Servicios del portal

- `portalEstudianteService.ts`: RPC `login_portal_estudiante` + `get_documentos_portal`
- `portalAdminService.ts`: CRUD `portal_config_documentos`
- `portalMonitoreoService.ts`: queries con joins para tabla de monitoreo

---

## Orden de dependencias

```text
Paso 1: Corregir/crear ENUMs
  ├── Paso 2: Cartera → Paso 5: carteraService.ts
  ├── Paso 3: Certificación → Paso 6: certificadoService + plantillaService + excepcionService
  └── Paso 4: Portal → Paso 7: portalEstudianteService + portalAdminService + monitoreoService
```

**Total: 4 migraciones SQL, 7 servicios reescritos, ~4 tipos ajustados. Los hooks no cambian.**

