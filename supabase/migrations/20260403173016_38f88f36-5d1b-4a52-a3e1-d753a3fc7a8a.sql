
-- =============================================
-- FASE 3 — PASO 1: ENUMs + tabla matriculas
-- =============================================

-- 1. Nuevos ENUMs
CREATE TYPE public.nivel_previo AS ENUM ('trabajador_autorizado', 'avanzado');
CREATE TYPE public.motor_render AS ENUM ('bloques', 'plantilla_html');
CREATE TYPE public.estado_formato_respuesta AS ENUM ('pendiente', 'completado', 'firmado');

-- 2. Tabla matriculas
CREATE TABLE public.matriculas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Referencias
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE RESTRICT,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE RESTRICT,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE RESTRICT,
  estado public.estado_matricula NOT NULL DEFAULT 'creada',

  -- Fechas (auto-sync desde curso)
  fecha_inicio DATE,
  fecha_fin DATE,

  -- Historial formación previa
  nivel_previo public.nivel_previo,
  centro_formacion_previo TEXT,
  fecha_certificacion_previa DATE,

  -- Vinculación laboral
  tipo_vinculacion public.tipo_vinculacion,

  -- Snapshot empresa (desnormalizado por trigger)
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

  -- Consentimiento de salud
  consentimiento_salud BOOLEAN NOT NULL DEFAULT FALSE,
  restriccion_medica BOOLEAN NOT NULL DEFAULT FALSE,
  restriccion_medica_detalle TEXT,
  alergias BOOLEAN NOT NULL DEFAULT FALSE,
  alergias_detalle TEXT,
  consumo_medicamentos BOOLEAN NOT NULL DEFAULT FALSE,
  consumo_medicamentos_detalle TEXT,
  embarazo BOOLEAN DEFAULT FALSE,
  nivel_lectoescritura BOOLEAN NOT NULL DEFAULT TRUE,

  -- Autorización de datos
  autorizacion_datos BOOLEAN NOT NULL DEFAULT FALSE,

  -- Firma
  firma_capturada BOOLEAN NOT NULL DEFAULT FALSE,
  firma_storage_path TEXT,

  -- Evaluaciones
  evaluacion_completada BOOLEAN NOT NULL DEFAULT FALSE,
  evaluacion_puntaje NUMERIC,
  encuesta_completada BOOLEAN NOT NULL DEFAULT FALSE,

  -- Evaluaciones JSONB
  autoevaluacion_respuestas JSONB DEFAULT '[]'::jsonb,
  evaluacion_competencias_respuestas JSONB DEFAULT '[]'::jsonb,
  evaluacion_respuestas JSONB DEFAULT '[]'::jsonb,
  encuesta_respuestas JSONB DEFAULT '[]'::jsonb,

  -- Cartera / cobros
  cobro_contacto_nombre TEXT,
  cobro_contacto_celular TEXT,
  valor_cupo NUMERIC NOT NULL DEFAULT 0,
  abono NUMERIC NOT NULL DEFAULT 0,
  pagado BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_facturacion DATE,
  cta_fact_numero TEXT,
  cta_fact_titular TEXT,
  fecha_pago DATE,
  forma_pago public.metodo_pago,
  factura_numero TEXT,

  -- Certificado
  fecha_generacion_certificado TIMESTAMPTZ,
  fecha_entrega_certificado DATE,

  -- Portal estudiante
  portal_estudiante JSONB DEFAULT '{}'::jsonb,

  -- Observaciones
  observaciones TEXT,

  -- Soft delete y timestamps
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Constraint UNIQUE parcial: una persona no puede estar dos veces en el mismo curso
CREATE UNIQUE INDEX uq_matricula_persona_curso
  ON public.matriculas (persona_id, curso_id)
  WHERE curso_id IS NOT NULL AND deleted_at IS NULL;

-- 4. Índices de rendimiento
CREATE INDEX idx_matriculas_persona ON public.matriculas(persona_id);
CREATE INDEX idx_matriculas_curso ON public.matriculas(curso_id);
CREATE INDEX idx_matriculas_empresa ON public.matriculas(empresa_id);
CREATE INDEX idx_matriculas_estado ON public.matriculas(estado);

-- 5. RLS
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen matriculas"
  ON public.matriculas FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin/global gestionan matriculas"
  ON public.matriculas FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));

-- 6. Trigger: update_updated_at
CREATE TRIGGER update_matriculas_updated_at
  BEFORE UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 7. Trigger: audit log
CREATE TRIGGER audit_matriculas
  AFTER INSERT OR UPDATE OR DELETE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('matricula');

-- 8. Trigger: snapshot empresa
CREATE OR REPLACE FUNCTION public.snapshot_empresa_matricula()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _emp RECORD;
BEGIN
  IF NEW.empresa_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR OLD.empresa_id IS DISTINCT FROM NEW.empresa_id
  ) THEN
    SELECT nombre_empresa, nit, persona_contacto, telefono_contacto
    INTO _emp
    FROM public.empresas
    WHERE id = NEW.empresa_id;

    IF FOUND THEN
      NEW.empresa_nombre := _emp.nombre_empresa;
      NEW.empresa_nit := _emp.nit;
      NEW.empresa_contacto_nombre := COALESCE(NEW.empresa_contacto_nombre, _emp.persona_contacto);
      NEW.empresa_contacto_telefono := COALESCE(NEW.empresa_contacto_telefono, _emp.telefono_contacto);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_snapshot_empresa_matricula
  BEFORE INSERT OR UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_empresa_matricula();

-- 9. Trigger: sync fechas desde curso
CREATE OR REPLACE FUNCTION public.sync_fechas_curso_matricula()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _curso RECORD;
BEGIN
  IF NEW.curso_id IS NOT NULL AND (
    TG_OP = 'INSERT' OR OLD.curso_id IS DISTINCT FROM NEW.curso_id
  ) THEN
    SELECT fecha_inicio, fecha_fin
    INTO _curso
    FROM public.cursos
    WHERE id = NEW.curso_id;

    IF FOUND THEN
      NEW.fecha_inicio := COALESCE(NEW.fecha_inicio, _curso.fecha_inicio);
      NEW.fecha_fin := COALESCE(NEW.fecha_fin, _curso.fecha_fin);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_fechas_curso_matricula
  BEFORE INSERT OR UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.sync_fechas_curso_matricula();

-- 10. Trigger: calcular pagado
CREATE OR REPLACE FUNCTION public.calcular_pagado_matricula()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.valor_cupo > 0 THEN
    NEW.pagado := NEW.abono >= NEW.valor_cupo;
  ELSE
    NEW.pagado := TRUE;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calcular_pagado_matricula
  BEFORE INSERT OR UPDATE ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.calcular_pagado_matricula();
