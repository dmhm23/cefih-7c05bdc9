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
  -- 1) ¿Existe la persona?
  SELECT p.id INTO _persona_id
  FROM public.personas p
  WHERE p.numero_documento = p_cedula AND p.deleted_at IS NULL
  LIMIT 1;

  IF _persona_id IS NULL THEN
    resultado := 'persona_no_encontrada';
    RETURN NEXT;
    RETURN;
  END IF;

  -- 2) Buscar la mejor matrícula con nivel asignado (fuente de verdad)
  --    Prioridad:
  --      1. Matrícula con nivel + curso programado/en_curso
  --      2. Matrícula con nivel sin curso
  --      3. Matrícula con nivel + curso cerrado/cancelado
  SELECT
    m.id AS m_id,
    p.id AS p_id,
    c.id AS c_id,
    p.nombres AS p_nombres,
    p.apellidos AS p_apellidos,
    p.numero_documento AS p_doc,
    COALESCE(c.nombre, nf.nombre, 'Portal del Estudiante') AS c_nombre,
    COALESCE(nf.tipo_formacion, c.tipo_formacion) AS c_tipo,
    COALESCE((m.portal_estudiante->>'habilitado')::BOOLEAN, TRUE) AS p_habilitado,
    CASE
      WHEN c.id IS NOT NULL AND c.estado IN ('programado', 'en_curso') THEN 1
      WHEN c.id IS NULL THEN 2
      WHEN c.id IS NOT NULL AND c.estado IN ('cerrado', 'cancelado') THEN 3
      ELSE 4
    END AS prioridad
  INTO _found
  FROM public.matriculas m
  JOIN public.personas p ON p.id = m.persona_id
  LEFT JOIN public.cursos c ON c.id = m.curso_id AND c.deleted_at IS NULL
  LEFT JOIN public.niveles_formacion nf ON nf.id = m.nivel_formacion_id AND nf.deleted_at IS NULL
  WHERE m.persona_id = _persona_id
    AND m.deleted_at IS NULL
    AND m.activo = TRUE
    AND m.nivel_formacion_id IS NOT NULL
  ORDER BY prioridad ASC, c.fecha_inicio DESC NULLS LAST, m.created_at DESC
  LIMIT 1;

  -- FIX: usar FOUND (booleano de PL/pgSQL) en lugar de "_found IS NOT NULL".
  -- Cuando el LEFT JOIN con cursos no matchea, c.id queda NULL y el chequeo
  -- "_found IS NOT NULL" puede evaluar a FALSE/NULL, descartando filas válidas.
  IF FOUND THEN
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

  -- 3) Sin matrícula con nivel
  resultado := 'sin_matricula';
  RETURN NEXT;
  RETURN;
END;
$function$;