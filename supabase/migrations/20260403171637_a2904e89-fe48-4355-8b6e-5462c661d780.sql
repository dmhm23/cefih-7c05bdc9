
-- ============================================================
-- PASO 1: INFRAESTRUCTURA TRANSVERSAL
-- ENUMs, funciones utilitarias, audit_logs, storage buckets
-- ============================================================

-- ========================
-- 1A. FUNCIÓN update_updated_at
-- ========================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ========================
-- 1B. ENUMS — Catálogos del sistema
-- ========================

-- Documentos de identidad (RN-PER-002)
CREATE TYPE public.tipo_documento_identidad AS ENUM (
  'cedula_ciudadania',
  'cedula_extranjeria',
  'pasaporte',
  'tarjeta_identidad',
  'pep'
);

-- Género (RN-PER-003)
CREATE TYPE public.genero AS ENUM (
  'masculino',
  'femenino',
  'otro'
);

-- Nivel educativo (RN-PER-004)
CREATE TYPE public.nivel_educativo AS ENUM (
  'primaria',
  'secundaria',
  'tecnico',
  'tecnologo',
  'profesional',
  'especializacion',
  'maestria',
  'doctorado',
  'ninguno',
  'otro'
);

-- Tipo de cargo / rol del personal (RN-PNL-001)
CREATE TYPE public.tipo_cargo AS ENUM (
  'entrenador',
  'supervisor',
  'administrativo',
  'instructor',
  'otro'
);

-- Tipo de formación (RN-CUR-003, INC-007)
CREATE TYPE public.tipo_formacion AS ENUM (
  'formacion_inicial',
  'reentrenamiento',
  'jefe_area',
  'coordinador_alturas'
);

-- Estado de curso (RN-CUR-001)
CREATE TYPE public.estado_curso AS ENUM (
  'programado',
  'en_curso',
  'cerrado',
  'cancelado'
);

-- Estado de matrícula (RN-MAT-001)
CREATE TYPE public.estado_matricula AS ENUM (
  'creada',
  'pendiente',
  'completa',
  'certificada',
  'cerrada'
);

-- Tipo de vinculación (RN-MAT-002)
CREATE TYPE public.tipo_vinculacion AS ENUM (
  'empresa',
  'independiente',
  'arl'
);

-- Método de pago unificado (T-003, INC-009)
CREATE TYPE public.metodo_pago AS ENUM (
  'transferencia_bancaria',
  'efectivo',
  'consignacion',
  'nequi',
  'daviplata',
  'bre_b',
  'corresponsal_bancario',
  'otro'
);

-- Sector económico (RN-EMP-004)
CREATE TYPE public.sector_economico AS ENUM (
  'construccion',
  'telecomunicaciones',
  'energia',
  'petroleo_gas',
  'manufactura',
  'mineria',
  'servicios',
  'otro'
);

-- ARL (RN-EMP-005)
CREATE TYPE public.arl_enum AS ENUM (
  'sura',
  'positiva',
  'colmena',
  'bolivar',
  'axa_colpatria',
  'liberty',
  'equidad',
  'alfa',
  'aurora',
  'otra'
);

-- Estado de grupo cartera (RN-CAR-002)
CREATE TYPE public.estado_grupo_cartera AS ENUM (
  'pendiente',
  'parcial',
  'pagado',
  'vencido',
  'anulado'
);

-- Estado de factura (RN-CAR-003)
CREATE TYPE public.estado_factura AS ENUM (
  'pendiente',
  'parcial',
  'pagada'
);

-- Estado de certificado (RN-CER-001)
CREATE TYPE public.estado_certificado AS ENUM (
  'elegible',
  'generado',
  'bloqueado',
  'revocado'
);

-- Categoría de formato (RN-FMT-008)
CREATE TYPE public.categoria_formato AS ENUM (
  'formacion',
  'evaluacion',
  'asistencia',
  'pta_ats',
  'personalizado'
);

-- Estado de formato (RN-FMT-004)
CREATE TYPE public.estado_formato AS ENUM (
  'borrador',
  'activo',
  'archivado'
);

-- Estado de documento de matrícula (RN-MAT-011)
CREATE TYPE public.estado_documento_matricula AS ENUM (
  'pendiente',
  'cargado'
);

-- Tipo de documento de matrícula (RN-MAT-012)
CREATE TYPE public.tipo_documento_matricula AS ENUM (
  'cedula',
  'certificado_eps',
  'certificado_arl',
  'certificado_pension',
  'examen_medico',
  'certificado_alturas',
  'carta_autorizacion',
  'otro'
);

-- Tipo de entidad auditable (RN-AUD-004, INC-001)
CREATE TYPE public.tipo_entidad_audit AS ENUM (
  'persona',
  'empresa',
  'tarifa_empresa',
  'curso',
  'nivel_formacion',
  'matricula',
  'documento_matricula',
  'personal',
  'cargo',
  'formato',
  'version_formato',
  'certificado',
  'grupo_cartera',
  'factura',
  'pago',
  'comentario'
);

-- Tipo de acción auditable
CREATE TYPE public.tipo_accion_audit AS ENUM (
  'crear',
  'editar',
  'eliminar',
  'cambio_estado'
);

-- Estado de excepción de certificado (RN-CER-005)
CREATE TYPE public.estado_excepcion_certificado AS ENUM (
  'pendiente',
  'aprobada',
  'rechazada'
);

-- Tipo de actividad de cartera (RN-CAR-016)
CREATE TYPE public.tipo_actividad_cartera AS ENUM (
  'nota',
  'llamada',
  'correo',
  'sistema'
);

-- Scope de formato (RN-FMT-009)
CREATE TYPE public.scope_formato AS ENUM (
  'nivel_formacion',
  'tipo_curso'
);

-- Sección de comentarios (RN-COM-001)
CREATE TYPE public.seccion_comentario AS ENUM (
  'cartera',
  'observaciones',
  'curso_observaciones'
);

-- ========================
-- 1C. TABLA audit_logs
-- ========================
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entidad_tipo public.tipo_entidad_audit NOT NULL,
  entidad_id UUID NOT NULL,
  accion public.tipo_accion_audit NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nombre TEXT,
  campos_modificados TEXT[],
  valor_anterior JSONB,
  valor_nuevo JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_audit_logs_entidad ON public.audit_logs (entidad_tipo, entidad_id);
CREATE INDEX idx_audit_logs_usuario ON public.audit_logs (usuario_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados pueden leer audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solo sistema inserta audit_logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ========================
-- 1D. FUNCIÓN GENÉRICA audit_log_trigger_fn
-- ========================
CREATE OR REPLACE FUNCTION public.audit_log_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _entidad_tipo public.tipo_entidad_audit;
  _accion public.tipo_accion_audit;
  _campos TEXT[];
  _old JSONB;
  _new JSONB;
  _key TEXT;
BEGIN
  -- Determinar tipo de entidad desde TG_ARGV[0]
  _entidad_tipo := TG_ARGV[0]::public.tipo_entidad_audit;

  IF TG_OP = 'INSERT' THEN
    _accion := 'crear';
    _new := to_jsonb(NEW);
    INSERT INTO public.audit_logs (entidad_tipo, entidad_id, accion, usuario_id, valor_nuevo)
    VALUES (_entidad_tipo, NEW.id, _accion, auth.uid(), _new);
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    _accion := 'editar';
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
    -- Detectar campos modificados
    _campos := ARRAY[]::TEXT[];
    FOR _key IN SELECT jsonb_object_keys(_new) LOOP
      IF _old->_key IS DISTINCT FROM _new->_key THEN
        _campos := array_append(_campos, _key);
      END IF;
    END LOOP;
    -- Solo registrar si hubo cambios reales
    IF array_length(_campos, 1) > 0 THEN
      INSERT INTO public.audit_logs (entidad_tipo, entidad_id, accion, usuario_id, campos_modificados, valor_anterior, valor_nuevo)
      VALUES (_entidad_tipo, NEW.id, _accion, auth.uid(), _campos, _old, _new);
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    _accion := 'eliminar';
    _old := to_jsonb(OLD);
    INSERT INTO public.audit_logs (entidad_tipo, entidad_id, accion, usuario_id, valor_anterior)
    VALUES (_entidad_tipo, OLD.id, _accion, auth.uid(), _old);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- ========================
-- 1E. STORAGE BUCKETS
-- ========================
INSERT INTO storage.buckets (id, name, public) VALUES ('firmas', 'firmas', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-matricula', 'documentos-matricula', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('adjuntos-personal', 'adjuntos-personal', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('facturas', 'facturas', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificados', 'certificados', false);

-- Políticas de storage: autenticados pueden leer y escribir en todos los buckets
CREATE POLICY "Autenticados leen archivos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id IN ('firmas', 'documentos-matricula', 'adjuntos-personal', 'facturas', 'certificados'));

CREATE POLICY "Autenticados suben archivos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id IN ('firmas', 'documentos-matricula', 'adjuntos-personal', 'facturas', 'certificados'));

CREATE POLICY "Autenticados actualizan archivos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id IN ('firmas', 'documentos-matricula', 'adjuntos-personal', 'facturas', 'certificados'));

CREATE POLICY "Autenticados eliminan archivos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('firmas', 'documentos-matricula', 'adjuntos-personal', 'facturas', 'certificados'));
