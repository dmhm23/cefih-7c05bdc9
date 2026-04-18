-- Reemplazo de versiones_formato con la estructura correcta para el motor de bloques
CREATE TABLE IF NOT EXISTS public.formato_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formato_id UUID NOT NULL REFERENCES public.formatos_formacion(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  bloques JSONB NOT NULL DEFAULT '[]'::jsonb,
  encabezado_config JSONB,
  modificado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (formato_id, version)
);

CREATE INDEX IF NOT EXISTS idx_formato_versiones_formato ON public.formato_versiones(formato_id);

ALTER TABLE public.formato_versiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen formato_versiones"
ON public.formato_versiones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestiona formato_versiones"
ON public.formato_versiones FOR ALL TO authenticated
USING (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]))
WITH CHECK (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]));