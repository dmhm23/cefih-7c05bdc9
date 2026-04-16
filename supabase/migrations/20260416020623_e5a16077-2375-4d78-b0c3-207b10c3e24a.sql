
-- Fix: documentos_matricula - usar has_permission en lugar de roles hardcodeados
DROP POLICY "Admin gestiona documentos_matricula" ON public.documentos_matricula;

CREATE POLICY "Usuarios con permiso gestionan documentos_matricula"
  ON public.documentos_matricula FOR ALL
  TO authenticated
  USING (public.has_permission(auth.uid(), 'matriculas', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'matriculas', 'editar'));

-- Fix: matriculas - usar has_permission en lugar de roles hardcodeados
DROP POLICY "Admin gestiona matriculas" ON public.matriculas;

CREATE POLICY "Usuarios con permiso gestionan matriculas"
  ON public.matriculas FOR ALL
  TO authenticated
  USING (public.has_permission(auth.uid(), 'matriculas', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'matriculas', 'editar'));
