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
  -- Get curso from matricula
  SELECT m.curso_id, m.empresa_nivel_formacion
  INTO _curso_id, _empresa_nivel
  FROM public.matriculas m WHERE m.id = _matricula_id;

  -- If curso exists, get tipo_formacion and nivel_id
  IF _curso_id IS NOT NULL THEN
    SELECT c.tipo_formacion, c.nivel_formacion_id
    INTO _tipo_formacion, _nivel_id
    FROM public.cursos c WHERE c.id = _curso_id;
  END IF;

  -- Fallback: if no nivel from curso, try to resolve from empresa_nivel_formacion
  IF _nivel_id IS NULL AND _empresa_nivel IS NOT NULL AND _empresa_nivel != '' THEN
    SELECT nf.id INTO _nivel_id
    FROM public.niveles_formacion nf
    WHERE nf.id::text = _empresa_nivel
       OR nf.nombre = _empresa_nivel
    LIMIT 1;

    -- Also try to get tipo_formacion from that nivel
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
      -- Legacy formats (have legacy_component_id, empty niveles_asignados) → treat as global
      (f.legacy_component_id IS NOT NULL AND (f.niveles_asignados IS NULL OR f.niveles_asignados = '{}'))
      OR
      -- Normal scope matching
      (f.asignacion_scope = 'nivel_formacion' AND _nivel_id IS NOT NULL AND _nivel_id = ANY(f.niveles_asignados))
      OR
      (f.asignacion_scope = 'tipo_curso' AND _tipo_formacion IS NOT NULL AND _tipo_formacion = ANY(f.tipos_curso))
    );
END;
$function$;