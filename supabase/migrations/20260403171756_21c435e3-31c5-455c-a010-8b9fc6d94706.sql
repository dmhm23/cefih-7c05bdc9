
-- ============================================================
-- PASO 4: NIVELES DE FORMACIÓN
-- ============================================================

CREATE TABLE public.niveles_formacion (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo_formacion public.tipo_formacion NOT NULL,
  duracion_horas INTEGER NOT NULL DEFAULT 0,
  descripcion TEXT,
  campos_adicionales JSONB DEFAULT '[]'::jsonb,
  config_codigo_estudiante JSONB DEFAULT '{}'::jsonb,
  documentos_requeridos TEXT[] DEFAULT '{}',
  activo BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.niveles_formacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen niveles"
  ON public.niveles_formacion FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin/global gestionan niveles"
  ON public.niveles_formacion FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));

CREATE TRIGGER trg_niveles_formacion_updated_at
  BEFORE UPDATE ON public.niveles_formacion
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_niveles_formacion_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.niveles_formacion
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('nivel_formacion');

-- Agregar FK pendiente en tarifas_empresa
ALTER TABLE public.tarifas_empresa
  ADD CONSTRAINT fk_tarifas_nivel_formacion
  FOREIGN KEY (nivel_formacion_id) REFERENCES public.niveles_formacion(id) ON DELETE RESTRICT;
