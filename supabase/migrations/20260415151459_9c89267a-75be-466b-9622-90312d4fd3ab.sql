
CREATE OR REPLACE FUNCTION public.login_portal_estudiante(p_cedula text)
 RETURNS TABLE(matricula_id uuid, persona_id uuid, curso_id uuid, persona_nombres text, persona_apellidos text, persona_numero_documento text, curso_nombre text, curso_tipo_formacion tipo_formacion, portal_habilitado boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS matricula_id,
    p.id AS persona_id,
    c.id AS curso_id,
    p.nombres AS persona_nombres,
    p.apellidos AS persona_apellidos,
    p.numero_documento AS persona_numero_documento,
    c.nombre AS curso_nombre,
    c.tipo_formacion AS curso_tipo_formacion,
    COALESCE((m.portal_estudiante->>'habilitado')::BOOLEAN, TRUE) AS portal_habilitado
  FROM public.matriculas m
  JOIN public.personas p ON p.id = m.persona_id
  JOIN public.cursos c ON c.id = m.curso_id
  WHERE p.numero_documento = p_cedula
    AND m.deleted_at IS NULL
    AND m.activo = TRUE
    AND c.estado NOT IN ('cerrado', 'cancelado')
  ORDER BY c.fecha_inicio DESC NULLS LAST
  LIMIT 1;
END;
$function$;
