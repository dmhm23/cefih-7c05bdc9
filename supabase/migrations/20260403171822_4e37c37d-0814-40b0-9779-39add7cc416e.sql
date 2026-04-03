
-- ============================================================
-- PASO 5: PERSONAS
-- ============================================================

CREATE TABLE public.personas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_documento public.tipo_documento_identidad NOT NULL DEFAULT 'cedula_ciudadania',
  numero_documento TEXT NOT NULL UNIQUE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  fecha_nacimiento DATE,
  genero public.genero,
  nivel_educativo public.nivel_educativo,
  email TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  contacto_emergencia JSONB DEFAULT '{}'::jsonb,
  firma_storage_path TEXT,
  observaciones TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_personas_documento ON public.personas (numero_documento);
CREATE INDEX idx_personas_nombre ON public.personas USING gin (
  to_tsvector('spanish', nombres || ' ' || apellidos)
);

-- RLS
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen personas"
  ON public.personas FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Admin/global gestionan personas"
  ON public.personas FOR ALL TO authenticated
  USING (public.get_my_rol() IN ('admin', 'global'))
  WITH CHECK (public.get_my_rol() IN ('admin', 'global'));

-- Trigger: validar contacto de emergencia (INC-004, RN-PER-005)
CREATE OR REPLACE FUNCTION public.validar_contacto_emergencia()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.contacto_emergencia IS NOT NULL 
     AND NEW.contacto_emergencia != '{}'::jsonb THEN
    IF (NEW.contacto_emergencia->>'nombre') IS NULL 
       OR trim(NEW.contacto_emergencia->>'nombre') = '' THEN
      RAISE EXCEPTION 'El contacto de emergencia debe tener un nombre';
    END IF;
    IF (NEW.contacto_emergencia->>'telefono') IS NULL 
       OR trim(NEW.contacto_emergencia->>'telefono') = '' THEN
      RAISE EXCEPTION 'El contacto de emergencia debe tener un teléfono';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_contacto_emergencia
  BEFORE INSERT OR UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.validar_contacto_emergencia();

-- Triggers estándar
CREATE TRIGGER trg_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_personas_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('persona');
