
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
BEGIN
  SELECT m.curso_id INTO _curso_id
  FROM public.matriculas m WHERE m.id = _matricula_id;

  IF _curso_id IS NOT NULL THEN
    SELECT c.tipo_formacion, c.nivel_formacion_id INTO _tipo_formacion, _nivel_id
    FROM public.cursos c WHERE c.id = _curso_id;
  END IF;

  RETURN QUERY
  SELECT f.*
  FROM public.formatos_formacion f
  WHERE f.estado IN ('activo', 'borrador')
    AND f.activo = TRUE
    AND f.deleted_at IS NULL
    AND (
      (f.asignacion_scope = 'nivel_formacion' AND _nivel_id = ANY(f.niveles_asignados))
      OR
      (f.asignacion_scope = 'tipo_curso' AND _tipo_formacion = ANY(f.tipos_curso))
    );
END;
$function$;
