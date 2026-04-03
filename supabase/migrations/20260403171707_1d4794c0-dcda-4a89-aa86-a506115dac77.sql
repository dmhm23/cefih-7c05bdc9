
-- ============================================================
-- PASO 2: EMPRESAS Y TARIFAS
-- ============================================================

CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_empresa TEXT NOT NULL,
  nit TEXT NOT NULL UNIQUE,
  sector_economico public.sector_economico,
  arl public.arl_enum,
  persona_contacto TEXT NOT NULL DEFAULT '',
  email_contacto TEXT NOT NULL DEFAULT '',
  telefono_contacto TEXT NOT NULL DEFAULT '',
  direccion TEXT,
  ciudad TEXT,
  departamento TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  observaciones TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_empresas_nit ON public.empresas (nit);
CREATE INDEX idx_empresas_nombre ON public.empresas USING gin (to_tsvector('spanish', nombre_empresa));
CREATE INDEX idx_empresas_activo ON public.empresas (activo) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen empresas activas"
  ON public.empresas FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin/global gestionan empresas"
  ON public.empresas FOR ALL
  TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));

-- Triggers
CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_empresas_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('empresa');

-- ============================================================
-- TARIFAS EMPRESA
-- ============================================================

CREATE TABLE public.tarifas_empresa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE RESTRICT,
  nivel_formacion_id UUID NOT NULL, -- FK se agregará en Paso 4 cuando exista la tabla
  valor NUMERIC(12,2) NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, nivel_formacion_id)
);

CREATE INDEX idx_tarifas_empresa_empresa ON public.tarifas_empresa (empresa_id);

-- RLS
ALTER TABLE public.tarifas_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen tarifas"
  ON public.tarifas_empresa FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin/global gestionan tarifas"
  ON public.tarifas_empresa FOR ALL
  TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));

-- Triggers
CREATE TRIGGER trg_tarifas_empresa_updated_at
  BEFORE UPDATE ON public.tarifas_empresa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_tarifas_empresa_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.tarifas_empresa
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('tarifa_empresa');
