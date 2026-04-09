
CREATE TABLE public.contactos_empresa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  telefono TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  es_principal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contactos_empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gestiona contactos_empresa" ON public.contactos_empresa
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['superadministrador','administrador']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['superadministrador','administrador']));

CREATE POLICY "Autenticados leen contactos_empresa" ON public.contactos_empresa
  FOR SELECT TO authenticated USING (true);

-- Migrar datos existentes de campos legacy
INSERT INTO public.contactos_empresa (empresa_id, nombre, telefono, email, es_principal)
SELECT id, persona_contacto, telefono_contacto, email_contacto, true
FROM public.empresas
WHERE deleted_at IS NULL
  AND (persona_contacto != '' OR email_contacto != '' OR telefono_contacto != '');
