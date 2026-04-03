
# Especificación de Requerimientos de Software Backend (Supabase) — CEFIH v5.0

> **Versión:** 5.0  
> **Fecha:** 3 de Abril de 2026  
> **Fuentes:** `reglas_de_negocio_validadas_v3.md` (190+ reglas), `DOCUMENTACION_SISTEMA.md` (v1.9), código fuente front-end  
> **Cobertura:** 100% de reglas RN-*, INC-*, RN-INT-*, RN-UX-*

---

## Índice

1. [Introducción](#1-introducción)
2. [Consideraciones Arquitectónicas Transversales](#2-consideraciones-arquitectónicas-transversales)
3. [FASE 0 — Autenticación y Administración (COMPLETADA)](#fase-0--autenticación-y-administración-completada)
4. [FASE 1 — Fundamentos y Entidades Maestras](#fase-1--fundamentos-y-entidades-maestras)
5. [FASE 2 — Gestión Académica Core](#fase-2--gestión-académica-core)
6. [FASE 3 — Transaccionalidad y Formularios (Matrículas)](#fase-3--transaccionalidad-y-formularios-matrículas)
7. [FASE 4 — Gestión Financiera y Certificación](#fase-4--gestión-financiera-y-certificación)
8. [FASE 5 — Portal del Estudiante y Monitoreo Administrativo](#fase-5--portal-del-estudiante-y-monitoreo-administrativo)
9. [FASE 6 — Analíticas, Comentarios y Auditoría](#fase-6--analíticas-comentarios-y-auditoría)
10. [Resolución de Deuda Técnica](#resolución-de-deuda-técnica)
11. [Matriz de Trazabilidad Reglas → Backend](#matriz-de-trazabilidad)

---

## 1. Introducción

### 1.1. Objetivo Principal

Migrar e implementar la lógica de negocio central, persistencia de datos y reglas de validación en PostgreSQL (tablas, triggers, funciones SQL) y Edge Functions de Supabase, garantizando que el frontend React existente pueda operar sin inconsistencias de datos, delegando cálculos complejos al servidor.

### 1.2. Estado Actual de Implementación

| Componente | Estado |
|---|---|
| Autenticación (Supabase Auth, Email/Password) | ✅ Completado |
| Tabla `perfiles` + trigger `on_auth_user_created` | ✅ Completado |
| Función `get_my_rol()` SECURITY DEFINER | ✅ Completado |
| Políticas RLS en `perfiles` | ✅ Completado |
| Edge Function `admin-crear-usuario` | ✅ Completado |
| Edge Function `bootstrap-admin` | ✅ Completado |
| AuthGuard / AdminGuard en frontend | ✅ Completado |
| Tablas de negocio (empresas, personas, cursos, etc.) | ❌ Pendiente (mock) |
| Triggers de negocio y funciones SQL | ❌ Pendiente |
| Edge Functions de negocio | ❌ Pendiente |
| Supabase Storage (buckets) | ❌ Pendiente |

### 1.3. Resultados Esperados

1. **Consistencia Absoluta de Datos:** Cero registros huérfanos gracias a integridad referencial estricta (ON DELETE RESTRICT).
2. **Automatización Financiera:** Cálculo en tiempo real de saldos, abonos y estados de facturación (Motor de Cartera).
3. **Generación Documental Dinámica:** Renderizado preciso de formatos y certificados inmutables (PDF/SVG) con resolución de tokens.
4. **Trazabilidad Continua:** Historial de auditoría completo para las 16 entidades del sistema.
5. **Autoservicio Seguro:** Portal del estudiante protegido y dinámico, configurable desde panel administrativo.

---

## 2. Consideraciones Arquitectónicas Transversales

### T-001 — Soft-Deletes

Toda tabla principal incluye `deleted_at TIMESTAMPTZ DEFAULT NULL`. Las consultas PostgREST filtran por `deleted_at IS NULL` por defecto. Las vistas y funciones SQL respetan este filtro.

### T-002 — Auditoría Nativa

Trigger genérico `audit_log_trigger` en PostgreSQL para capturar INSERT, UPDATE y DELETE en todas las tablas principales. Registra el usuario (desde JWT `auth.uid()`), cambios en formato JSONB, y timestamp.

**Entidades auditables (16 total):** `persona`, `matricula`, `curso`, `comentario`, `nivel_formacion`, `personal`, `cargo`, `certificado`, `plantilla_certificado`, `excepcion_certificado`, `empresa`, `formato_formacion`, `tarifa_empresa`, `factura`, `pago`, `grupo_cartera`. *(Resuelve INC-001, RN-AUD-001, RN-AUD-004)*

```sql
CREATE TYPE public.tipo_entidad_audit AS ENUM (
  'persona', 'matricula', 'curso', 'comentario', 'nivel_formacion',
  'personal', 'cargo', 'certificado', 'plantilla_certificado',
  'excepcion_certificado', 'empresa', 'formato_formacion',
  'tarifa_empresa', 'factura', 'pago', 'grupo_cartera'
);

CREATE TYPE public.tipo_accion_audit AS ENUM ('crear', 'editar', 'eliminar');

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_tipo tipo_entidad_audit NOT NULL,
  entidad_id UUID NOT NULL,
  accion tipo_accion_audit NOT NULL,
  campos_modificados TEXT[],
  valor_anterior JSONB,
  valor_nuevo JSONB,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nombre TEXT,
  justificacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### T-003 — Unificación de Métodos de Pago *(Resuelve INC-009)*

Un único ENUM compartido entre Cartera y Matrículas:

```sql
CREATE TYPE public.metodo_pago AS ENUM (
  'transferencia_bancaria', 'efectivo', 'consignacion',
  'nequi', 'daviplata', 'bre_b', 'corresponsal_bancario', 'otro'
);
```

El frontend ya tiene estos 8 valores en `METODO_PAGO_LABELS`. El backend elimina el enum reducido de 4 valores que existía solo en el tipo `MetodoPago` de Cartera (`transferencia`, `efectivo`, `consignacion`, `tarjeta`). *(RN-MAT-003, RN-CAR-004)*

### T-004 — Delegación de Lógica

- **PostgREST:** CRUD estándar para todas las entidades.
- **Triggers SQL:** Validaciones de negocio, recálculos automáticos, snapshots.
- **Funciones SQL (RPC):** Cálculos complejos (dashboard, estados de cartera).
- **Edge Functions:** Operaciones multi-paso (generación de certificados, exportación CSV MinTrabajo, resolución de contexto de formatos, login del portal estudiante).

### T-005 — Integridad Referencial Estricta *(Resuelve INC-005)*

ON DELETE RESTRICT en relaciones críticas:

| Tabla padre | No se puede eliminar si tiene... |
|---|---|
| `personas` | matrículas asociadas |
| `empresas` | matrículas, tarifas o responsables_pago vinculados |
| `cursos` | matrículas asociadas |
| `niveles_formacion` | cursos o formatos vinculados |
| `personal` | asignaciones como entrenador/supervisor en cursos |

### T-006 — Supabase Storage

Buckets a crear:

| Bucket | Público | Contenido |
|---|---|---|
| `firmas` | No | Firmas digitales de personas y personal (PNG) |
| `documentos-matricula` | No | Documentos requeridos por matrícula (PDF, imágenes) |
| `adjuntos-personal` | No | Archivos anexos del staff |
| `facturas` | No | Soportes de factura y comprobantes de pago |
| `certificados` | No | SVG/PDF de certificados generados |

Políticas RLS: Solo usuarios autenticados con rol `admin` o `global` pueden leer/escribir. El portal estudiante tendrá políticas específicas de solo lectura.

### T-007 — Catálogos como ENUMs de PostgreSQL

Valores fijos del sistema implementados como ENUMs (no tablas dinámicas):

```sql
-- RN-PER-002
CREATE TYPE public.tipo_documento_identidad AS ENUM ('CC', 'CE', 'PA', 'PE', 'PP');

-- RN-PER-003
CREATE TYPE public.genero AS ENUM ('M', 'F', 'O');

-- RN-PER-004
CREATE TYPE public.nivel_educativo AS ENUM (
  'analfabeta', 'primaria', 'secundaria', 'bachiller', 'tecnico',
  'tecnologo', 'universitario', 'especializacion', 'maestria', 'doctorado'
);

-- RN-CUR-002
CREATE TYPE public.estado_curso AS ENUM ('abierto', 'en_progreso', 'cerrado');

-- RN-CUR-003 (Resuelve INC-007: elimina `| string`)
CREATE TYPE public.tipo_formacion AS ENUM (
  'jefe_area', 'trabajador_autorizado', 'reentrenamiento', 'coordinador_ta'
);

-- RN-MAT-001
CREATE TYPE public.estado_matricula AS ENUM (
  'creada', 'pendiente', 'completa', 'certificada', 'cerrada'
);

-- RN-MAT-002
CREATE TYPE public.tipo_vinculacion AS ENUM ('empresa', 'independiente', 'arl');

-- RN-MAT-012
CREATE TYPE public.tipo_documento_matricula AS ENUM (
  'cedula', 'examen_medico', 'certificado_eps', 'arl',
  'planilla_seguridad_social', 'curso_previo', 'consolidado', 'otro'
);

-- RN-MAT-011
CREATE TYPE public.estado_documento AS ENUM ('pendiente', 'cargado');

-- RN-PNL-001
CREATE TYPE public.tipo_cargo AS ENUM (
  'entrenador', 'supervisor', 'administrativo', 'instructor', 'otro'
);

-- RN-FMT-004
CREATE TYPE public.estado_formato AS ENUM ('borrador', 'activo', 'archivado');

-- RN-FMT-008
CREATE TYPE public.categoria_formato AS ENUM (
  'formacion', 'evaluacion', 'asistencia', 'pta_ats', 'personalizado'
);

-- RN-FMT-001
CREATE TYPE public.motor_render AS ENUM ('bloques', 'plantilla_html');

-- RN-FMT-009
CREATE TYPE public.asignacion_scope AS ENUM ('nivel_formacion', 'tipo_curso');

-- RN-CAR-002
CREATE TYPE public.estado_grupo_cartera AS ENUM (
  'sin_facturar', 'facturado', 'abonado', 'pagado', 'vencido'
);

-- RN-CAR-003
CREATE TYPE public.estado_factura AS ENUM ('por_pagar', 'parcial', 'pagada');

-- RN-CAR-001
CREATE TYPE public.tipo_responsable AS ENUM ('empresa', 'independiente', 'arl');

-- RN-CAR-016
CREATE TYPE public.tipo_actividad_cartera AS ENUM (
  'llamada', 'promesa_pago', 'comentario', 'sistema'
);

-- RN-CER-001
CREATE TYPE public.estado_certificado AS ENUM (
  'elegible', 'generado', 'bloqueado', 'revocado'
);

-- RN-POR-001
CREATE TYPE public.tipo_doc_portal AS ENUM (
  'firma_autorizacion', 'evaluacion', 'formulario', 'solo_lectura'
);

-- RN-POR-002
CREATE TYPE public.estado_doc_portal AS ENUM ('bloqueado', 'pendiente', 'completado');

-- RN-COM-001
CREATE TYPE public.seccion_comentario AS ENUM (
  'cartera', 'observaciones', 'curso_observaciones'
);

-- RN-FMT-033
CREATE TYPE public.estado_formato_respuesta AS ENUM (
  'pendiente', 'completado', 'firmado'
);

-- RN-CER-005
CREATE TYPE public.estado_excepcion AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- RN-MAT-004
CREATE TYPE public.nivel_previo AS ENUM ('trabajador_autorizado', 'avanzado');
```

### T-008 — Catálogos como datos de referencia (tablas de lookup)

Valores que pueden cambiar con menor frecuencia pero no son ENUMs:

```sql
-- RN-EMP-004: Sectores económicos
-- RN-EMP-005: ARLs
-- Se almacenan como constantes en el frontend (formOptions.ts) y se validan
-- opcionalmente con CHECK constraints o tablas de lookup según necesidad futura.
-- Por ahora, el backend acepta TEXT libre para estos campos.
```

### T-009 — Función de Timestamps Automáticos

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

Se aplica como trigger BEFORE UPDATE en todas las tablas que tienen `updated_at`.

---

## FASE 0 — Autenticación y Administración (COMPLETADA)

**Estado: ✅ COMPLETADA**

### Descripción

Sistema de autenticación real con Email/Password mediante Supabase Auth. Gestión de perfiles de usuario con roles (`global`, `admin`).

### Lo implementado

#### Tabla `perfiles`

```sql
-- YA EXISTE
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY,                        -- = auth.users.id
  email TEXT NOT NULL,
  nombres TEXT,
  rol TEXT NOT NULL DEFAULT 'global',          -- 'global' | 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
```

#### Trigger de auto-creación de perfil

```sql
-- YA EXISTE (función handle_new_user)
-- Trigger: on_auth_user_created → AFTER INSERT ON auth.users
-- Inserta automáticamente en public.perfiles con rol 'global'
```

#### Función `get_my_rol()`

```sql
-- YA EXISTE
CREATE FUNCTION public.get_my_rol() RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT rol FROM public.perfiles WHERE id = auth.uid() $$;
```

#### Políticas RLS en `perfiles`

| Política | Comando | Expresión |
|---|---|---|
| Usuarios leen su propio perfil | SELECT | `id = auth.uid() OR get_my_rol() = 'admin'` |
| Insert bloqueado para cliente | INSERT | `false` (solo via trigger) |
| Update bloqueado | UPDATE | `false` |
| Delete bloqueado | DELETE | `false` |

#### Edge Functions

- **`admin-crear-usuario`**: Valida JWT + rol admin, crea usuario en auth.users con metadata. ✅
- **`bootstrap-admin`**: Uso único para crear el primer administrador. ✅

### Reglas cubiertas

Autenticación del sistema principal. AuthGuard (sesión activa), AdminGuard (sesión + rol admin).

---

## FASE 1 — Fundamentos y Entidades Maestras

**Estado: ❌ PENDIENTE**

### 1A. Empresas *(RN-EMP-001 a RN-EMP-013, RN-INT-001 a RN-INT-006)*

#### Schema SQL

```sql
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_empresa TEXT NOT NULL,
  nit TEXT NOT NULL UNIQUE,                     -- RN-EMP-002
  representante_legal TEXT,
  sector_economico TEXT,                        -- RN-EMP-004 (validado en frontend)
  arl TEXT,                                     -- RN-EMP-005 (validado en frontend)
  direccion TEXT,
  telefono_empresa TEXT,
  contactos JSONB DEFAULT '[]'::JSONB,          -- Array de ContactoEmpresa
  -- Campos legacy de contacto (deprecados, mantener por compatibilidad)
  persona_contacto TEXT,
  telefono_contacto TEXT,
  email_contacto TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,          -- RN-EMP-003
  deleted_at TIMESTAMPTZ,                        -- T-001 soft-delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_empresas_nit ON public.empresas(nit);
CREATE INDEX idx_empresas_nombre ON public.empresas USING gin(nombre_empresa gin_trgm_ops);
CREATE INDEX idx_empresas_activo ON public.empresas(activo) WHERE deleted_at IS NULL;
```

#### Validaciones

- **RN-EMP-002:** UNIQUE constraint en `nit`. El servicio devuelve error `NIT_DUPLICADO` si se viola.
- **RN-EMP-003:** Campo `activo` default `true`. Filtrar en autocomplete de matrículas con `WHERE activo = true AND deleted_at IS NULL`. *(Resuelve INC-010)*
- **RN-EMP-013:** ON DELETE RESTRICT no implementado directamente; se usa soft-delete + verificación en trigger:

```sql
CREATE OR REPLACE FUNCTION public.check_empresa_references()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.matriculas WHERE empresa_id = OLD.id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'No se puede eliminar empresa con matrículas asociadas';
  END IF;
  IF EXISTS (SELECT 1 FROM public.tarifas_empresa WHERE empresa_id = OLD.id) THEN
    RAISE EXCEPTION 'No se puede eliminar empresa con tarifas asociadas';
  END IF;
  IF EXISTS (SELECT 1 FROM public.responsables_pago WHERE empresa_id = OLD.id) THEN
    RAISE EXCEPTION 'No se puede eliminar empresa con responsables de pago asociados';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger: BEFORE UPDATE (SET deleted_at) ON empresas
```

#### Vista de Estudiantes Enviados *(RN-EMP-011, RN-EMP-012)*

```sql
CREATE OR REPLACE FUNCTION public.get_empresa_estudiantes_count(p_empresa_id UUID)
RETURNS INTEGER
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(DISTINCT persona_id)::INTEGER
  FROM public.matriculas
  WHERE empresa_id = p_empresa_id AND deleted_at IS NULL
$$;
```

#### RLS

```sql
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Lectura: usuarios autenticados
CREATE POLICY "Empresas visibles para autenticados"
  ON public.empresas FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- Escritura: solo admin o global
CREATE POLICY "Gestión de empresas"
  ON public.empresas FOR ALL TO authenticated
  USING (get_my_rol() IN ('admin', 'global'))
  WITH CHECK (get_my_rol() IN ('admin', 'global'));
```

---

### 1B. Tarifas Empresa *(RN-EMP-007 a RN-EMP-009, resuelve INC-006)*

```sql
CREATE TABLE public.tarifas_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
  nivel_formacion_id UUID NOT NULL REFERENCES public.niveles_formacion(id) ON DELETE RESTRICT,
  nivel_formacion_nombre TEXT,                -- Desnormalizado para display rápido
  valor NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, nivel_formacion_id)      -- RN-EMP-009, resuelve INC-006
);
```

> **Nota sobre RN-EMP-007:** La regla dice `curso_id` pero el modelo TypeScript (`TarifaEmpresa`) usa `nivelFormacionId`. Se adopta `nivel_formacion_id` como FK real ya que las tarifas son por nivel de formación, no por curso individual. El campo `nivel_formacion_nombre` se desnormaliza para display.

---

### 1C. Personal *(RN-PNL-001 a RN-PNL-006)*

#### Cargos

```sql
CREATE TABLE public.cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,                        -- RN-PNL-002 (nombre personalizable)
  tipo tipo_cargo NOT NULL,                    -- RN-PNL-001 (ENUM de 5 valores)
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Personal (Staff)

```sql
CREATE TABLE public.personal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  cargo_id UUID REFERENCES public.cargos(id) ON DELETE RESTRICT,
  firma TEXT,                                   -- Base64 o storage path
  firma_fecha TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Adjuntos del Personal *(RN-PNL-004)*

```sql
CREATE TABLE public.personal_adjuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  personal_id UUID NOT NULL REFERENCES public.personal(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo_mime TEXT NOT NULL,
  tamano INTEGER,                              -- bytes
  fecha_carga TIMESTAMPTZ NOT NULL DEFAULT now(),
  storage_path TEXT NOT NULL                    -- Path en bucket 'adjuntos-personal'
);
```

#### Validaciones de asignación a cursos *(RN-PNL-005, RN-PNL-006)*

```sql
CREATE OR REPLACE FUNCTION public.validar_asignacion_personal_curso()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo_cargo tipo_cargo;
BEGIN
  -- Validar entrenador
  IF NEW.entrenador_id IS NOT NULL THEN
    SELECT c.tipo INTO v_tipo_cargo
    FROM public.personal p JOIN public.cargos c ON p.cargo_id = c.id
    WHERE p.id = NEW.entrenador_id;
    
    IF v_tipo_cargo NOT IN ('entrenador', 'instructor') THEN
      RAISE EXCEPTION 'El entrenador debe tener cargo tipo entrenador o instructor (RN-PNL-005)';
    END IF;
  END IF;

  -- Validar supervisor
  IF NEW.supervisor_id IS NOT NULL THEN
    SELECT c.tipo INTO v_tipo_cargo
    FROM public.personal p JOIN public.cargos c ON p.cargo_id = c.id
    WHERE p.id = NEW.supervisor_id;
    
    IF v_tipo_cargo != 'supervisor' THEN
      RAISE EXCEPTION 'El supervisor debe tener cargo tipo supervisor (RN-PNL-006)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger: BEFORE INSERT OR UPDATE ON cursos
```

---

### 1D. Niveles de Formación *(RN-NF-001 a RN-NF-006)*

```sql
CREATE TABLE public.niveles_formacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_formacion tipo_formacion NOT NULL,       -- RN-CUR-003, ENUM estricto
  duracion_horas INTEGER NOT NULL,
  duracion_dias INTEGER NOT NULL,
  documentos_requeridos TEXT[] NOT NULL DEFAULT '{}',  -- RN-NF-002: array de DocumentoReqKey
  campos_adicionales JSONB DEFAULT '[]'::JSONB,        -- RN-NF-003: schema detallado abajo
  config_codigo_estudiante JSONB,                      -- RN-NF-005, RN-NF-006
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Schema de `campos_adicionales` (JSONB) — *(RN-NF-003, RN-NF-004)*

```json
[
  {
    "id": "uuid",
    "nombre": "string",
    "tipo": "texto_corto | texto_largo | numerico | select | select_multiple | estado | fecha | fecha_hora | booleano | archivo | url | telefono | email",
    "requerido": true,
    "opciones": ["opción1", "opción2"],
    "alcance": "solo_nivel | todos_los_niveles",
    "orden": 1
  }
]
```

Los 12 tipos soportados: `texto_corto`, `texto_largo`, `numerico`, `select`, `select_multiple`, `estado`, `fecha`, `fecha_hora`, `booleano`, `archivo`, `url`, `telefono`, `email`.

#### Schema de `config_codigo_estudiante` (JSONB) — *(RN-NF-005, RN-NF-006)*

```json
{
  "activo": true,
  "prefijo": "FIH",
  "codigoTipoFormacion": "R",
  "separador": "-",
  "longitudConsecutivo": 4,
  "incluirAnio": true,
  "incluirMes": true,
  "incluirConsecutivoCurso": true
}
```

Formato resultante: `FIH-R-2026-04-01-0001` *(RN-NF-006)*

#### Documentos requeridos — catálogo fijo *(RN-NF-002)*

Valores permitidos en `documentos_requeridos[]`: `cedula`, `examen_medico`, `certificado_eps`, `arl`, `planilla_seguridad_social`, `curso_previo`. Estos coinciden con el ENUM `tipo_documento_matricula` (excluyendo `consolidado` y `otro` que son adicionales).

---

## FASE 2 — Gestión Académica Core

**Estado: ❌ PENDIENTE**

### 2A. Personas *(RN-PER-001 a RN-PER-009)*

```sql
CREATE TABLE public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_documento tipo_documento_identidad NOT NULL,    -- RN-PER-002
  numero_documento TEXT NOT NULL UNIQUE,                -- RN-PER-001
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  genero genero NOT NULL,                              -- RN-PER-003 (incluye 'O')
  pais_nacimiento TEXT DEFAULT 'CO',
  fecha_nacimiento DATE,
  rh TEXT,
  nivel_educativo nivel_educativo,                     -- RN-PER-004
  email TEXT,
  telefono TEXT,
  contacto_emergencia JSONB NOT NULL DEFAULT '{}'::JSONB,  -- RN-PER-005
  firma TEXT,                                          -- RN-PER-006 (Base64 o storage path)
  firma_fecha TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_personas_documento ON public.personas(numero_documento);
CREATE INDEX idx_personas_nombres ON public.personas USING gin(
  (nombres || ' ' || apellidos) gin_trgm_ops
);
```

> **RN-PER-007:** Datos de dirección, seguridad social, área de trabajo y sector económico NO van en la tabla `personas`. Se capturan exclusivamente en `matriculas`.

#### Validación de contacto de emergencia *(RN-PER-005, resuelve INC-004)*

```sql
CREATE OR REPLACE FUNCTION public.validar_contacto_emergencia()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contacto_emergencia IS NULL
     OR NEW.contacto_emergencia->>'nombre' IS NULL
     OR trim(NEW.contacto_emergencia->>'nombre') = ''
     OR NEW.contacto_emergencia->>'telefono' IS NULL
     OR trim(NEW.contacto_emergencia->>'telefono') = '' THEN
    RAISE EXCEPTION 'Contacto de emergencia requiere nombre y teléfono (RN-PER-005)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validar_contacto_emergencia
  BEFORE INSERT OR UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.validar_contacto_emergencia();
```

#### Integridad referencial *(RN-PER-009)*

No se permite eliminar (soft-delete) una persona si tiene matrículas activas:

```sql
CREATE OR REPLACE FUNCTION public.check_persona_references()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    IF EXISTS (SELECT 1 FROM public.matriculas WHERE persona_id = OLD.id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'No se puede eliminar persona con matrículas activas';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

---

### 2B. Cursos *(RN-CUR-001 a RN-CUR-011)*

```sql
CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,                                -- RN-CUR-004: autogenerado
  tipo_formacion tipo_formacion NOT NULL,               -- RN-CUR-003 ENUM estricto
  nivel_formacion_id UUID REFERENCES public.niveles_formacion(id) ON DELETE RESTRICT,
  numero_curso TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  duracion_dias INTEGER,
  duracion_horas INTEGER,
  entrenador_id UUID REFERENCES public.personal(id),   -- RN-PNL-005: obligatorio
  supervisor_id UUID REFERENCES public.personal(id),   -- RN-PNL-006: opcional
  capacidad_maxima INTEGER DEFAULT 30,                 -- RN-CUR-001
  estado estado_curso NOT NULL DEFAULT 'abierto',      -- RN-CUR-002
  -- Campos MinTrabajo (RN-CUR-005)
  mintrabajo_registro TEXT,
  mintrabajo_responsable TEXT,
  mintrabajo_fecha_cierre DATE,
  -- Campos adicionales (RN-CUR-009)
  campos_adicionales_valores JSONB DEFAULT '{}'::JSONB,
  observaciones TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Autogeneración de nombre *(RN-CUR-004)*

```sql
CREATE OR REPLACE FUNCTION public.autogenerar_nombre_curso()
RETURNS TRIGGER AS $$
DECLARE
  v_label TEXT;
BEGIN
  v_label := CASE NEW.tipo_formacion
    WHEN 'jefe_area' THEN 'Jefe de Área'
    WHEN 'trabajador_autorizado' THEN 'Trabajador Autorizado'
    WHEN 'reentrenamiento' THEN 'Reentrenamiento'
    WHEN 'coordinador_ta' THEN 'Coordinador T.A.'
  END;
  NEW.nombre := v_label || ' - #' || NEW.numero_curso;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_autogenerar_nombre_curso
  BEFORE INSERT OR UPDATE OF tipo_formacion, numero_curso ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.autogenerar_nombre_curso();
```

#### Validación de asignación de personal

El trigger `validar_asignacion_personal_curso()` (definido en Fase 1C) se aplica:

```sql
CREATE TRIGGER trg_validar_personal_curso
  BEFORE INSERT OR UPDATE OF entrenador_id, supervisor_id ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.validar_asignacion_personal_curso();
```

#### Fechas adicionales MinTrabajo *(RN-CUR-006)*

```sql
CREATE TABLE public.cursos_fechas_mintrabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  motivo TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Edge Function: `exportar-csv-mintrabajo` *(RN-CUR-007)*

Consolida datos de cursos cerrados en CSV con 15 columnas:

| # | Columna | Fuente |
|---|---|---|
| 1 | Tipo Documento | persona.tipo_documento |
| 2 | Número Documento | persona.numero_documento |
| 3 | Nombres | persona.nombres |
| 4 | Apellidos | persona.apellidos |
| 5 | Fecha Nacimiento | persona.fecha_nacimiento |
| 6 | Género | persona.genero |
| 7 | Nivel Educativo | persona.nivel_educativo |
| 8 | Teléfono | persona.telefono |
| 9 | Email | persona.email |
| 10 | Empresa | matricula.empresa_nombre |
| 11 | Cargo | matricula.empresa_cargo |
| 12 | Tipo Formación | curso.tipo_formacion (label) |
| 13 | Fecha Inicio | curso.fecha_inicio |
| 14 | Fecha Fin | curso.fecha_fin |
| 15 | ARL | matricula.arl (resuelto contra catálogo ARL_OPTIONS) |

#### Acciones masivas *(RN-CUR-010)*

- **Generar certificados masivos:** Edge Function `generar-certificados-masivo` que itera sobre matrículas seleccionadas.
- **Eliminar estudiantes del curso:** RPC `eliminar_matriculas_de_curso(curso_id, matricula_ids[])`.

---

## FASE 3 — Transaccionalidad y Formularios (Matrículas)

**Estado: ❌ PENDIENTE**

### 3A. Matrículas *(RN-MAT-001 a RN-MAT-022)*

#### Schema SQL completo

```sql
CREATE TABLE public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE RESTRICT,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE RESTRICT,  -- RN-MAT-005: NULLABLE
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT,
  estado estado_matricula NOT NULL DEFAULT 'creada',               -- RN-MAT-001

  -- Fechas (autocompletadas desde curso)
  fecha_inicio DATE,
  fecha_fin DATE,

  -- Historial de formación previa (RN-MAT-004)
  nivel_previo nivel_previo,
  centro_formacion_previo TEXT,
  fecha_certificacion_previa DATE,

  -- Vinculación laboral — SNAPSHOT (RN-MAT-006, RN-MAT-007)
  tipo_vinculacion tipo_vinculacion,                               -- RN-MAT-002
  empresa_nombre TEXT,
  empresa_nit TEXT,
  empresa_representante_legal TEXT,
  empresa_cargo TEXT,
  empresa_nivel_formacion TEXT,
  empresa_contacto_nombre TEXT,
  empresa_contacto_telefono TEXT,
  area_trabajo TEXT,
  sector_economico TEXT,
  sector_economico_otro TEXT,
  eps TEXT,
  eps_otra TEXT,
  arl TEXT,
  arl_otra TEXT,

  -- Consentimiento de salud (RN-MAT-009)
  consentimiento_salud BOOLEAN NOT NULL DEFAULT false,
  restriccion_medica BOOLEAN NOT NULL DEFAULT false,
  restriccion_medica_detalle TEXT,
  alergias BOOLEAN NOT NULL DEFAULT false,
  alergias_detalle TEXT,
  consumo_medicamentos BOOLEAN NOT NULL DEFAULT false,
  consumo_medicamentos_detalle TEXT,
  embarazo BOOLEAN,
  nivel_lectoescritura BOOLEAN NOT NULL DEFAULT true,

  -- Autorización de datos (RN-MAT-010)
  autorizacion_datos BOOLEAN NOT NULL DEFAULT false,

  -- Firma
  firma_capturada BOOLEAN NOT NULL DEFAULT false,
  firma_base64 TEXT,

  -- Evaluaciones (RN-MAT-014, RN-MAT-015)
  evaluacion_completada BOOLEAN NOT NULL DEFAULT false,
  evaluacion_puntaje NUMERIC(5,2),
  encuesta_completada BOOLEAN NOT NULL DEFAULT false,
  autoevaluacion_respuestas JSONB,                -- string[]
  evaluacion_competencias_respuestas JSONB,       -- string[]
  evaluacion_respuestas JSONB,                    -- number[] (15 preguntas, umbral 70%)
  encuesta_respuestas JSONB,                      -- string[] (5 elementos)

  -- Cartera en matrícula (RN-MAT-016, RN-MAT-017, RN-MAT-018)
  cobro_contacto_nombre TEXT,
  cobro_contacto_celular TEXT,
  valor_cupo NUMERIC(12,2) DEFAULT 0,
  abono NUMERIC(12,2) DEFAULT 0,
  fecha_facturacion DATE,
  cta_fact_numero TEXT,
  cta_fact_titular TEXT,
  fecha_pago DATE,
  forma_pago metodo_pago,                        -- T-003: ENUM unificado
  pagado BOOLEAN NOT NULL DEFAULT false,          -- RN-MAT-018: calculado
  factura_numero TEXT,                            -- Legacy

  -- Certificado (RN-MAT-019)
  fecha_generacion_certificado TIMESTAMPTZ,
  fecha_entrega_certificado DATE,

  -- Portal estudiante (RN-MAT-020)
  portal_estudiante JSONB,                        -- PortalEstudianteData

  observaciones TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matriculas_persona ON public.matriculas(persona_id);
CREATE INDEX idx_matriculas_curso ON public.matriculas(curso_id);
CREATE INDEX idx_matriculas_empresa ON public.matriculas(empresa_id);
CREATE INDEX idx_matriculas_estado ON public.matriculas(estado);
```

#### Trigger: Snapshot de empresa *(RN-MAT-007, RN-INT-001)*

```sql
CREATE OR REPLACE FUNCTION public.snapshot_empresa_matricula()
RETURNS TRIGGER AS $$
DECLARE
  v_empresa RECORD;
BEGIN
  IF NEW.empresa_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.empresa_id != OLD.empresa_id) THEN
    SELECT nombre_empresa, nit, representante_legal
    INTO v_empresa
    FROM public.empresas WHERE id = NEW.empresa_id;

    NEW.empresa_nombre := v_empresa.nombre_empresa;
    NEW.empresa_nit := v_empresa.nit;
    NEW.empresa_representante_legal := v_empresa.representante_legal;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_snapshot_empresa
  BEFORE INSERT OR UPDATE OF empresa_id ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_empresa_matricula();
```

#### Trigger: Auto-completar fechas desde curso

```sql
CREATE OR REPLACE FUNCTION public.sync_fechas_curso_matricula()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.curso_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.curso_id != COALESCE(OLD.curso_id, '00000000-0000-0000-0000-000000000000'::UUID)) THEN
    SELECT fecha_inicio, fecha_fin INTO NEW.fecha_inicio, NEW.fecha_fin
    FROM public.cursos WHERE id = NEW.curso_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

#### Trigger: Cálculo automático de `pagado` *(RN-MAT-018)*

```sql
CREATE OR REPLACE FUNCTION public.calcular_pagado_matricula()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valor_cupo IS NOT NULL AND NEW.valor_cupo > 0 THEN
    NEW.pagado := (COALESCE(NEW.abono, 0) >= NEW.valor_cupo);
  ELSE
    NEW.pagado := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

#### Auto-inicialización del portal estudiante *(RN-MAT-021)*

Se implementa como parte de una Edge Function `init-portal-estudiante` o trigger que:
1. Al INSERT con `curso_id IS NOT NULL`, inicializa `portal_estudiante` con la estructura base.
2. Al UPDATE de `curso_id` (de NULL a valor), también inicializa.

#### Auto-asignación a cartera *(RN-MAT-022, RN-CAR-008 a RN-CAR-010)*

Edge Function `asignar-matricula-cartera` que:
1. Busca `responsables_pago` por NIT (empresa) o documento (independiente).
2. Si no existe, crea el responsable con datos snapshot.
3. Busca `grupos_cartera` del responsable.
4. Si no existe grupo o el grupo existente ya fue facturado, crea uno nuevo.
5. Agrega la matrícula al grupo e incrementa `total_valor`.

---

### 3B. Documentos de Matrícula *(RN-MAT-011 a RN-MAT-013)*

```sql
CREATE TABLE public.documentos_matricula (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  tipo tipo_documento_matricula NOT NULL,              -- RN-MAT-012: ENUM 8 valores
  nombre TEXT NOT NULL,
  estado estado_documento NOT NULL DEFAULT 'pendiente', -- RN-MAT-011
  storage_path TEXT,                                   -- Path en bucket 'documentos-matricula'
  fecha_carga TIMESTAMPTZ,
  fecha_documento DATE,
  fecha_inicio_cobertura DATE,
  opcional BOOLEAN NOT NULL DEFAULT false,
  archivo_nombre TEXT,
  archivo_tamano INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Sincronización con nivel de formación *(RN-MAT-013, RN-INT-017)*

Edge Function `sync-matricula-documentos`:
1. Consulta el `nivel_formacion_id` del curso de la matrícula.
2. Obtiene `documentos_requeridos[]` del nivel.
3. Para cada documento requerido, verifica si ya existe en `documentos_matricula`.
4. Inserta los faltantes con estado `pendiente` sin alterar los ya cargados.

---

### 3C. Motor de Formatos de Formación *(RN-FMT-001 a RN-FMT-033)*

#### Tabla principal

```sql
CREATE TABLE public.formatos_formacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT,
  categoria categoria_formato NOT NULL DEFAULT 'personalizado',  -- RN-FMT-008
  motor motor_render NOT NULL DEFAULT 'plantilla_html',          -- RN-FMT-001
  estado estado_formato NOT NULL DEFAULT 'borrador',             -- RN-FMT-004
  visible_en_matricula BOOLEAN NOT NULL DEFAULT true,            -- RN-FMT-005
  
  -- Asignación (RN-FMT-009)
  asignacion_scope asignacion_scope NOT NULL DEFAULT 'tipo_curso',
  niveles_asignados UUID[],                    -- IDs de niveles (cuando scope = 'nivel_formacion')
  tipos_curso_asignados tipo_formacion[],      -- Keys de tipo (cuando scope = 'tipo_curso')
  
  -- Motor plantilla_html (RN-FMT-013)
  html_template TEXT,
  css_template TEXT,
  
  -- Motor bloques legacy (RN-FMT-028)
  bloques JSONB,                               -- Array de bloques con sus configuraciones
  legacy_component_id TEXT,                    -- RN-FMT-003: 'info_aprendiz', etc.
  
  -- Encabezado (RN-FMT-025)
  encabezado_config JSONB,                     -- {logo, nombreCentro, codigo, version, etc.}
  
  -- Firmas requeridas (RN-FMT-026)
  requiere_firma_aprendiz BOOLEAN DEFAULT false,
  requiere_firma_entrenador BOOLEAN DEFAULT false,
  requiere_firma_supervisor BOOLEAN DEFAULT false,
  
  -- Plantilla base (RN-FMT-023, RN-FMT-024)
  plantilla_base_id TEXT,
  
  deleted_at TIMESTAMPTZ,                      -- RN-FMT-006: archivar = soft delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Formatos legacy *(RN-FMT-003)*

Los 4 formatos legacy se identifican por `legacy_component_id`:

| `legacy_component_id` | Formato | Componente React |
|---|---|---|
| `info_aprendiz` | Información del Aprendiz | `InfoAprendizDocument` |
| `registro_asistencia` | Registro de Asistencia | `RegistroAsistenciaDocument` |
| `participacion_pta_ats` | Participación PTA-ATS | `ParticipacionPtaAtsDocument` |
| `evaluacion_reentrenamiento` | Evaluación Reentrenamiento | `EvaluacionReentrenamientoDocument` |

Estos se renderizan con componentes hardcodeados. Solo se mantienen por compatibilidad *(RN-FMT-002)*.

#### Mapeo nivel → tipo para filtrado *(RN-FMT-010)*

```sql
-- Función SQL que resuelve los formatos visibles para una matrícula
CREATE OR REPLACE FUNCTION public.get_formatos_for_matricula(
  p_matricula_id UUID
) RETURNS SETOF public.formatos_formacion
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tipo_formacion tipo_formacion;
  v_nivel_id UUID;
BEGIN
  -- Obtener tipo de formación del curso o fallback a empresaNivelFormacion (RN-FMT-011)
  SELECT c.tipo_formacion, c.nivel_formacion_id
  INTO v_tipo_formacion, v_nivel_id
  FROM public.matriculas m
  LEFT JOIN public.cursos c ON m.curso_id = c.id
  WHERE m.id = p_matricula_id;

  IF v_tipo_formacion IS NULL THEN
    -- Fallback: usar empresa_nivel_formacion de la matrícula
    SELECT m.empresa_nivel_formacion::tipo_formacion
    INTO v_tipo_formacion
    FROM public.matriculas m WHERE m.id = p_matricula_id;
  END IF;

  RETURN QUERY
  SELECT f.*
  FROM public.formatos_formacion f
  WHERE f.estado = 'activo'
    AND f.visible_en_matricula = true
    AND f.deleted_at IS NULL
    AND (
      (f.asignacion_scope = 'tipo_curso' AND v_tipo_formacion = ANY(f.tipos_curso_asignados))
      OR
      (f.asignacion_scope = 'nivel_formacion' AND v_nivel_id = ANY(f.niveles_asignados))
    );
END;
$$;
```

#### Versionado *(RN-FMT-020 a RN-FMT-022)*

```sql
CREATE TABLE public.versiones_formato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formato_id UUID NOT NULL REFERENCES public.formatos_formacion(id) ON DELETE CASCADE,
  html_snapshot TEXT,
  css_snapshot TEXT,
  creador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- **RN-FMT-021:** Guardar versión = INSERT con snapshot del HTML/CSS actual.
- **RN-FMT-022:** Restaurar versión = UPDATE del formato con HTML/CSS de la versión seleccionada.

#### Respuestas de formato *(RN-FMT-033)*

```sql
CREATE TABLE public.formato_respuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  formato_id UUID NOT NULL REFERENCES public.formatos_formacion(id) ON DELETE RESTRICT,
  estado estado_formato_respuesta NOT NULL DEFAULT 'pendiente',
  respuestas JSONB,
  firma_base64 TEXT,
  firma_fecha TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(matricula_id, formato_id)
);
```

#### Edge Function: `resolve-formato-context` *(RN-FMT-015, RN-FMT-017)*

Resuelve los 36 tokens del catálogo contra el contexto de la matrícula:

**Input:** `{ matriculaId: UUID }`

**Proceso:**
1. Consulta matrícula + persona + curso + entrenador + supervisor.
2. Construye diccionario `{ "persona.nombreCompleto": "Juan Pérez", ... }`.
3. Devuelve diccionario para renderizado en frontend.

**Categorías de tokens (RN-FMT-014):**

| Categoría | Tokens | Ejemplo |
|---|---|---|
| Persona (13) | nombreCompleto, documento, genero, fechaNacimiento, rh, email, telefono, nivelEducativo, paisNacimiento, nombres, apellidos, tipoDocumento, contactoEmergencia | `{{persona.nombreCompleto}}` |
| Empresa (10) | nombre, nit, representanteLegal, cargo, contactoNombre, contactoTelefono, areaTrabajo, sectorEconomico, eps, arl | `{{empresa.nit}}` |
| Curso (7) | nombre, tipoFormacion, fechaInicio, fechaFin, duracionHoras, duracionDias, numeroCurso | `{{curso.nombre}}` |
| Personal (4) | entrenadorNombre, entrenadorFirma, supervisorNombre, supervisorFirma | `{{personal.entrenadorNombre}}` |
| Matrícula (2) | codigoEstudiante, nivelPrevio | `{{matricula.codigoEstudiante}}` |
| Sistema (1) | fechaActual | `{{sistema.fechaActual}}` |

**RN-FMT-016:** Tokens no resueltos se muestran con badge amarillo en vista previa.

#### Duplicación de formatos *(RN-FMT-027)*

RPC `duplicar_formato(formato_id UUID)`:
1. Copia todos los campos del formato.
2. Nombre = `'Copia de ' || nombre_original`.
3. Estado = `borrador`.
4. Genera nuevo UUID.
5. No copia versiones ni respuestas.

#### Motor de bloques legacy *(RN-FMT-028 a RN-FMT-032)*

Los 18 tipos de bloque se almacenan en el campo `bloques` JSONB:

| Tipo | Descripción |
|---|---|
| `heading` | Encabezado de sección |
| `paragraph` | Párrafo de texto |
| `text` | Campo de texto editable |
| `date` | Campo de fecha |
| `number` | Campo numérico |
| `radio` | Selección única |
| `select` | Desplegable |
| `checkbox` | Casillas de verificación |
| `auto_field` | Campo auto-resuelto (36 campos) *(RN-FMT-029)* |
| `attendance_by_day` | Registro de asistencia por día |
| `signature_aprendiz` | Firma del aprendiz |
| `signature_entrenador_auto` | Firma del entrenador (auto) |
| `signature_supervisor_auto` | Firma del supervisor (auto) |
| `health_consent` | Consentimiento de salud *(RN-FMT-031)* |
| `data_authorization` | Autorización de datos |
| `evaluation_quiz` | Evaluación con umbral *(RN-FMT-030, umbral 70%)* |
| `satisfaction_survey` | Encuesta de satisfacción *(RN-FMT-032)* |
| `section_title` | Título de sección |

---

## FASE 4 — Gestión Financiera y Certificación

**Estado: ❌ PENDIENTE**

### 4A. Módulo de Cartera *(RN-CAR-001 a RN-CAR-019)*

#### Responsables de pago *(RN-CAR-005 a RN-CAR-007)*

```sql
CREATE TABLE public.responsables_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_responsable NOT NULL,                      -- RN-CAR-001
  nombre TEXT NOT NULL,
  nit TEXT,
  empresa_id UUID REFERENCES public.empresas(id),      -- RN-INT-004: FK opcional
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  contacto_email TEXT,
  direccion_facturacion TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **RN-CAR-006:** Datos desnormalizados como snapshot. No se actualizan si la empresa cambia *(RN-INT-005)*.  
> **RN-CAR-007:** Pueden existir responsables sin empresa en el directorio.

#### Grupos de cartera

```sql
CREATE TABLE public.grupos_cartera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  responsable_pago_id UUID NOT NULL REFERENCES public.responsables_pago(id) ON DELETE RESTRICT,
  estado estado_grupo_cartera NOT NULL DEFAULT 'sin_facturar',  -- RN-CAR-002
  total_valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_abonos NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo NUMERIC(12,2) NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de vinculación matriculas ↔ grupos
CREATE TABLE public.grupo_cartera_matriculas (
  grupo_cartera_id UUID NOT NULL REFERENCES public.grupos_cartera(id) ON DELETE CASCADE,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE RESTRICT,
  PRIMARY KEY (grupo_cartera_id, matricula_id)
);
```

#### Facturas *(RN-CAR-013 a RN-CAR-015)*

```sql
CREATE TABLE public.facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_cartera_id UUID NOT NULL REFERENCES public.grupos_cartera(id) ON DELETE RESTRICT,
  numero_factura TEXT NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  total NUMERIC(12,2) NOT NULL,
  estado estado_factura NOT NULL DEFAULT 'por_pagar',  -- RN-CAR-003
  archivo_factura TEXT,                                -- Storage path en bucket 'facturas'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vinculación facturas ↔ matrículas (con valor asignado)
CREATE TABLE public.factura_matriculas (
  factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE RESTRICT,
  valor_asignado NUMERIC(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (factura_id, matricula_id)
);
```

#### Pagos

```sql
CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE, -- RN-CAR-015
  fecha_pago DATE NOT NULL,
  valor_pago NUMERIC(12,2) NOT NULL,
  metodo_pago metodo_pago NOT NULL,                    -- T-003: ENUM unificado
  soporte_pago TEXT,                                   -- Storage path (obligatorio en UI)
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Recálculo automático de estados *(RN-CAR-011, RN-CAR-012)*

```sql
CREATE OR REPLACE FUNCTION public.recalcular_grupo_cartera(p_grupo_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total_valor NUMERIC;
  v_total_abonos NUMERIC;
  v_tiene_facturas BOOLEAN;
  v_tiene_vencidas BOOLEAN;
  v_nuevo_estado estado_grupo_cartera;
BEGIN
  -- Recalcular totales
  SELECT COALESCE(SUM(m.valor_cupo), 0)
  INTO v_total_valor
  FROM public.grupo_cartera_matriculas gcm
  JOIN public.matriculas m ON gcm.matricula_id = m.id
  WHERE gcm.grupo_cartera_id = p_grupo_id;

  SELECT COALESCE(SUM(p.valor_pago), 0)
  INTO v_total_abonos
  FROM public.facturas f
  JOIN public.pagos p ON p.factura_id = f.id
  WHERE f.grupo_cartera_id = p_grupo_id;

  -- Determinar estado (RN-CAR-011)
  SELECT EXISTS(SELECT 1 FROM public.facturas WHERE grupo_cartera_id = p_grupo_id)
  INTO v_tiene_facturas;

  SELECT EXISTS(
    SELECT 1 FROM public.facturas
    WHERE grupo_cartera_id = p_grupo_id
      AND estado != 'pagada'
      AND fecha_vencimiento < CURRENT_DATE
  ) INTO v_tiene_vencidas;

  IF v_total_valor > 0 AND (v_total_valor - v_total_abonos) <= 0 THEN
    v_nuevo_estado := 'pagado';
  ELSIF v_tiene_vencidas THEN
    v_nuevo_estado := 'vencido';
  ELSIF v_total_abonos > 0 THEN
    v_nuevo_estado := 'abonado';
  ELSIF v_tiene_facturas THEN
    v_nuevo_estado := 'facturado';
  ELSE
    v_nuevo_estado := 'sin_facturar';
  END IF;

  UPDATE public.grupos_cartera
  SET total_valor = v_total_valor,
      total_abonos = v_total_abonos,
      saldo = v_total_valor - v_total_abonos,
      estado = v_nuevo_estado,
      updated_at = now()
  WHERE id = p_grupo_id;
END;
$$;
```

#### Recálculo de estado de factura *(RN-CAR-012)*

```sql
CREATE OR REPLACE FUNCTION public.recalcular_estado_factura()
RETURNS TRIGGER AS $$
DECLARE
  v_total_pagado NUMERIC;
  v_total_factura NUMERIC;
  v_grupo_id UUID;
BEGIN
  SELECT f.total, f.grupo_cartera_id INTO v_total_factura, v_grupo_id
  FROM public.facturas f
  WHERE f.id = COALESCE(NEW.factura_id, OLD.factura_id);

  SELECT COALESCE(SUM(valor_pago), 0) INTO v_total_pagado
  FROM public.pagos
  WHERE factura_id = COALESCE(NEW.factura_id, OLD.factura_id);

  UPDATE public.facturas
  SET estado = CASE
    WHEN v_total_pagado >= v_total_factura THEN 'pagada'::estado_factura
    WHEN v_total_pagado > 0 THEN 'parcial'::estado_factura
    ELSE 'por_pagar'::estado_factura
  END,
  updated_at = now()
  WHERE id = COALESCE(NEW.factura_id, OLD.factura_id);

  -- Recalcular grupo
  PERFORM public.recalcular_grupo_cartera(v_grupo_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_recalcular_factura_al_pagar
  AFTER INSERT OR UPDATE OR DELETE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_estado_factura();
```

#### Sincronización bidireccional factura ↔ matrícula *(RN-CAR-013, RN-CAR-014, RN-INT-008)*

```sql
CREATE OR REPLACE FUNCTION public.sync_factura_a_matriculas()
RETURNS TRIGGER AS $$
BEGIN
  -- Sincronizar facturaNumero y fechaFacturacion en matrículas asociadas
  UPDATE public.matriculas m
  SET factura_numero = NEW.numero_factura,
      fecha_facturacion = NEW.fecha_emision,
      updated_at = now()
  FROM public.factura_matriculas fm
  WHERE fm.factura_id = NEW.id AND fm.matricula_id = m.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_sync_factura_matriculas
  AFTER INSERT OR UPDATE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.sync_factura_a_matriculas();
```

#### Eliminar factura cascadea pagos *(RN-CAR-015)*

ON DELETE CASCADE en `pagos.factura_id` ya lo maneja. Adicionalmente:

```sql
CREATE OR REPLACE FUNCTION public.on_delete_factura()
RETURNS TRIGGER AS $$
BEGIN
  -- Limpiar datos de factura en matrículas
  UPDATE public.matriculas m
  SET factura_numero = NULL, fecha_facturacion = NULL, updated_at = now()
  FROM public.factura_matriculas fm
  WHERE fm.factura_id = OLD.id AND fm.matricula_id = m.id;

  -- Recalcular grupo
  PERFORM public.recalcular_grupo_cartera(OLD.grupo_cartera_id);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_on_delete_factura
  BEFORE DELETE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.on_delete_factura();
```

#### Actividades de cartera *(RN-CAR-016 a RN-CAR-018)*

```sql
CREATE TABLE public.actividades_cartera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_cartera_id UUID NOT NULL REFERENCES public.grupos_cartera(id) ON DELETE CASCADE,
  factura_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL,
  tipo tipo_actividad_cartera NOT NULL,                -- RN-CAR-016
  descripcion TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario TEXT
);

CREATE INDEX idx_actividades_grupo ON public.actividades_cartera(grupo_cartera_id, fecha DESC);
-- RN-CAR-018: Ordenadas por fecha descendente
```

**RN-CAR-017:** Las actividades de tipo `sistema` se generan automáticamente mediante triggers en `facturas` y `pagos`:

```sql
CREATE OR REPLACE FUNCTION public.registrar_actividad_sistema_factura()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.actividades_cartera (grupo_cartera_id, factura_id, tipo, descripcion, usuario)
  VALUES (
    NEW.grupo_cartera_id,
    NEW.id,
    'sistema',
    'Factura ' || NEW.numero_factura || ' registrada por $' || NEW.total,
    (SELECT nombres FROM public.perfiles WHERE id = auth.uid())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

---

### 4B. Módulo de Certificación *(RN-CER-001 a RN-CER-006)*

#### Plantillas de certificado *(RN-CER-003)*

```sql
CREATE TABLE public.plantillas_certificado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  tipo_formacion tipo_formacion NOT NULL,
  svg_template TEXT NOT NULL,
  token_mappings JSONB NOT NULL DEFAULT '{}'::JSONB,   -- { "etiqueta_svg_id": "{{token}}" }
  niveles_asignados UUID[],
  -- Reglas de negocio (RN-CER-004)
  reglas JSONB NOT NULL DEFAULT '{}'::JSONB,
  /*  {
        "requierePago": true,
        "requiereDocumentos": true,
        "requiereFormatos": true,
        "incluyeEmpresa": true,
        "incluyeFirmas": true
      }
  */
  version INTEGER NOT NULL DEFAULT 1,
  activa BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historial de versiones de plantilla
CREATE TABLE public.plantilla_certificado_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id UUID NOT NULL REFERENCES public.plantillas_certificado(id) ON DELETE CASCADE,
  svg_snapshot TEXT NOT NULL,
  token_mappings_snapshot JSONB NOT NULL,
  version INTEGER NOT NULL,
  creador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Certificados emitidos *(RN-CER-001, RN-CER-002)*

```sql
CREATE TABLE public.certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE RESTRICT,
  plantilla_id UUID NOT NULL REFERENCES public.plantillas_certificado(id),
  plantilla_version INTEGER NOT NULL,
  codigo_unico TEXT NOT NULL UNIQUE,
  estado estado_certificado NOT NULL DEFAULT 'elegible', -- RN-CER-001
  -- Snapshot inmutable (RN-CER-002)
  datos_snapshot JSONB NOT NULL,                         -- Datos al momento de generación
  svg_renderizado TEXT,                                  -- SVG final con tokens reemplazados
  storage_path TEXT,                                     -- Path en bucket 'certificados'
  -- Revocación (RN-CER-006)
  revocado_por UUID REFERENCES auth.users(id),
  motivo_revocacion TEXT,
  fecha_revocacion TIMESTAMPTZ,
  -- Versión del certificado (reemisión)
  version_certificado INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Excepciones de certificación *(RN-CER-005)*

```sql
CREATE TABLE public.excepciones_certificado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,                                    -- Qué requisito se exceptúa
  motivo TEXT NOT NULL,
  estado estado_excepcion NOT NULL DEFAULT 'pendiente',  -- RN-CER-005
  aprobado_por UUID REFERENCES auth.users(id),
  fecha_resolucion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Edge Function: `generar-certificado` *(RN-CER-004, RN-INT-016)*

**Input:** `{ matriculaId: UUID, plantillaId: UUID }`

**Proceso:**
1. Evalúa reglas del tipo de certificado:
   - ¿Tiene todo pagado? (`matricula.pagado = true` o excepción aprobada)
   - ¿Subió todos los documentos? (documentos requeridos con estado `cargado`)
   - ¿Completó formatos obligatorios?
   - ¿Tiene excepciones aprobadas para lo que falte?
2. Si aprueba:
   - Genera código único con patrón del nivel de formación.
   - Congela snapshot JSON de persona + matrícula + curso + empresa.
   - Renderiza SVG reemplazando tokens con datos del snapshot.
   - Almacena en Storage bucket `certificados`.
   - Actualiza matrícula: `estado = 'certificada'`, `fecha_generacion_certificado = now()`.
   - Inserta certificado con estado `generado`.
3. Si no aprueba:
   - Retorna lista de requisitos faltantes.
   - Certificado queda en estado `bloqueado`.

---

## FASE 5 — Portal del Estudiante y Monitoreo Administrativo

**Estado: ❌ PENDIENTE**

### 5A. Portal Estudiante *(RN-POR-001 a RN-POR-008)*

#### Configuración global del portal

```sql
CREATE TABLE public.portal_config_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,                            -- DocumentoPortalKey
  nombre TEXT NOT NULL,
  tipo tipo_doc_portal NOT NULL,                       -- RN-POR-001
  requiere_firma BOOLEAN NOT NULL DEFAULT false,
  depende_de TEXT[] DEFAULT '{}',                      -- RN-POR-005: keys de dependencia
  orden INTEGER NOT NULL DEFAULT 0,                    -- RN-POR-006
  habilitado_por_nivel JSONB DEFAULT '{}'::JSONB,      -- RN-POR-007: { "tipo_formacion": true/false }
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

#### Progreso del estudiante en el portal

```sql
CREATE TABLE public.documentos_portal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  documento_key TEXT NOT NULL,
  estado estado_doc_portal NOT NULL DEFAULT 'bloqueado', -- RN-POR-002
  enviado_en TIMESTAMPTZ,
  firma_base64 TEXT,
  firma_fecha TIMESTAMPTZ,
  puntaje NUMERIC(5,2),
  respuestas JSONB,
  metadata JSONB,
  -- Intentos (RN-POR-008)
  intentos JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(matricula_id, documento_key)
);
```

#### RPC: `login_portal_estudiante(cedula)` *(RN-POR-003, RN-POR-004)*

```sql
CREATE OR REPLACE FUNCTION public.login_portal_estudiante(p_cedula TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_matricula RECORD;
  v_persona RECORD;
BEGIN
  -- Buscar matrícula vigente con portal habilitado
  SELECT m.* INTO v_matricula
  FROM public.matriculas m
  JOIN public.cursos c ON m.curso_id = c.id
  JOIN public.personas p ON m.persona_id = p.id
  WHERE p.numero_documento = p_cedula
    AND c.fecha_fin >= CURRENT_DATE           -- Vigencia del curso
    AND (m.portal_estudiante->>'habilitado')::boolean = true
    AND m.deleted_at IS NULL
  ORDER BY c.fecha_fin DESC
  LIMIT 1;

  IF v_matricula IS NULL THEN
    RETURN jsonb_build_object('error', 'No se encontró matrícula vigente con portal habilitado');
  END IF;

  SELECT p.* INTO v_persona
  FROM public.personas p WHERE p.id = v_matricula.persona_id;

  RETURN jsonb_build_object(
    'matriculaId', v_matricula.id,
    'personaId', v_persona.id,
    'nombres', v_persona.nombres,
    'apellidos', v_persona.apellidos,
    'cursoId', v_matricula.curso_id
  );
END;
$$;
```

> **Nota:** En producción, esta función podría emitir un JWT restrictivo via Supabase para que las políticas RLS del portal solo permitan al estudiante ver sus propios datos.

#### Dependencias entre documentos *(RN-POR-005)*

La lógica de desbloqueo se evalúa al consultar los documentos:

```sql
CREATE OR REPLACE FUNCTION public.get_documentos_portal(p_matricula_id UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_docs JSONB;
BEGIN
  -- Obtener documentos con su estado, evaluando dependencias
  SELECT jsonb_agg(doc ORDER BY config.orden)
  INTO v_docs
  FROM public.portal_config_documentos config
  LEFT JOIN public.documentos_portal dp
    ON dp.matricula_id = p_matricula_id AND dp.documento_key = config.key
  CROSS JOIN LATERAL (
    SELECT
      config.key,
      config.nombre,
      config.tipo,
      config.requiere_firma,
      config.orden,
      COALESCE(dp.estado, 
        CASE 
          WHEN config.depende_de = '{}' THEN 'pendiente'
          WHEN (
            SELECT COUNT(*) = array_length(config.depende_de, 1)
            FROM public.documentos_portal dep
            WHERE dep.matricula_id = p_matricula_id
              AND dep.documento_key = ANY(config.depende_de)
              AND dep.estado = 'completado'
          ) THEN 'pendiente'
          ELSE 'bloqueado'
        END
      ) AS estado,
      dp.enviado_en,
      dp.puntaje,
      dp.intentos
  ) doc
  WHERE config.activo = true;

  RETURN COALESCE(v_docs, '[]'::JSONB);
END;
$$;
```

### 5B. Panel de Administración del Portal

Soporta componentes `DocumentosCatalogoTable`, `NivelesHabilitacionGrid`, `MonitoreoTable`, `MonitoreoDetalleDialog`.

Las operaciones CRUD sobre `portal_config_documentos` permiten al administrador:
- Configurar qué documentos ve el estudiante *(RN-POR-007)*
- Establecer dependencias entre documentos *(RN-POR-005)*
- Ordenar documentos *(RN-POR-006)*
- Habilitar/deshabilitar por tipo de formación *(RN-POR-007)*

---

## FASE 6 — Analíticas, Comentarios y Auditoría

**Estado: ❌ PENDIENTE**

### 6A. Comentarios Polimórficos *(RN-COM-001 a RN-COM-003, resuelve INC-008)*

```sql
CREATE TABLE public.comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidad_tipo TEXT NOT NULL,                          -- Reemplaza 'matriculaId' genérico
  entidad_id UUID NOT NULL,                            -- ID de la entidad (matrícula, curso, grupo_cartera)
  seccion seccion_comentario NOT NULL,                 -- RN-COM-001
  texto TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nombre TEXT NOT NULL,
  editado_en TIMESTAMPTZ,                              -- RN-COM-003
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comentarios_entidad ON public.comentarios(entidad_tipo, entidad_id);
```

> **Resuelve INC-008:** El campo `matriculaId` se renombra a `entidad_id` + `entidad_tipo` para ser verdaderamente polimórfico.

### 6B. Dashboard *(Funciones SQL)*

```sql
-- Métricas generales
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'totalPersonas', (SELECT COUNT(*) FROM personas WHERE deleted_at IS NULL),
    'totalMatriculas', (SELECT COUNT(*) FROM matriculas WHERE deleted_at IS NULL),
    'matriculasActivas', (SELECT COUNT(*) FROM matriculas WHERE estado IN ('creada','pendiente','completa') AND deleted_at IS NULL),
    'cursosAbiertos', (SELECT COUNT(*) FROM cursos WHERE estado = 'abierto' AND deleted_at IS NULL),
    'cursosEnProgreso', (SELECT COUNT(*) FROM cursos WHERE estado = 'en_progreso' AND deleted_at IS NULL),
    'certificadosEmitidos', (SELECT COUNT(*) FROM certificados WHERE estado = 'generado'),
    'ingresosMes', (SELECT COALESCE(SUM(valor_pago), 0) FROM pagos WHERE fecha_pago >= date_trunc('month', CURRENT_DATE)),
    'carteraPendiente', (SELECT COALESCE(SUM(saldo), 0) FROM grupos_cartera WHERE estado NOT IN ('pagado'))
  );
END;
$$;

-- Datos para gráficos por período
CREATE OR REPLACE FUNCTION public.get_dashboard_charts_data(p_periodo TEXT DEFAULT 'mes')
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Retorna datos agregados para: matrículas por estado, ingresos por mes,
  -- distribución por tipo de formación, cursos por estado, etc.
  RETURN jsonb_build_object(
    'matriculasPorEstado', (
      SELECT jsonb_object_agg(estado, cnt) FROM (
        SELECT estado, COUNT(*) cnt FROM matriculas WHERE deleted_at IS NULL GROUP BY estado
      ) sub
    ),
    'cursosPorEstado', (
      SELECT jsonb_object_agg(estado, cnt) FROM (
        SELECT estado, COUNT(*) cnt FROM cursos WHERE deleted_at IS NULL GROUP BY estado
      ) sub
    )
  );
END;
$$;
```

### 6C. Auditoría *(RN-AUD-001 a RN-AUD-004)*

La tabla `audit_logs` y los ENUMs se definen en T-002. El trigger genérico se aplica a todas las tablas principales:

```sql
CREATE OR REPLACE FUNCTION public.audit_log_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_action tipo_accion_audit;
  v_entity_type tipo_entidad_audit;
BEGIN
  v_entity_type := TG_ARGV[0]::tipo_entidad_audit;

  IF TG_OP = 'INSERT' THEN
    v_action := 'crear';
    v_new := to_jsonb(NEW);
    INSERT INTO public.audit_logs (entidad_tipo, entidad_id, accion, valor_nuevo, usuario_id)
    VALUES (v_entity_type, NEW.id, v_action, v_new, auth.uid());
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'editar';
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    INSERT INTO public.audit_logs (entidad_tipo, entidad_id, accion, valor_anterior, valor_nuevo, usuario_id)
    VALUES (v_entity_type, NEW.id, v_action, v_old, v_new, auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'eliminar';
    v_old := to_jsonb(OLD);
    INSERT INTO public.audit_logs (entidad_tipo, entidad_id, accion, valor_anterior, usuario_id)
    VALUES (v_entity_type, OLD.id, v_action, v_old, auth.uid());
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ejemplo de aplicación a cada tabla:
-- CREATE TRIGGER audit_personas AFTER INSERT OR UPDATE OR DELETE ON personas
--   FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_fn('persona');
-- CREATE TRIGGER audit_empresas AFTER INSERT OR UPDATE OR DELETE ON empresas
--   FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_fn('empresa');
-- ... (repetir para las 16 entidades)
```

---

## Resolución de Deuda Técnica

Mapeo de cada inconsistencia activa del documento `reglas_de_negocio_validadas_v3.md` a su solución backend:

| ID | Problema | Solución Backend | Fase |
|---|---|---|---|
| **INC-001** | Auditoría incompleta: `TipoEntidad` no incluye 6 entidades | Expandir ENUM `tipo_entidad_audit` a 16 valores (T-002) | F6 |
| **INC-002** | Duplicidad de datos de empresa en matrícula | **Intencional** (snapshot RN-MAT-007). Trigger `snapshot_empresa_matricula()` garantiza coherencia al INSERT/UPDATE | F3 |
| **INC-003** | Datos de cartera duplicados en matrícula | Sincronización bidireccional via triggers `sync_factura_a_matriculas()` y `recalcular_grupo_cartera()` | F4 |
| **INC-004** | Contacto de emergencia sin validación | Trigger `validar_contacto_emergencia()` que verifica nombre y teléfono | F2 |
| **INC-005** | Integridad referencial ausente | ON DELETE RESTRICT en FKs críticas + triggers de verificación antes de soft-delete (T-005) | Transversal |
| **INC-006** | Tarifas sin validación de unicidad | UNIQUE constraint `(empresa_id, nivel_formacion_id)` en `tarifas_empresa` | F1 |
| **INC-007** | `TipoFormacion` como union abierta (`\| string`) | ENUM estricto `tipo_formacion` de 4 valores (T-007) | Transversal |
| **INC-008** | Campo `matriculaId` genérico en comentarios | Renombrar a `entidad_id` + `entidad_tipo` en tabla `comentarios` | F6 |
| **INC-009** | `MetodoPago` divergente (4 vs 8 valores) | ENUM unificado `metodo_pago` con 8 valores (T-003) | Transversal |
| **INC-010** | Empresas inactivas visibles en autocomplete | Query `WHERE activo = true AND deleted_at IS NULL` en búsquedas (F1A) | F1 |

---

## Matriz de Trazabilidad

### Módulo Personas → FASE 2

| Regla | Descripción | Implementación Backend |
|---|---|---|
| RN-PER-001 | Unicidad documento | UNIQUE constraint en `numero_documento` |
| RN-PER-002 | 5 tipos documento | ENUM `tipo_documento_identidad` |
| RN-PER-003 | Género M/F/O | ENUM `genero` |
| RN-PER-004 | 10 niveles educativos | ENUM `nivel_educativo` |
| RN-PER-005 | Contacto emergencia obligatorio | Trigger `validar_contacto_emergencia()` |
| RN-PER-006 | Firma digital | Campos `firma` + `firma_fecha` |
| RN-PER-007 | Dirección no en persona | Solo en tabla `matriculas` |
| RN-PER-008 | Búsqueda multi-campo | Índices GIN trigram |
| RN-PER-009 | Eliminación con integridad | Trigger `check_persona_references()` |

### Módulo Niveles → FASE 1

| Regla | Implementación Backend |
|---|---|
| RN-NF-001 | Tabla `niveles_formacion` con todos los campos |
| RN-NF-002 | Campo `documentos_requeridos TEXT[]` |
| RN-NF-003 | Campo `campos_adicionales JSONB` con schema de 12 tipos |
| RN-NF-004 | Campo `alcance` en schema JSONB |
| RN-NF-005/006 | Campo `config_codigo_estudiante JSONB` |

### Módulo Cursos → FASE 2

| Regla | Implementación Backend |
|---|---|
| RN-CUR-001 | Tabla `cursos` con `capacidad_maxima` |
| RN-CUR-002 | ENUM `estado_curso` |
| RN-CUR-003 | ENUM `tipo_formacion` (4 valores estrictos) |
| RN-CUR-004 | Trigger `autogenerar_nombre_curso()` |
| RN-CUR-005 | Campos MinTrabajo en `cursos` |
| RN-CUR-006 | Tabla `cursos_fechas_mintrabajo` |
| RN-CUR-007 | Edge Function `exportar-csv-mintrabajo` (15 columnas) |
| RN-CUR-008 | Relación `matriculas.curso_id` |
| RN-CUR-009 | Campo `campos_adicionales_valores JSONB` |
| RN-CUR-010 | RPC `eliminar_matriculas_de_curso()` + Edge Function certificados masivos |
| RN-CUR-011 | Frontend (filtro checkboxes en calendario) |

### Módulo Matrículas → FASE 3

| Regla | Implementación Backend |
|---|---|
| RN-MAT-001 | ENUM `estado_matricula` |
| RN-MAT-002 | ENUM `tipo_vinculacion` |
| RN-MAT-003 | ENUM unificado `metodo_pago` |
| RN-MAT-004 | ENUM `nivel_previo` |
| RN-MAT-005 | `curso_id` NULLABLE |
| RN-MAT-006/007 | Trigger `snapshot_empresa_matricula()` |
| RN-MAT-008 | Frontend (autocomplete empresa) |
| RN-MAT-009 | 6 campos booleanos + detalles |
| RN-MAT-010 | Campo `autorizacion_datos` |
| RN-MAT-011/012 | Tabla `documentos_matricula` con ENUMs |
| RN-MAT-013 | Edge Function `sync-matricula-documentos` |
| RN-MAT-014/015 | Campos JSONB de evaluaciones |
| RN-MAT-016/017/018 | Campos de cartera + trigger `calcular_pagado` |
| RN-MAT-019 | Campos de certificado |
| RN-MAT-020/021 | Campo `portal_estudiante JSONB` + auto-init |
| RN-MAT-022 | Edge Function `asignar-matricula-cartera` |

### Módulo Formatos → FASE 3

| Regla | Implementación Backend |
|---|---|
| RN-FMT-001/002 | ENUM `motor_render`, campo `legacy_component_id` |
| RN-FMT-003 | 4 formatos legacy identificados |
| RN-FMT-004/005/006/007 | ENUM `estado_formato` + soft-delete |
| RN-FMT-008 | ENUM `categoria_formato` |
| RN-FMT-009/010/011 | Función `get_formatos_for_matricula()` |
| RN-FMT-012 | Sin snapshot; consulta dinámica |
| RN-FMT-013/014/015/016/017 | Edge Function `resolve-formato-context` |
| RN-FMT-018/019 | Frontend (TipTap editor) |
| RN-FMT-020/021/022 | Tabla `versiones_formato` |
| RN-FMT-023/024 | Campo `plantilla_base_id` |
| RN-FMT-025 | Campo `encabezado_config JSONB` |
| RN-FMT-026 | Campos `requiere_firma_*` |
| RN-FMT-027 | RPC `duplicar_formato()` |
| RN-FMT-028-032 | Campo `bloques JSONB` (18 tipos) |
| RN-FMT-033 | Tabla `formato_respuestas` |

### Módulo Cartera → FASE 4

| Regla | Implementación Backend |
|---|---|
| RN-CAR-001-003 | ENUMs de estados |
| RN-CAR-004 | ENUM unificado `metodo_pago` |
| RN-CAR-005-007 | Tabla `responsables_pago` |
| RN-CAR-008-010 | Edge Function `asignar-matricula-cartera` |
| RN-CAR-011/012 | Función `recalcular_grupo_cartera()` + trigger en pagos |
| RN-CAR-013/014 | Trigger `sync_factura_a_matriculas()` |
| RN-CAR-015 | CASCADE + trigger `on_delete_factura()` |
| RN-CAR-016-018 | Tabla `actividades_cartera` + triggers automáticos |
| RN-CAR-019 | Frontend (enlace a empresa) |

### Módulo Certificación → FASE 4

| Regla | Implementación Backend |
|---|---|
| RN-CER-001 | ENUM `estado_certificado` |
| RN-CER-002 | Campos snapshot + SVG en `certificados` |
| RN-CER-003 | Tabla `plantillas_certificado` + versionado |
| RN-CER-004 | Campo `reglas JSONB` |
| RN-CER-005 | Tabla `excepciones_certificado` |
| RN-CER-006 | Campos de revocación en `certificados` |

### Módulo Portal → FASE 5

| Regla | Implementación Backend |
|---|---|
| RN-POR-001/002 | ENUMs `tipo_doc_portal`, `estado_doc_portal` |
| RN-POR-003/004 | RPC `login_portal_estudiante()` |
| RN-POR-005 | Campo `depende_de TEXT[]` + función de evaluación |
| RN-POR-006 | Campo `orden INTEGER` |
| RN-POR-007 | Campo `habilitado_por_nivel JSONB` |
| RN-POR-008 | Campo `intentos JSONB` |

### Módulo Empresas → FASE 1

| Regla | Implementación Backend |
|---|---|
| RN-EMP-001-003 | Tabla `empresas` con UNIQUE nit + activo |
| RN-EMP-004/005 | Validación en frontend (catálogo fijo) |
| RN-EMP-006 | Índices GIN trigram |
| RN-EMP-007-009 | Tabla `tarifas_empresa` con UNIQUE constraint |
| RN-EMP-010 | Frontend (sidebar) |
| RN-EMP-011/012 | Función `get_empresa_estudiantes_count()` |
| RN-EMP-013 | Trigger `check_empresa_references()` |

### Módulos Personal, Auditoría, Comentarios, Drive

| Regla | Implementación Backend |
|---|---|
| RN-PNL-001-006 | Tablas `cargos`, `personal`, `personal_adjuntos` + triggers |
| RN-AUD-001-004 | Tabla `audit_logs` + trigger genérico (16 entidades) |
| RN-COM-001-003 | Tabla `comentarios` polimórfica |
| RN-DRV-001-003 | Supabase Storage (buckets definidos en T-006) |

### UX y Navegación (Frontend only)

| Regla | Nota |
|---|---|
| RN-UX-001-008 | Implementación exclusiva en frontend. No requiere backend. |

### Integraciones

| Regla | Implementación Backend |
|---|---|
| RN-INT-001-003 | Trigger snapshot empresa + FK empresa_id |
| RN-INT-004-006 | Tabla responsables_pago con empresa_id FK |
| RN-INT-007/008 | Auto-agrupación cartera + sync factura-matrícula |
| RN-INT-009-011 | Función `get_formatos_for_matricula()` |
| RN-INT-012/013 | Edge Function `resolve-formato-context` |
| RN-INT-014/015 | Trigger `validar_asignacion_personal_curso()` |
| RN-INT-016 | Edge Function `generar-certificado` |
| RN-INT-017 | Edge Function `sync-matricula-documentos` |

---

## Resumen de Edge Functions Requeridas

| Edge Function | Fase | Descripción |
|---|---|---|
| `admin-crear-usuario` | F0 ✅ | Crear usuarios del sistema |
| `bootstrap-admin` | F0 ✅ | Inicializar primer admin |
| `exportar-csv-mintrabajo` | F2 | CSV 15 columnas para MinTrabajo |
| `sync-matricula-documentos` | F3 | Sincronizar docs con nivel de formación |
| `asignar-matricula-cartera` | F3/F4 | Auto-agrupar matrícula en cartera |
| `resolve-formato-context` | F3 | Resolver 36 tokens para renderizado |
| `generar-certificado` | F4 | Evaluar reglas y emitir certificado |
| `generar-certificados-masivo` | F4 | Emisión masiva desde tabla de curso |
| `init-portal-estudiante` | F5 | Inicializar documentos del portal |

## Resumen de Funciones SQL (RPC)

| Función | Fase | Tipo |
|---|---|---|
| `get_my_rol()` | F0 ✅ | SECURITY DEFINER |
| `handle_new_user()` | F0 ✅ | Trigger |
| `get_empresa_estudiantes_count()` | F1 | SECURITY DEFINER |
| `validar_contacto_emergencia()` | F2 | Trigger |
| `autogenerar_nombre_curso()` | F2 | Trigger |
| `validar_asignacion_personal_curso()` | F2 | Trigger |
| `snapshot_empresa_matricula()` | F3 | Trigger |
| `calcular_pagado_matricula()` | F3 | Trigger |
| `get_formatos_for_matricula()` | F3 | SECURITY DEFINER |
| `duplicar_formato()` | F3 | RPC |
| `recalcular_grupo_cartera()` | F4 | SECURITY DEFINER |
| `recalcular_estado_factura()` | F4 | Trigger |
| `sync_factura_a_matriculas()` | F4 | Trigger |
| `on_delete_factura()` | F4 | Trigger |
| `login_portal_estudiante()` | F5 | SECURITY DEFINER |
| `get_documentos_portal()` | F5 | SECURITY DEFINER |
| `get_dashboard_stats()` | F6 | SECURITY DEFINER |
| `get_dashboard_charts_data()` | F6 | SECURITY DEFINER |
| `audit_log_trigger_fn()` | F6 | Trigger genérico |
| `update_updated_at()` | T-009 | Trigger genérico |
| `check_empresa_references()` | F1 | Trigger |
| `check_persona_references()` | F2 | Trigger |
