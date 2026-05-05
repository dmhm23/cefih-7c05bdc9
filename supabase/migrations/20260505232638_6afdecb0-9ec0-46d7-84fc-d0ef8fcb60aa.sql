
-- 1) Tabla catalogo_opciones
CREATE TABLE public.catalogo_opciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo text NOT NULL CHECK (catalogo IN ('arl','sector_economico')),
  value text NOT NULL,
  label text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  es_base boolean NOT NULL DEFAULT false,
  orden int NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (catalogo, value)
);

ALTER TABLE public.catalogo_opciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen catalogo_opciones"
  ON public.catalogo_opciones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestiona catalogo_opciones"
  ON public.catalogo_opciones FOR ALL TO authenticated
  USING (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]))
  WITH CHECK (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]));

CREATE TRIGGER trg_catalogo_opciones_updated_at
  BEFORE UPDATE ON public.catalogo_opciones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2) Seed ARL
INSERT INTO public.catalogo_opciones (catalogo, value, label, es_base, orden) VALUES
  ('arl','sura_arl','ARL Sura', true, 10),
  ('arl','positiva','Positiva Compañía de Seguros S.A.', true, 20),
  ('arl','axa_colpatria','Axa Colpatria Seguros S.A.', true, 30),
  ('arl','colmena','Colmena Seguros S.A.', true, 40),
  ('arl','aurora','Compañía de Seguros de Vida Aurora S.A.', true, 50),
  ('arl','bolivar','Seguros Bolívar S.A.', true, 60),
  ('arl','equidad','La Equidad Seguros Generales Organismo Cooperativo', true, 70),
  ('arl','alfa','Seguros Alfa', true, 80),
  ('arl','suramericana','Seguros Generales Suramericana S.A.', true, 90),
  ('arl','liberty','Liberty Seguros de Vida', true, 100),
  ('arl','otra_arl','Otra', true, 9999);

-- 3) Seed Sector económico
INSERT INTO public.catalogo_opciones (catalogo, value, label, es_base, orden) VALUES
  ('sector_economico','construccion','Construcción', true, 10),
  ('sector_economico','infraestructura_vial','Infraestructura vial y transporte', true, 20),
  ('sector_economico','energia_electrica','Energía eléctrica', true, 30),
  ('sector_economico','telecomunicaciones','Telecomunicaciones', true, 40),
  ('sector_economico','petroleo_gas_mineria','Petróleo, gas y minería', true, 50),
  ('sector_economico','industria_manufacturera','Industria manufacturera', true, 60),
  ('sector_economico','mantenimiento_industrial','Mantenimiento industrial', true, 70),
  ('sector_economico','servicios_publicos','Servicios públicos', true, 80),
  ('sector_economico','logistica_almacenamiento','Logística y almacenamiento', true, 90),
  ('sector_economico','limpieza_aseo','Limpieza y aseo especializado', true, 100),
  ('sector_economico','publicidad_exterior','Publicidad exterior', true, 110),
  ('sector_economico','agricultura_tecnificada','Agricultura tecnificada', true, 120),
  ('sector_economico','sector_forestal','Sector forestal', true, 130),
  ('sector_economico','aeronautica','Aeronáutica', true, 140),
  ('sector_economico','naval_portuario','Sector naval y portuario', true, 150),
  ('sector_economico','eventos_espectaculos','Eventos y espectáculos', true, 160),
  ('sector_economico','educacion_formacion','Educación y formación técnica', true, 170),
  ('sector_economico','salud_investigacion','Salud e investigación', true, 180),
  ('sector_economico','bienes_raices','Bienes raíces y administración de propiedades', true, 190),
  ('sector_economico','energias_renovables','Energías renovables', true, 200),
  ('sector_economico','otro_sector','Otro', true, 9999);

-- 4) Migrar columnas empresas: enum -> text
ALTER TABLE public.empresas ALTER COLUMN arl TYPE text USING arl::text;
ALTER TABLE public.empresas ALTER COLUMN sector_economico TYPE text USING sector_economico::text;
