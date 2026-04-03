
-- Tabla perfiles
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombres TEXT,
  rol TEXT NOT NULL DEFAULT 'global',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Funcion auxiliar para obtener rol (SECURITY DEFINER, evita recursion RLS)
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid()
$$;

-- RLS: SELECT - admin ve todo, usuario ve solo su perfil
CREATE POLICY "Usuarios leen su propio perfil"
  ON public.perfiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.get_my_rol() = 'admin');

-- RLS: INSERT bloqueado para cliente (solo trigger con service role)
CREATE POLICY "Insert bloqueado para cliente"
  ON public.perfiles FOR INSERT TO authenticated
  WITH CHECK (false);

-- RLS: UPDATE bloqueado
CREATE POLICY "Update bloqueado"
  ON public.perfiles FOR UPDATE TO authenticated
  USING (false);

-- RLS: DELETE bloqueado
CREATE POLICY "Delete bloqueado"
  ON public.perfiles FOR DELETE TO authenticated
  USING (false);

-- Trigger: crear perfil automaticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombres, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombres', ''),
    'global'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
