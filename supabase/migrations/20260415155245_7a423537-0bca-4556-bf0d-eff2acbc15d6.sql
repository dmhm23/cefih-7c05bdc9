
-- 1. formatos_formacion: anon solo lee formatos visibles en portal
CREATE POLICY "Anon lee formatos visibles en portal"
ON public.formatos_formacion FOR SELECT
TO anon
USING (
  activo = true
  AND deleted_at IS NULL
  AND visible_en_portal_estudiante = true
);

-- 2. matriculas: anon lee matrículas activas (para resolver contexto del aprendiz)
CREATE POLICY "Anon lee matriculas activas"
ON public.matriculas FOR SELECT
TO anon
USING (
  activo = true
  AND deleted_at IS NULL
);

-- 3. personas: anon lee personas activas (join desde matriculas)
CREATE POLICY "Anon lee personas activas"
ON public.personas FOR SELECT
TO anon
USING (
  activo = true
  AND deleted_at IS NULL
);

-- 4. cursos: anon lee cursos no eliminados (join desde matriculas)
CREATE POLICY "Anon lee cursos activos"
ON public.cursos FOR SELECT
TO anon
USING (
  deleted_at IS NULL
);
