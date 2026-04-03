-- ============================================================
-- Paso 1: Tabla comentarios + audit triggers faltantes
-- ============================================================

-- Tabla comentarios
CREATE TABLE public.comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entidad_tipo TEXT NOT NULL,
  entidad_id UUID NOT NULL,
  seccion public.seccion_comentario NOT NULL,
  texto TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nombre TEXT NOT NULL DEFAULT '',
  editado_en TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_comentarios_entidad ON public.comentarios (entidad_tipo, entidad_id);

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen comentarios"
  ON public.comentarios FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin/global gestionan comentarios"
  ON public.comentarios FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));

-- Audit trigger para comentarios
CREATE TRIGGER trg_audit_comentarios
  AFTER INSERT OR UPDATE OR DELETE ON public.comentarios
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('comentario');

-- ============================================================
-- Audit triggers faltantes en tablas F1-F2
-- ============================================================

CREATE TRIGGER trg_audit_personas
  AFTER INSERT OR UPDATE OR DELETE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('persona');

CREATE TRIGGER trg_audit_empresas
  AFTER INSERT OR UPDATE OR DELETE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('empresa');

CREATE TRIGGER trg_audit_tarifas_empresa
  AFTER INSERT OR UPDATE OR DELETE ON public.tarifas_empresa
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('tarifa_empresa');

CREATE TRIGGER trg_audit_cursos
  AFTER INSERT OR UPDATE OR DELETE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('curso');

CREATE TRIGGER trg_audit_niveles_formacion
  AFTER INSERT OR UPDATE OR DELETE ON public.niveles_formacion
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('nivel_formacion');

CREATE TRIGGER trg_audit_personal
  AFTER INSERT OR UPDATE OR DELETE ON public.personal
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('personal');

CREATE TRIGGER trg_audit_cargos
  AFTER INSERT OR UPDATE OR DELETE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('cargo');
