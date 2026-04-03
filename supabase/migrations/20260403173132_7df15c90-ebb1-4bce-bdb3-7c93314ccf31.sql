
-- =============================================
-- FASE 3 — PASO 3: Formatos, versiones, respuestas
-- =============================================

-- 1. Tabla formatos_formacion
CREATE TABLE public.formatos_formacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  codigo TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '001',

  motor_render public.motor_render NOT NULL DEFAULT 'bloques',
  categoria public.categoria_formato NOT NULL DEFAULT 'formacion',
  estado public.estado_formato NOT NULL DEFAULT 'borrador',

  -- Scope de asignación
  asignacion_scope public.scope_formato NOT NULL DEFAULT 'nivel_formacion',
  niveles_asignados UUID[] DEFAULT '{}',
  tipos_curso public.tipo_formacion[] DEFAULT '{}',

  -- Plantilla HTML (motor plantilla_html)
  html_template TEXT,
  css_template TEXT,

  -- Bloques (motor bloques)
  bloques JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Encabezado institucional
  usa_encabezado_institucional BOOLEAN NOT NULL DEFAULT FALSE,
  encabezado_config JSONB DEFAULT '{}'::jsonb,

  -- Tokens usados
  tokens_usados TEXT[] DEFAULT '{}',

  -- Firmas
  requiere_firma_aprendiz BOOLEAN NOT NULL DEFAULT FALSE,
  requiere_firma_entrenador BOOLEAN NOT NULL DEFAULT FALSE,
  requiere_firma_supervisor BOOLEAN NOT NULL DEFAULT FALSE,

  -- Visibilidad
  visible_en_matricula BOOLEAN NOT NULL DEFAULT TRUE,
  visible_en_curso BOOLEAN NOT NULL DEFAULT FALSE,
  visible_en_portal_estudiante BOOLEAN NOT NULL DEFAULT FALSE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,

  -- Modo diligenciamiento
  modo_diligenciamiento TEXT NOT NULL DEFAULT 'manual_estudiante',
  es_automatico BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata documento
  document_meta JSONB DEFAULT '{}'::jsonb,

  -- Legacy
  legacy_component_id TEXT,
  plantilla_base_id UUID,

  -- Timestamps
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_formatos_estado ON public.formatos_formacion(estado);
CREATE INDEX idx_formatos_categoria ON public.formatos_formacion(categoria);

ALTER TABLE public.formatos_formacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen formatos"
  ON public.formatos_formacion FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin/global gestionan formatos"
  ON public.formatos_formacion FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));

CREATE TRIGGER update_formatos_updated_at
  BEFORE UPDATE ON public.formatos_formacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER audit_formatos_formacion
  AFTER INSERT OR UPDATE OR DELETE ON public.formatos_formacion
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('formato');

-- 2. Tabla versiones_formato
CREATE TABLE public.versiones_formato (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formato_id UUID NOT NULL REFERENCES public.formatos_formacion(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  html_template TEXT NOT NULL DEFAULT '',
  css_template TEXT,
  creado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_versiones_formato ON public.versiones_formato(formato_id);

ALTER TABLE public.versiones_formato ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen versiones formato"
  ON public.versiones_formato FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Admin/global gestionan versiones formato"
  ON public.versiones_formato FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));

CREATE TRIGGER audit_versiones_formato
  AFTER INSERT OR UPDATE OR DELETE ON public.versiones_formato
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('version_formato');

-- 3. Tabla formato_respuestas
CREATE TABLE public.formato_respuestas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  formato_id UUID NOT NULL REFERENCES public.formatos_formacion(id) ON DELETE RESTRICT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  estado public.estado_formato_respuesta NOT NULL DEFAULT 'pendiente',
  completado_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(matricula_id, formato_id)
);

CREATE INDEX idx_formato_resp_matricula ON public.formato_respuestas(matricula_id);

ALTER TABLE public.formato_respuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen respuestas formato"
  ON public.formato_respuestas FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Admin/global gestionan respuestas formato"
  ON public.formato_respuestas FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));

CREATE TRIGGER update_formato_respuestas_updated_at
  BEFORE UPDATE ON public.formato_respuestas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. RPC: duplicar_formato
CREATE OR REPLACE FUNCTION public.duplicar_formato(_formato_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_id UUID;
BEGIN
  INSERT INTO public.formatos_formacion (
    nombre, descripcion, codigo, version, motor_render, categoria, estado,
    asignacion_scope, niveles_asignados, tipos_curso,
    html_template, css_template, bloques,
    usa_encabezado_institucional, encabezado_config,
    tokens_usados, requiere_firma_aprendiz, requiere_firma_entrenador, requiere_firma_supervisor,
    visible_en_matricula, visible_en_curso, visible_en_portal_estudiante,
    activo, modo_diligenciamiento, es_automatico, document_meta,
    legacy_component_id, plantilla_base_id
  )
  SELECT
    'Copia de ' || nombre, descripcion, codigo || '-COPIA', '001', motor_render, categoria, 'borrador',
    asignacion_scope, niveles_asignados, tipos_curso,
    html_template, css_template, bloques,
    usa_encabezado_institucional, encabezado_config,
    tokens_usados, requiere_firma_aprendiz, requiere_firma_entrenador, requiere_firma_supervisor,
    visible_en_matricula, visible_en_curso, visible_en_portal_estudiante,
    TRUE, modo_diligenciamiento, es_automatico, document_meta,
    legacy_component_id, id
  FROM public.formatos_formacion
  WHERE id = _formato_id
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$$;

-- 5. Function: get_formatos_for_matricula
CREATE OR REPLACE FUNCTION public.get_formatos_for_matricula(_matricula_id UUID)
RETURNS SETOF public.formatos_formacion
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _curso_id UUID;
  _tipo_formacion public.tipo_formacion;
  _nivel_id UUID;
BEGIN
  -- Get curso info from matricula
  SELECT m.curso_id INTO _curso_id
  FROM public.matriculas m WHERE m.id = _matricula_id;

  IF _curso_id IS NOT NULL THEN
    SELECT c.tipo_formacion, c.nivel_formacion_id INTO _tipo_formacion, _nivel_id
    FROM public.cursos c WHERE c.id = _curso_id;
  END IF;

  RETURN QUERY
  SELECT f.*
  FROM public.formatos_formacion f
  WHERE f.estado = 'activo'
    AND f.activo = TRUE
    AND f.deleted_at IS NULL
    AND (
      -- scope nivel_formacion: el nivel del curso está en niveles_asignados
      (f.asignacion_scope = 'nivel_formacion' AND _nivel_id = ANY(f.niveles_asignados))
      OR
      -- scope tipo_curso: el tipo del curso está en tipos_curso
      (f.asignacion_scope = 'tipo_curso' AND _tipo_formacion = ANY(f.tipos_curso))
    );
END;
$$;
