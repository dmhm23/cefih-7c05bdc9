
-- 1. Remove legacy_component_id from the 4 legacy formats
UPDATE public.formatos_formacion
SET legacy_component_id = NULL
WHERE legacy_component_id IS NOT NULL;

-- 2. Link portal_config_documentos with formato_id
UPDATE public.portal_config_documentos
SET formato_id = 'a0000000-0000-4000-8000-000000000001'
WHERE key = 'info_aprendiz';

UPDATE public.portal_config_documentos
SET formato_id = 'a0000000-0000-4000-8000-000000000004'
WHERE key = 'evaluacion';

-- 3. Update get_formatos_for_matricula: treat formats with empty niveles_asignados as global
CREATE OR REPLACE FUNCTION public.get_formatos_for_matricula(_matricula_id uuid)
 RETURNS SETOF formatos_formacion
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _curso_id UUID;
  _tipo_formacion public.tipo_formacion;
  _nivel_id UUID;
  _empresa_nivel TEXT;
BEGIN
  SELECT m.curso_id, m.empresa_nivel_formacion
  INTO _curso_id, _empresa_nivel
  FROM public.matriculas m WHERE m.id = _matricula_id;

  IF _curso_id IS NOT NULL THEN
    SELECT c.tipo_formacion, c.nivel_formacion_id
    INTO _tipo_formacion, _nivel_id
    FROM public.cursos c WHERE c.id = _curso_id;
  END IF;

  IF _nivel_id IS NULL AND _empresa_nivel IS NOT NULL AND _empresa_nivel != '' THEN
    SELECT nf.id INTO _nivel_id
    FROM public.niveles_formacion nf
    WHERE nf.id::text = _empresa_nivel
       OR nf.nombre = _empresa_nivel
    LIMIT 1;

    IF _nivel_id IS NOT NULL AND _tipo_formacion IS NULL THEN
      SELECT nf.tipo_formacion INTO _tipo_formacion
      FROM public.niveles_formacion nf WHERE nf.id = _nivel_id;
    END IF;
  END IF;

  RETURN QUERY
  SELECT f.*
  FROM public.formatos_formacion f
  WHERE f.estado IN ('activo', 'borrador')
    AND f.activo = TRUE
    AND f.deleted_at IS NULL
    AND f.visible_en_matricula = TRUE
    AND (
      -- Global: formats with no specific assignment (empty or null niveles_asignados and no tipos_curso)
      (
        (f.niveles_asignados IS NULL OR f.niveles_asignados = '{}')
        AND (f.tipos_curso IS NULL OR f.tipos_curso = '{}')
      )
      OR
      -- Nivel scope
      (f.asignacion_scope = 'nivel_formacion' AND _nivel_id IS NOT NULL AND _nivel_id = ANY(f.niveles_asignados))
      OR
      -- Tipo curso scope
      (f.asignacion_scope = 'tipo_curso' AND _tipo_formacion IS NOT NULL AND _tipo_formacion = ANY(f.tipos_curso))
    );
END;
$function$;
