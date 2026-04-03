
-- ============================================================
-- PASO 6: CURSOS + FECHAS MINTRABAJO
-- ============================================================

CREATE TABLE public.cursos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL DEFAULT '',
  tipo_formacion public.tipo_formacion NOT NULL,
  nivel_formacion_id UUID REFERENCES public.niveles_formacion(id) ON DELETE RESTRICT,
  estado public.estado_curso NOT NULL DEFAULT 'programado',
  fecha_inicio DATE,
  fecha_fin DATE,
  lugar TEXT,
  capacidad_maxima INTEGER NOT NULL DEFAULT 30,
  entrenador_id UUID REFERENCES public.personal(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES public.personal(id) ON DELETE SET NULL,
  observaciones TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cursos_nivel ON public.cursos (nivel_formacion_id);
CREATE INDEX idx_cursos_estado ON public.cursos (estado);
CREATE INDEX idx_cursos_fechas ON public.cursos (fecha_inicio, fecha_fin);

ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen cursos"
  ON public.cursos FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin/global gestionan cursos"
  ON public.cursos FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));

-- Trigger: autogenerar nombre de curso (RN-CUR-004)
CREATE OR REPLACE FUNCTION public.autogenerar_nombre_curso()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _seq INTEGER;
  _tipo_label TEXT;
BEGIN
  IF NEW.nombre IS NULL OR NEW.nombre = '' THEN
    -- Contar cursos existentes del mismo tipo
    SELECT COUNT(*) + 1 INTO _seq
    FROM public.cursos
    WHERE tipo_formacion = NEW.tipo_formacion;

    -- Etiqueta legible
    _tipo_label := CASE NEW.tipo_formacion
      WHEN 'formacion_inicial' THEN 'FI'
      WHEN 'reentrenamiento' THEN 'RE'
      WHEN 'jefe_area' THEN 'JA'
      WHEN 'coordinador_alturas' THEN 'CA'
    END;

    NEW.nombre := _tipo_label || '-' || lpad(_seq::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_autogenerar_nombre_curso
  BEFORE INSERT ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.autogenerar_nombre_curso();

-- Trigger: validar asignación de personal (RN-PNL-005, RN-PNL-006)
CREATE OR REPLACE FUNCTION public.validar_asignacion_personal_curso()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _tipo_cargo public.tipo_cargo;
BEGIN
  -- Validar entrenador
  IF NEW.entrenador_id IS NOT NULL THEN
    SELECT c.tipo INTO _tipo_cargo
    FROM public.personal p
    JOIN public.cargos c ON c.id = p.cargo_id
    WHERE p.id = NEW.entrenador_id;

    IF _tipo_cargo NOT IN ('entrenador', 'instructor') THEN
      RAISE EXCEPTION 'El entrenador asignado debe tener cargo de tipo entrenador o instructor';
    END IF;
  END IF;

  -- Validar supervisor
  IF NEW.supervisor_id IS NOT NULL THEN
    SELECT c.tipo INTO _tipo_cargo
    FROM public.personal p
    JOIN public.cargos c ON c.id = p.cargo_id
    WHERE p.id = NEW.supervisor_id;

    IF _tipo_cargo != 'supervisor' THEN
      RAISE EXCEPTION 'El supervisor asignado debe tener cargo de tipo supervisor';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_asignacion_personal
  BEFORE INSERT OR UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.validar_asignacion_personal_curso();

-- Triggers estándar
CREATE TRIGGER trg_cursos_updated_at
  BEFORE UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_cursos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('curso');

-- ============================================================
-- FECHAS MINTRABAJO
-- ============================================================

CREATE TABLE public.cursos_fechas_mintrabajo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  motivo TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fechas_mintrabajo_curso ON public.cursos_fechas_mintrabajo (curso_id);

ALTER TABLE public.cursos_fechas_mintrabajo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen fechas mintrabajo"
  ON public.cursos_fechas_mintrabajo FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin/global gestionan fechas mintrabajo"
  ON public.cursos_fechas_mintrabajo FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));
