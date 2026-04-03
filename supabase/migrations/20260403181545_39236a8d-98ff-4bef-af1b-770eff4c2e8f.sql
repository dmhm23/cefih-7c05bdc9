
-- ==============================================
-- PASO 1: Crear tabla roles
-- ==============================================
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT DEFAULT '',
  es_sistema BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PASO 2: Crear tabla rol_permisos
-- ==============================================
CREATE TABLE public.rol_permisos (
  rol_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  modulo TEXT NOT NULL,
  accion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (rol_id, modulo, accion)
);

ALTER TABLE public.rol_permisos ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- PASO 3: Insertar roles de sistema
-- ==============================================
INSERT INTO public.roles (id, nombre, descripcion, es_sistema) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'superadministrador', 'Acceso total al sistema + gestión de roles y usuarios', TRUE),
  ('a0000000-0000-0000-0000-000000000002', 'administrador', 'Acceso total a módulos operativos', TRUE),
  ('a0000000-0000-0000-0000-000000000003', 'operador', 'Rol configurable con permisos por módulo', FALSE);

-- Insertar permisos completos para administrador (todos los módulos operativos)
INSERT INTO public.rol_permisos (rol_id, modulo, accion) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'dashboard', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'matriculas', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'matriculas', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'matriculas', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'matriculas', 'eliminar'),
  ('a0000000-0000-0000-0000-000000000002', 'cursos', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'cursos', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'cursos', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'cursos', 'eliminar'),
  ('a0000000-0000-0000-0000-000000000002', 'cartera', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'cartera', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'cartera', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'cartera', 'eliminar'),
  ('a0000000-0000-0000-0000-000000000002', 'personal', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'personal', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'personal', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'personal', 'eliminar'),
  ('a0000000-0000-0000-0000-000000000002', 'formatos', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'formatos', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'formatos', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'formatos', 'eliminar'),
  ('a0000000-0000-0000-0000-000000000002', 'niveles', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'niveles', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'niveles', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'niveles', 'eliminar'),
  ('a0000000-0000-0000-0000-000000000002', 'portal_estudiante', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'portal_estudiante', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'personas', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'personas', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'personas', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'personas', 'eliminar'),
  ('a0000000-0000-0000-0000-000000000002', 'empresas', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'empresas', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'empresas', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'empresas', 'eliminar'),
  ('a0000000-0000-0000-0000-000000000002', 'certificacion', 'ver'),
  ('a0000000-0000-0000-0000-000000000002', 'certificacion', 'crear'),
  ('a0000000-0000-0000-0000-000000000002', 'certificacion', 'editar'),
  ('a0000000-0000-0000-0000-000000000002', 'certificacion', 'eliminar');

-- ==============================================
-- PASO 4: Agregar rol_id a perfiles y migrar datos
-- ==============================================
ALTER TABLE public.perfiles ADD COLUMN rol_id UUID REFERENCES public.roles(id);

-- Migrar usuarios existentes
UPDATE public.perfiles SET rol_id = 'a0000000-0000-0000-0000-000000000001' WHERE rol = 'admin';
UPDATE public.perfiles SET rol_id = 'a0000000-0000-0000-0000-000000000002' WHERE rol = 'global';
-- Cualquier otro valor que pudiera existir → administrador por defecto
UPDATE public.perfiles SET rol_id = 'a0000000-0000-0000-0000-000000000002' WHERE rol_id IS NULL;

-- Hacer NOT NULL después de migrar
ALTER TABLE public.perfiles ALTER COLUMN rol_id SET NOT NULL;
ALTER TABLE public.perfiles ALTER COLUMN rol_id SET DEFAULT 'a0000000-0000-0000-0000-000000000002';

-- Eliminar columna vieja
ALTER TABLE public.perfiles DROP COLUMN rol;

-- ==============================================
-- PASO 5: Actualizar get_my_rol() para usar JOIN
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_my_rol()
  RETURNS TEXT
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT r.nombre 
  FROM public.perfiles p
  JOIN public.roles r ON r.id = p.rol_id
  WHERE p.id = auth.uid()
$$;

-- ==============================================
-- PASO 6: Función has_permission
-- ==============================================
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_modulo TEXT, p_accion TEXT)
  RETURNS BOOLEAN
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _rol_nombre TEXT;
  _rol_id UUID;
BEGIN
  SELECT p.rol_id, r.nombre INTO _rol_id, _rol_nombre
  FROM public.perfiles p
  JOIN public.roles r ON r.id = p.rol_id
  WHERE p.id = p_user_id;

  -- Superadministrador tiene TODOS los permisos
  IF _rol_nombre = 'superadministrador' THEN
    RETURN TRUE;
  END IF;

  -- Verificar en rol_permisos
  RETURN EXISTS (
    SELECT 1 FROM public.rol_permisos
    WHERE rol_id = _rol_id
      AND modulo = p_modulo
      AND accion = p_accion
  );
END;
$$;

-- ==============================================
-- PASO 7: Función get_user_permissions
-- ==============================================
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
  RETURNS TABLE(modulo TEXT, accion TEXT)
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  _rol_nombre TEXT;
  _rol_id UUID;
BEGIN
  SELECT p.rol_id, r.nombre INTO _rol_id, _rol_nombre
  FROM public.perfiles p
  JOIN public.roles r ON r.id = p.rol_id
  WHERE p.id = p_user_id;

  -- Superadministrador: retornar todos los permisos posibles
  IF _rol_nombre = 'superadministrador' THEN
    RETURN QUERY
    SELECT m.mod, a.act
    FROM (VALUES 
      ('dashboard'), ('matriculas'), ('cursos'), ('cartera'), ('personal'),
      ('formatos'), ('niveles'), ('portal_estudiante'), ('personas'), ('empresas'), ('certificacion')
    ) AS m(mod)
    CROSS JOIN (VALUES ('ver'), ('crear'), ('editar'), ('eliminar')) AS a(act)
    WHERE NOT (m.mod = 'dashboard' AND a.act != 'ver')
      AND NOT (m.mod = 'portal_estudiante' AND a.act IN ('crear', 'eliminar'));
    RETURN;
  END IF;

  RETURN QUERY
  SELECT rp.modulo, rp.accion
  FROM public.rol_permisos rp
  WHERE rp.rol_id = _rol_id;
END;
$$;

-- ==============================================
-- PASO 8: RLS para roles y rol_permisos
-- ==============================================

-- roles: todos leen, solo superadmin gestiona
CREATE POLICY "Autenticados leen roles"
  ON public.roles FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Superadmin gestiona roles"
  ON public.roles FOR ALL TO authenticated
  USING (get_my_rol() = 'superadministrador')
  WITH CHECK (get_my_rol() = 'superadministrador');

-- rol_permisos: todos leen, solo superadmin gestiona
CREATE POLICY "Autenticados leen rol_permisos"
  ON public.rol_permisos FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Superadmin gestiona rol_permisos"
  ON public.rol_permisos FOR ALL TO authenticated
  USING (get_my_rol() = 'superadministrador')
  WITH CHECK (get_my_rol() = 'superadministrador');

-- ==============================================
-- PASO 9: Actualizar RLS de perfiles (SELECT policy)
-- ==============================================
DROP POLICY IF EXISTS "Usuarios leen su propio perfil" ON public.perfiles;
CREATE POLICY "Usuarios leen su propio perfil"
  ON public.perfiles FOR SELECT TO authenticated
  USING (
    id = auth.uid() 
    OR get_my_rol() = 'superadministrador'
    OR get_my_rol() = 'administrador'
  );

-- ==============================================
-- PASO 10: Actualizar handle_new_user para usar rol_id
-- ==============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombres, rol_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombres', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'rol_id')::UUID,
      'a0000000-0000-0000-0000-000000000002'
    )
  );
  RETURN NEW;
END;
$$;

-- ==============================================
-- PASO 11: Triggers updated_at y auditoría
-- ==============================================
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auditoría (necesitamos agregar 'rol' y 'rol_permiso' al enum)
ALTER TYPE public.tipo_entidad_audit ADD VALUE IF NOT EXISTS 'rol';
ALTER TYPE public.tipo_entidad_audit ADD VALUE IF NOT EXISTS 'rol_permiso';

-- ==============================================
-- PASO 12: Actualizar TODAS las RLS que usan 'admin'/'global'
-- Las políticas existentes usan get_my_rol() = 'admin' o 'global'
-- Ahora los valores son 'superadministrador' y 'administrador'
-- ==============================================

-- Helper: drop + recreate ALL policies pattern for tables using admin/global
DO $$
DECLARE
  _tables TEXT[] := ARRAY[
    'niveles_formacion', 'cursos', 'formato_respuestas', 'plantilla_certificado_versiones',
    'personas', 'plantillas_certificado', 'pagos', 'formatos_formacion', 'cargos',
    'grupo_cartera_matriculas', 'excepciones_certificado', 'tarifas_empresa',
    'personal_adjuntos', 'documentos_portal', 'facturas', 'personal',
    'cursos_fechas_mintrabajo', 'documentos_matricula', 'matriculas',
    'actividades_cartera', 'empresas', 'grupos_cartera', 'versiones_formato',
    'portal_config_documentos', 'responsables_pago', 'factura_matriculas',
    'certificados', 'comentarios'
  ];
  _t TEXT;
  _pol RECORD;
BEGIN
  FOREACH _t IN ARRAY _tables LOOP
    -- Find and drop ALL policies that reference 'admin' or 'global' in their expressions
    FOR _pol IN
      SELECT policyname FROM pg_policies
      WHERE tablename = _t AND schemaname = 'public'
        AND (qual LIKE '%''admin''%' OR qual LIKE '%''global''%'
             OR with_check LIKE '%''admin''%' OR with_check LIKE '%''global''%')
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _t);
      
      -- Recreate with new role names
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated 
         USING (get_my_rol() IN (''superadministrador'', ''administrador''))
         WITH CHECK (get_my_rol() IN (''superadministrador'', ''administrador''))',
        'Admin gestiona ' || _t, _t
      );
    END LOOP;
  END LOOP;
END;
$$;
