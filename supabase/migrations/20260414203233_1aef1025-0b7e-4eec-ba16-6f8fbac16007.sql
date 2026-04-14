DROP FUNCTION IF EXISTS public.get_documentos_portal(uuid);

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
  SELECT c.nivel_formacion_id INTO _nivel_formacion_id
  FROM public.matriculas m
  JOIN public.cursos c ON c.id = m.curso_id
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
        OR _nivel_formacion_id = ANY(cfg.niveles_habilitados)
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