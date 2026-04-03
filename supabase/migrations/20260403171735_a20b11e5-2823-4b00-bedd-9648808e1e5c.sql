
-- ============================================================
-- PASO 3: CARGOS, PERSONAL, PERSONAL_ADJUNTOS
-- ============================================================

CREATE TABLE public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo public.tipo_cargo NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen cargos"
  ON public.cargos FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin/global gestionan cargos"
  ON public.cargos FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));

CREATE TRIGGER trg_cargos_updated_at
  BEFORE UPDATE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_cargos_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.cargos
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('cargo');

-- ============================================================
-- PERSONAL
-- ============================================================

CREATE TABLE public.personal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  numero_documento TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE RESTRICT,
  firma_storage_path TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_personal_cargo ON public.personal (cargo_id);
CREATE INDEX idx_personal_documento ON public.personal (numero_documento);

ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen personal"
  ON public.personal FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin/global gestionan personal"
  ON public.personal FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));

CREATE TRIGGER trg_personal_updated_at
  BEFORE UPDATE ON public.personal
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_personal_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.personal
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('personal');

-- ============================================================
-- PERSONAL ADJUNTOS
-- ============================================================

CREATE TABLE public.personal_adjuntos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  personal_id UUID NOT NULL REFERENCES public.personal(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo_mime TEXT,
  tamano BIGINT,
  storage_path TEXT NOT NULL,
  fecha_carga TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_personal_adjuntos_personal ON public.personal_adjuntos (personal_id);

ALTER TABLE public.personal_adjuntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen adjuntos personal"
  ON public.personal_adjuntos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin/global gestionan adjuntos personal"
  ON public.personal_adjuntos FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));
