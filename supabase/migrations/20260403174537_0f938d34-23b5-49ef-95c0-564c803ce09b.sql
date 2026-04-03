
-- ============================================================
-- PASO 4: Portal del Estudiante — 2 tablas + 2 funciones
-- ============================================================

-- 1. portal_config_documentos
CREATE TABLE public.portal_config_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  tipo public.tipo_doc_portal NOT NULL DEFAULT 'formulario',
  label TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  icono TEXT NOT NULL DEFAULT 'FileText',
  orden INTEGER NOT NULL DEFAULT 0,
  obligatorio BOOLEAN NOT NULL DEFAULT TRUE,
  depende_de TEXT[] NOT NULL DEFAULT '{}',
  habilitado_por_nivel JSONB NOT NULL DEFAULT '{"formacion_inicial":true,"reentrenamiento":true,"jefe_area":true,"coordinador_alturas":true}',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_config_documentos ENABLE ROW LEVEL SECURITY;

-- 2. documentos_portal
CREATE TABLE public.documentos_portal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  documento_key TEXT NOT NULL,
  estado public.estado_doc_portal NOT NULL DEFAULT 'pendiente',
  enviado_en TIMESTAMPTZ,
  firma_data TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  intentos JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(matricula_id, documento_key)
);
ALTER TABLE public.documentos_portal ENABLE ROW LEVEL SECURITY;

-- ==================== ÍNDICES ====================
CREATE INDEX idx_documentos_portal_matricula ON public.documentos_portal(matricula_id);
CREATE INDEX idx_portal_config_key ON public.portal_config_documentos(key);

-- ==================== RLS ====================

-- portal_config_documentos
CREATE POLICY "Admin/global gestionan portal_config" ON public.portal_config_documentos
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen portal_config" ON public.portal_config_documentos
  FOR SELECT TO authenticated USING (true);
-- Anon puede leer config para el portal público
CREATE POLICY "Anon lee portal_config" ON public.portal_config_documentos
  FOR SELECT TO anon USING (activo = TRUE);

-- documentos_portal
CREATE POLICY "Admin/global gestionan documentos_portal" ON public.documentos_portal
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen documentos_portal" ON public.documentos_portal
  FOR SELECT TO authenticated USING (true);
-- Anon puede leer y escribir documentos_portal (portal público)
CREATE POLICY "Anon lee documentos_portal" ON public.documentos_portal
  FOR SELECT TO anon USING (true);
CREATE POLICY "Anon inserta documentos_portal" ON public.documentos_portal
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon actualiza documentos_portal" ON public.documentos_portal
  FOR UPDATE TO anon USING (true);

-- ==================== TRIGGERS ====================
CREATE TRIGGER update_portal_config_updated_at BEFORE UPDATE ON public.portal_config_documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_documentos_portal_updated_at BEFORE UPDATE ON public.documentos_portal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==================== FUNCIONES ====================

-- login_portal_estudiante: busca matrícula vigente por cédula
CREATE OR REPLACE FUNCTION public.login_portal_estudiante(p_cedula TEXT)
RETURNS TABLE (
  matricula_id UUID,
  persona_id UUID,
  curso_id UUID,
  persona_nombres TEXT,
  persona_apellidos TEXT,
  persona_numero_documento TEXT,
  curso_nombre TEXT,
  curso_tipo_formacion public.tipo_formacion,
  portal_habilitado BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS matricula_id,
    p.id AS persona_id,
    c.id AS curso_id,
    p.nombres AS persona_nombres,
    p.apellidos AS persona_apellidos,
    p.numero_documento AS persona_numero_documento,
    c.nombre AS curso_nombre,
    c.tipo_formacion AS curso_tipo_formacion,
    COALESCE((m.portal_estudiante->>'habilitado')::BOOLEAN, TRUE) AS portal_habilitado
  FROM public.matriculas m
  JOIN public.personas p ON p.id = m.persona_id
  JOIN public.cursos c ON c.id = m.curso_id
  WHERE p.numero_documento = p_cedula
    AND m.deleted_at IS NULL
    AND m.activo = TRUE
    AND c.estado != 'cerrado'
    AND c.estado != 'cancelado'
    AND (c.fecha_inicio IS NULL OR c.fecha_inicio <= CURRENT_DATE)
    AND (c.fecha_fin IS NULL OR c.fecha_fin >= CURRENT_DATE)
  ORDER BY c.fecha_inicio DESC NULLS LAST
  LIMIT 1;
END;
$$;

-- get_documentos_portal: retorna documentos con evaluación de dependencias
CREATE OR REPLACE FUNCTION public.get_documentos_portal(p_matricula_id UUID)
RETURNS TABLE (
  documento_key TEXT,
  tipo public.tipo_doc_portal,
  label TEXT,
  descripcion TEXT,
  icono TEXT,
  orden INTEGER,
  obligatorio BOOLEAN,
  depende_de TEXT[],
  estado public.estado_doc_portal,
  enviado_en TIMESTAMPTZ,
  firma_data TEXT,
  metadata JSONB,
  intentos JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tipo_formacion public.tipo_formacion;
  _rec RECORD;
  _dep_key TEXT;
  _dep_completada BOOLEAN;
BEGIN
  -- Obtener tipo_formacion del curso
  SELECT c.tipo_formacion INTO _tipo_formacion
  FROM public.matriculas m
  JOIN public.cursos c ON c.id = m.curso_id
  WHERE m.id = p_matricula_id;

  FOR _rec IN
    SELECT
      cfg.key,
      cfg.tipo,
      cfg.label,
      cfg.descripcion,
      cfg.icono,
      cfg.orden,
      cfg.obligatorio,
      cfg.depende_de,
      dp.estado AS doc_estado,
      dp.enviado_en,
      dp.firma_data,
      dp.metadata,
      dp.intentos
    FROM public.portal_config_documentos cfg
    LEFT JOIN public.documentos_portal dp ON dp.matricula_id = p_matricula_id AND dp.documento_key = cfg.key
    WHERE cfg.activo = TRUE
      AND (_tipo_formacion IS NULL OR (cfg.habilitado_por_nivel->>_tipo_formacion::TEXT)::BOOLEAN = TRUE)
    ORDER BY cfg.orden
  LOOP
    documento_key := _rec.key;
    tipo := _rec.tipo;
    label := _rec.label;
    descripcion := _rec.descripcion;
    icono := _rec.icono;
    orden := _rec.orden;
    obligatorio := _rec.obligatorio;
    depende_de := _rec.depende_de;
    firma_data := _rec.firma_data;
    metadata := COALESCE(_rec.metadata, '{}'::JSONB);
    intentos := COALESCE(_rec.intentos, '[]'::JSONB);
    enviado_en := _rec.enviado_en;

    -- Si ya está completado, respetar
    IF _rec.doc_estado = 'completado' THEN
      estado := 'completado';
    ELSE
      -- Evaluar dependencias
      estado := 'pendiente';
      IF array_length(_rec.depende_de, 1) > 0 THEN
        FOREACH _dep_key IN ARRAY _rec.depende_de LOOP
          SELECT (dp2.estado = 'completado') INTO _dep_completada
          FROM public.documentos_portal dp2
          WHERE dp2.matricula_id = p_matricula_id AND dp2.documento_key = _dep_key;

          IF NOT COALESCE(_dep_completada, FALSE) THEN
            estado := 'bloqueado';
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$$;

-- Permitir anon ejecutar las funciones del portal
GRANT EXECUTE ON FUNCTION public.login_portal_estudiante(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_documentos_portal(UUID) TO anon;
