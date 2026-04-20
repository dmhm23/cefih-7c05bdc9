-- 1) Reescribir login_portal_estudiante
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

  -- 3) Sin matrícula con nivel: distinguir si tiene matrícula sin nivel o no tiene ninguna
  IF EXISTS (
    SELECT 1 FROM public.matriculas m
    WHERE m.persona_id = _persona_id AND m.deleted_at IS NULL AND m.activo = TRUE
  ) THEN
    resultado := 'sin_matricula';
  ELSE
    resultado := 'sin_matricula';
  END IF;

  RETURN NEXT;
  RETURN;
END;
$function$;

-- 2) Reescribir get_documentos_portal: nivel desde matrícula con fallback al curso
CREATE OR REPLACE FUNCTION public.get_documentos_portal(p_matricula_id uuid)
 RETURNS TABLE(documento_key text, tipo tipo_doc_portal, label text, descripcion text, icono text, orden integer, obligatorio boolean, depende_de text[], estado estado_doc_portal, enviado_en timestamp with time zone, firma_data text, metadata jsonb, intentos jsonb, formato_id uuid)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _nivel_formacion_id UUID;
  _rec RECORD;
  _dep_key TEXT;
  _dep_completada BOOLEAN;
BEGIN
  -- Resolver nivel: matrícula manda, curso es fallback
  SELECT COALESCE(m.nivel_formacion_id, c.nivel_formacion_id)
  INTO _nivel_formacion_id
  FROM public.matriculas m
  LEFT JOIN public.cursos c ON c.id = m.curso_id
  WHERE m.id = p_matricula_id;

  FOR _rec IN
    SELECT
      cfg.key,
      cfg.tipo,
      cfg.label,
      cfg.descripcion,
      cfg.icono,
      cfg.orden,
      cfg.obligatorio,
      cfg.depende_de,
      cfg.niveles_habilitados,
      cfg.formato_id AS config_formato_id,
      dp.estado AS doc_estado,
      dp.enviado_en,
      dp.firma_data,
      dp.metadata,
      dp.intentos
    FROM public.portal_config_documentos cfg
    LEFT JOIN public.documentos_portal dp ON dp.matricula_id = p_matricula_id AND dp.documento_key = cfg.key
    WHERE cfg.activo = TRUE
      AND (
        cfg.niveles_habilitados = '{}'
        OR (_nivel_formacion_id IS NOT NULL AND _nivel_formacion_id = ANY(cfg.niveles_habilitados))
      )
    ORDER BY cfg.orden
  LOOP
    documento_key := _rec.key;
    tipo := _rec.tipo;
    label := _rec.label;
    descripcion := _rec.descripcion;
    icono := _rec.icono;
    orden := _rec.orden;
    obligatorio := _rec.obligatorio;
    depende_de := _rec.depende_de;
    firma_data := _rec.firma_data;
    metadata := COALESCE(_rec.metadata, '{}'::JSONB);
    intentos := COALESCE(_rec.intentos, '[]'::JSONB);
    enviado_en := _rec.enviado_en;
    formato_id := _rec.config_formato_id;

    IF _rec.doc_estado = 'completado' THEN
      estado := 'completado';
    ELSE
      estado := 'pendiente';
      IF array_length(_rec.depende_de, 1) > 0 THEN
        FOREACH _dep_key IN ARRAY _rec.depende_de LOOP
          SELECT (dp2.estado = 'completado') INTO _dep_completada
          FROM public.documentos_portal dp2
          WHERE dp2.matricula_id = p_matricula_id AND dp2.documento_key = _dep_key;

          IF NOT COALESCE(_dep_completada, FALSE) THEN
            estado := 'bloqueado';
            EXIT;
          END IF;
        END LOOP;
      END IF;
    END IF;

    RETURN NEXT;
  END LOOP;
END;
$function$;