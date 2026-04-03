

## Plan: Actualizar Especificación de Requerimientos Backend a v2.0

### Resumen

Actualizar `Docs/Especificación_de_Requerimientos_de_Software_Backend_v1.md` para cubrir el 100% de las 190+ reglas de negocio del documento v3, reflejar el estado actual de implementacion (autenticacion ya implementada), y agregar detalles tecnicos faltantes (schemas SQL, validaciones, triggers, Edge Functions).

---

### Cambios principales

#### 1. Metadata y Estado de Implementacion
- Version: v4.0 → **v5.0**
- Agregar seccion de estado por fase: indicar que la autenticacion (perfiles, RLS, Edge Functions `admin-crear-usuario` y `bootstrap-admin`) ya esta implementada
- Agregar referencia cruzada a `reglas_de_negocio_validadas_v3.md`

#### 2. Consideraciones Transversales — Agregar items faltantes
- **T-003 (Unificacion MetodoPago):** Resolver INC-009. El backend debe usar un unico ENUM con los 8 metodos: `transferencia_bancaria`, `efectivo`, `consignacion`, `nequi`, `daviplata`, `bre_b`, `corresponsal_bancario`, `otro`. Eliminar el enum reducido de Cartera (`transferencia`, `efectivo`, `consignacion`, `tarjeta`)
- **T-006 (Supabase Storage):** Definir buckets: `firmas`, `documentos-matricula`, `adjuntos-personal`, `facturas`. Politicas RLS por bucket
- **T-007 (Catalogos como ENUMs o tablas):** Definir estrategia para: sectores economicos (RN-EMP-004), ARLs (RN-EMP-005), tipos documento persona (RN-PER-002), generos (RN-PER-003), niveles educativos (RN-PER-004)

#### 3. Nueva seccion: FASE 0 — Autenticacion y Administracion (YA IMPLEMENTADA)
Documentar lo existente como referencia:
- Tabla `perfiles` (schema actual)
- Trigger `on_auth_user_created`
- Funcion `get_my_rol()` SECURITY DEFINER
- Politicas RLS implementadas
- Edge Functions: `admin-crear-usuario`, `bootstrap-admin`
- Marcar como **COMPLETADA**

#### 4. FASE 1 — Expandir con reglas faltantes

**Empresas:**
- Agregar campo `activo` (booleano, default true) — RN-EMP-003
- Constraint UNIQUE en `nit` — RN-EMP-002
- Filtrar empresas inactivas en autocomplete (resolver INC-010)
- Agregar seccion "Estudiantes Enviados": vista SQL que cuenta matriculas por empresa — RN-EMP-011, RN-EMP-012
- Integridad referencial: ON DELETE RESTRICT si tiene matriculas, tarifas o responsables_cartera — RN-EMP-013

**Tarifas:**
- Corregir modelo: UNIQUE(empresa_id, **nivel_formacion_id**) segun spec original, pero RN-EMP-007 dice `curso_id`. Alinear: usar `nivel_formacion_id` como FK y `curso_nombre` como campo desnormalizado — RN-EMP-009
- Agregar constraint UNIQUE explícito — resolver INC-006

**Personal:**
- Detallar tipos de cargo como ENUM: `entrenador`, `supervisor`, `administrativo`, `instructor`, `otro` — RN-PNL-001
- Validacion: entrenador de curso solo si cargo = `entrenador` o `instructor` — RN-PNL-005
- Validacion: supervisor de curso solo si cargo = `supervisor` — RN-PNL-006
- Tabla `personal_adjuntos`: nombre, tipo_mime, tamano, fecha_carga, storage_path — RN-PNL-004

**Niveles de formacion:**
- Detallar schema de `campos_adicionales` JSONB con los 12 tipos soportados — RN-NF-003
- Documentar alcance de campos: `solo_nivel` vs `todos_los_niveles` — RN-NF-004
- Detallar schema de configuracion de codigo estudiante — RN-NF-005, RN-NF-006
- Catálogo fijo de 6 documentos requeridos como ENUM — RN-NF-002

#### 5. FASE 2 — Expandir con reglas faltantes

**Personas:**
- ENUMs: tipo_documento (5 valores RN-PER-002), genero (3 valores RN-PER-003), nivel_educativo (10 valores RN-PER-004)
- Validacion trigger en contacto_emergencia: nombre y telefono obligatorios — RN-PER-005, resolver INC-004
- Firma digital: campo `firma` (TEXT/Base64 o storage_path) + `firma_fecha` — RN-PER-006
- Datos de direccion NO van en persona, solo en matricula — RN-PER-007

**Cursos:**
- Tipos de formacion como ENUM estricto (4 valores, sin `| string`) — RN-CUR-003, resolver INC-007
- Autogeneracion de nombre: trigger o funcion — RN-CUR-004
- Tabla `cursos_fechas_mintrabajo`: id, curso_id, fecha, motivo, created_by, created_at — RN-CUR-006
- Detallar las 15 columnas del CSV MinTrabajo con ARL como ultima — RN-CUR-007
- Validacion de asignacion de personal por tipo de cargo — RN-CUR-008 via RN-PNL-005/006
- Acciones masivas: generar certificados y eliminar estudiantes — RN-CUR-010

#### 6. FASE 3 — Expandir significativamente

**Matriculas:**
- Detallar schema SQL completo con todos los campos del tipo TypeScript (30+ columnas)
- Curso opcional (cursoId nullable) — RN-MAT-005
- Snapshot de empresa como trigger BEFORE INSERT — RN-MAT-007
- Consentimiento de salud: 6 campos booleanos + detalles — RN-MAT-009
- Estados como ENUM: `creada`, `pendiente`, `completa`, `certificada`, `cerrada` — RN-MAT-001
- Tipos vinculacion ENUM: `empresa`, `independiente`, `arl` — RN-MAT-002
- Sincronizacion de documentos con nivel via trigger o Edge Function — RN-MAT-013
- Auto-init portal estudiante al crear con curso — RN-MAT-021
- Auto-asignacion a cartera al crear — RN-MAT-022
- Evaluacion reentrenamiento: 15 preguntas, umbral 70% — RN-MAT-015

**Documentos matricula:**
- Tipos como ENUM (8 valores) — RN-MAT-012
- Estados: `pendiente`, `cargado` — RN-MAT-011
- Campo `opcional` booleano

**Formatos (expansion mayor):**
- Motor dual: `bloques` (legacy) y `plantilla_html` — RN-FMT-001/002
- 4 formatos legacy identificados por `legacy_component_id` — RN-FMT-003
- Estados: `borrador`, `activo`, `archivado` — RN-FMT-004
- Categorias ENUM: `formacion`, `evaluacion`, `asistencia`, `pta_ats`, `personalizado` — RN-FMT-008
- Asignacion por scope: `nivel_formacion` o `tipo_curso` — RN-FMT-009
- Mapeo nivel→tipo para filtrado — RN-FMT-010
- Resolucion con fallback a `empresaNivelFormacion` — RN-FMT-011
- Sincronizacion en tiempo real (sin snapshot) — RN-FMT-012
- 36 tokens en 6 categorias — RN-FMT-014
- Edge Function `resolve-formato-context` — RN-FMT-015/017
- Versionado: tabla `versiones_formato` — RN-FMT-020/021/022
- Plantillas base preconstruidas — RN-FMT-023/024
- Encabezado institucional configurable — RN-FMT-025
- Firmas requeridas por formato — RN-FMT-026
- Duplicacion con reglas — RN-FMT-027
- Motor bloques: 18 tipos detallados — RN-FMT-028
- Respuestas: tabla `formato_respuestas` con estados — RN-FMT-033

#### 7. FASE 4 — Expandir Cartera y Certificacion

**Cartera:**
- MetodoPago unificado (8 valores) — resolver INC-009
- Estados grupo ENUM: 5 valores — RN-CAR-002
- Estados factura ENUM: 3 valores — RN-CAR-003
- Recalculo de estado como funcion SQL, no solo en consulta — RN-CAR-011/012
- Sincronizacion bidireccional factura↔matricula — RN-CAR-013/014
- Eliminar factura cascadea pagos — RN-CAR-015
- Actividades de cartera: tabla con 4 tipos — RN-CAR-016
- Actividades automaticas del sistema — RN-CAR-017
- Navegacion a empresa desde cartera — RN-CAR-019

**Certificacion:**
- Estados ENUM: `elegible`, `generado`, `bloqueado`, `revocado` — RN-CER-001
- Snapshot JSON + SVG renderizado — RN-CER-002
- Reglas por tipo de certificado — RN-CER-004
- Excepciones: estados `pendiente`, `aprobada`, `rechazada` — RN-CER-005
- Revocacion con registro de quien, motivo, fecha — RN-CER-006

#### 8. FASE 5 — Expandir Portal

- Acceso por cedula con validacion de vigencia (fechaFin >= hoy) — RN-POR-003
- Dependencias entre documentos — RN-POR-005
- Orden configurable — RN-POR-006
- Habilitacion por nivel de formacion — RN-POR-007
- Multiples intentos por documento — RN-POR-008

#### 9. FASE 6 — Expandir Comentarios y Dashboard

**Comentarios:**
- Renombrar `matriculaId` a `entidad_id` + agregar `entidad_tipo` — resolver INC-008
- Secciones: `cartera`, `observaciones`, `curso_observaciones` — RN-COM-001

**Auditoria:**
- Expandir TipoEntidad con las 6 entidades faltantes — RN-AUD-004, resolver INC-001
- Total: 16 tipos de entidad auditables

#### 10. Nueva seccion: Resolucion de Deuda Tecnica
Tabla que mapea cada INC-00X a la solucion propuesta en el backend:

| ID | Problema | Solucion Backend |
|----|----------|-----------------|
| INC-001 | Auditoria incompleta | Expandir ENUM TipoEntidad a 16 valores |
| INC-004 | Contacto emergencia sin validar | Trigger de validacion en personas |
| INC-005 | Sin integridad referencial | ON DELETE RESTRICT en FKs criticas |
| INC-006 | Tarifas sin unicidad | UNIQUE constraint empresa+nivel |
| INC-007 | TipoFormacion abierto | ENUM estricto de 4 valores |
| INC-008 | matriculaId generico | Renombrar a entidad_id + entidad_tipo |
| INC-009 | MetodoPago divergente | ENUM unificado de 8 valores |
| INC-010 | Empresas inactivas en autocomplete | WHERE activo = true en queries |

---

### Archivo afectado

| Archivo | Accion |
|---|---|
| `Docs/Especificación_de_Requerimientos_de_Software_Backend_v1.md` | Reescritura mayor (~3x contenido original) |

### Notas
- Se preserva la estructura por fases pero se expande cada una con schemas SQL detallados, ENUMs, triggers, y Edge Functions
- Se agrega FASE 0 para autenticacion ya implementada
- Se mapea cada regla RN-XXX-NNN a su implementacion backend correspondiente
- Se resuelven las 10 inconsistencias activas del documento v3

