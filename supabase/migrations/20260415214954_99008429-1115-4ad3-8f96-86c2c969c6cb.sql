-- Fix sync_portal_to_formato_respuestas: guard against recursive calls
CREATE OR REPLACE FUNCTION public.sync_portal_to_formato_respuestas()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _formato_id UUID;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NEW.estado != 'completado' THEN RETURN NEW; END IF;

  SELECT formato_id INTO _formato_id
  FROM public.portal_config_documentos
  WHERE key = NEW.documento_key AND formato_id IS NOT NULL LIMIT 1;

  IF _formato_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.formato_respuestas (matricula_id, formato_id, estado, answers, completado_at)
  VALUES (NEW.matricula_id, _formato_id, 'completado', COALESCE(NEW.metadata, '{}'::jsonb), now())
  ON CONFLICT (matricula_id, formato_id)
  DO UPDATE SET estado = 'completado',
    answers = COALESCE(EXCLUDED.answers, formato_respuestas.answers),
    completado_at = COALESCE(formato_respuestas.completado_at, now()),
    updated_at = now();
  RETURN NEW;
END; $$;

-- Fix sync_formato_respuestas_to_portal: same guard
CREATE OR REPLACE FUNCTION public.sync_formato_respuestas_to_portal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _doc_key TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NEW.estado != 'completado' THEN RETURN NEW; END IF;

  SELECT key INTO _doc_key
  FROM public.portal_config_documentos
  WHERE formato_id = NEW.formato_id LIMIT 1;

  IF _doc_key IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.documentos_portal (matricula_id, documento_key, estado, metadata, enviado_en)
  VALUES (NEW.matricula_id, _doc_key, 'completado', COALESCE(NEW.answers, '{}'::jsonb), now())
  ON CONFLICT (matricula_id, documento_key)
  DO UPDATE SET estado = 'completado',
    metadata = COALESCE(EXCLUDED.metadata, documentos_portal.metadata),
    enviado_en = COALESCE(documentos_portal.enviado_en, now()),
    updated_at = now();
  RETURN NEW;
END; $$;