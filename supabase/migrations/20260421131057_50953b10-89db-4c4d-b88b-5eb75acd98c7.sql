-- Alinear RLS de tablas hijas de empresas con el permiso del módulo 'empresas'
-- para que cualquier rol con permiso de editar empresas pueda gestionar
-- contactos y tarifas (no solo admin/superadmin).

-- contactos_empresa
DROP POLICY IF EXISTS "Admin gestiona contactos_empresa" ON public.contactos_empresa;

CREATE POLICY "Usuarios con permiso gestionan contactos_empresa"
ON public.contactos_empresa
FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'empresas', 'editar'))
WITH CHECK (public.has_permission(auth.uid(), 'empresas', 'editar'));

-- tarifas_empresa
DROP POLICY IF EXISTS "Admin gestiona tarifas_empresa" ON public.tarifas_empresa;

CREATE POLICY "Usuarios con permiso gestionan tarifas_empresa"
ON public.tarifas_empresa
FOR ALL
TO authenticated
USING (public.has_permission(auth.uid(), 'empresas', 'editar'))
WITH CHECK (public.has_permission(auth.uid(), 'empresas', 'editar'));