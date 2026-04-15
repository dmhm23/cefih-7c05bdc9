
DROP FUNCTION IF EXISTS public.login_portal_estudiante(text);

CREATE OR REPLACE FUNCTION public.login_portal_estudiante(p_cedula text)
 RETURNS TABLE(matricula_id uuid, persona_id uuid, curso_id uuid, persona_nombres text, persona_apellidos text, persona_numero_documento text, curso_nombre text, curso_tipo_formacion tipo_formacion, portal_habilitado boolean, resultado text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _persona_id UUID;
  _found RECORD;
BEGIN
  -- 1) Check if persona exists
  SELECT p.id INTO _persona_id
  FROM public.personas p
  WHERE p.numero_documento = p_cedula AND p.deleted_at IS NULL
  LIMIT 1;

  IF _persona_id IS NULL THEN
    resultado := 'persona_no_encontrada';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 2) Try to find a valid matricula with active course
  SELECT
    m.id AS m_id,
    p.id AS p_id,
    c.id AS c_id,
    p.nombres AS p_nombres,
    p.apellidos AS p_apellidos,
    p.numero_documento AS p_doc,
    c.nombre AS c_nombre,
    c.tipo_formacion AS c_tipo,
    COALESCE((m.portal_estudiante->>'habilitado')::BOOLEAN, TRUE) AS p_habilitado
  INTO _found
  FROM public.matriculas m
  JOIN public.personas p ON p.id = m.persona_id
  JOIN public.cursos c ON c.id = m.curso_id
  WHERE m.persona_id = _persona_id
    AND m.deleted_at IS NULL
    AND m.activo = TRUE
    AND c.estado NOT IN ('cerrado', 'cancelado')
  ORDER BY c.fecha_inicio DESC NULLS LAST
  LIMIT 1;

  IF _found IS NOT NULL THEN
    matricula_id := _found.m_id;
    persona_id := _found.p_id;
    curso_id := _found.c_id;
    persona_nombres := _found.p_nombres;
    persona_apellidos := _found.p_apellidos;
    persona_numero_documento := _found.p_doc;
    curso_nombre := _found.c_nombre;
    curso_tipo_formacion := _found.c_tipo;
    portal_habilitado := _found.p_habilitado;
    resultado := CASE WHEN _found.p_habilitado THEN 'ok' ELSE 'portal_deshabilitado' END;
    RETURN NEXT;
    RETURN;
  END IF;

  -- 3) Distinguish: no course assigned vs all courses closed
  IF EXISTS (
    SELECT 1 FROM public.matriculas m
    WHERE m.persona_id = _persona_id AND m.deleted_at IS NULL AND m.activo = TRUE AND m.curso_id IS NULL
  ) THEN
    resultado := 'sin_curso';
  ELSIF EXISTS (
    SELECT 1 FROM public.matriculas m
    JOIN public.cursos c ON c.id = m.curso_id
    WHERE m.persona_id = _persona_id AND m.deleted_at IS NULL AND m.activo = TRUE
      AND c.estado IN ('cerrado', 'cancelado')
  ) THEN
    resultado := 'curso_cerrado';
  ELSE
    resultado := 'sin_curso';
  END IF;

  RETURN NEXT;
  RETURN;
END;
$function$;
