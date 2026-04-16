
-- personas: reemplazar política hardcodeada por has_permission
DROP POLICY "Admin gestiona personas" ON public.personas;
CREATE POLICY "Usuarios con permiso gestionan personas"
  ON public.personas FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'personas', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'personas', 'editar'));

-- empresas: reemplazar política hardcodeada por has_permission
DROP POLICY "Admin gestiona empresas" ON public.empresas;
CREATE POLICY "Usuarios con permiso gestionan empresas"
  ON public.empresas FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'empresas', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'empresas', 'editar'));
