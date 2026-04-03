
-- ============================================================
-- PASO 3: Módulo de Certificación — 4 tablas
-- ============================================================

-- 1. plantillas_certificado
CREATE TABLE public.plantillas_certificado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  svg_raw TEXT NOT NULL DEFAULT '',
  tokens_detectados TEXT[] NOT NULL DEFAULT '{}',
  token_mappings JSONB NOT NULL DEFAULT '[]',
  activa BOOLEAN NOT NULL DEFAULT FALSE,
  version INTEGER NOT NULL DEFAULT 1,
  tipo_formacion public.tipo_formacion NOT NULL,
  regla_codigo TEXT NOT NULL DEFAULT '',
  reglas JSONB NOT NULL DEFAULT '{"requierePago":true,"requiereDocumentos":true,"requiereFormatos":true,"incluyeEmpresa":false,"incluyeFirmas":false}',
  niveles_asignados UUID[] NOT NULL DEFAULT '{}',
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plantillas_certificado ENABLE ROW LEVEL SECURITY;

-- 2. plantilla_certificado_versiones
CREATE TABLE public.plantilla_certificado_versiones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plantilla_id UUID NOT NULL REFERENCES public.plantillas_certificado(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  svg_raw TEXT NOT NULL DEFAULT '',
  modificado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plantilla_id, version)
);
ALTER TABLE public.plantilla_certificado_versiones ENABLE ROW LEVEL SECURITY;

-- 3. certificados
CREATE TABLE public.certificados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE RESTRICT,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE RESTRICT,
  persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE RESTRICT,
  plantilla_id UUID NOT NULL REFERENCES public.plantillas_certificado(id) ON DELETE RESTRICT,
  codigo TEXT NOT NULL UNIQUE,
  estado public.estado_certificado NOT NULL DEFAULT 'elegible',
  snapshot_datos JSONB NOT NULL DEFAULT '{}',
  svg_final TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  fecha_generacion TIMESTAMPTZ,
  revocado_por TEXT,
  motivo_revocacion TEXT,
  fecha_revocacion TIMESTAMPTZ,
  autorizado_excepcional BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

-- 4. excepciones_certificado
CREATE TABLE public.excepciones_certificado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  solicitado_por TEXT NOT NULL,
  motivo TEXT NOT NULL,
  estado public.estado_excepcion_certificado NOT NULL DEFAULT 'pendiente',
  resuelto_por TEXT,
  fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_resolucion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.excepciones_certificado ENABLE ROW LEVEL SECURITY;

-- ==================== ÍNDICES ====================
CREATE INDEX idx_certificados_matricula ON public.certificados(matricula_id);
CREATE INDEX idx_certificados_curso ON public.certificados(curso_id);
CREATE INDEX idx_certificados_codigo ON public.certificados(codigo);
CREATE INDEX idx_plantilla_versiones_plantilla ON public.plantilla_certificado_versiones(plantilla_id);
CREATE INDEX idx_excepciones_matricula ON public.excepciones_certificado(matricula_id);

-- ==================== RLS ====================

-- plantillas_certificado
CREATE POLICY "Admin/global gestionan plantillas_certificado" ON public.plantillas_certificado
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen plantillas_certificado" ON public.plantillas_certificado
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- plantilla_certificado_versiones
CREATE POLICY "Admin/global gestionan versiones_plantilla" ON public.plantilla_certificado_versiones
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen versiones_plantilla" ON public.plantilla_certificado_versiones
  FOR SELECT TO authenticated USING (true);

-- certificados
CREATE POLICY "Admin/global gestionan certificados" ON public.certificados
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen certificados" ON public.certificados
  FOR SELECT TO authenticated USING (true);

-- excepciones_certificado
CREATE POLICY "Admin/global gestionan excepciones_certificado" ON public.excepciones_certificado
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen excepciones_certificado" ON public.excepciones_certificado
  FOR SELECT TO authenticated USING (true);

-- ==================== TRIGGERS ====================

-- updated_at
CREATE TRIGGER update_plantillas_certificado_updated_at BEFORE UPDATE ON public.plantillas_certificado
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_certificados_updated_at BEFORE UPDATE ON public.certificados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auditoría
CREATE TRIGGER audit_plantillas_certificado AFTER INSERT OR UPDATE OR DELETE ON public.plantillas_certificado
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('plantilla_certificado');
CREATE TRIGGER audit_certificados AFTER INSERT OR UPDATE OR DELETE ON public.certificados
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('certificado');
CREATE TRIGGER audit_excepciones_certificado AFTER INSERT OR UPDATE OR DELETE ON public.excepciones_certificado
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('excepcion_certificado');
