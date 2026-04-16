DROP POLICY "Admin gestiona cursos" ON public.cursos;

CREATE POLICY "Usuarios con permiso gestionan cursos"
  ON public.cursos FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'cursos', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'cursos', 'editar'));