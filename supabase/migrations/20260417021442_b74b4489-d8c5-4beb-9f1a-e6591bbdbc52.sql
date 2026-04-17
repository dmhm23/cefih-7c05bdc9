-- Phase 2: Endurecer triggers de sincronización portal ↔ formato_respuestas
-- y agregar UNIQUE constraint sobre portal_config_documentos.formato_id
-- para garantizar que un formato no pueda registrarse dos veces en el catálogo del portal.

-- 2.1 Trigger: formato_respuestas → documentos_portal
-- Cambio clave: además de filtrar por formato_id, exigimos que key = formato_id::text
-- para evitar que entradas legacy (info_aprendiz / evaluacion) sean alcanzadas por error.
CREATE OR REPLACE FUNCTION public.sync_formato_respuestas_to_portal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _doc_key TEXT;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NEW.estado != 'completado' THEN RETURN NEW; END IF;

  -- Match estricto: solo entradas del catálogo cuya key sea exactamente el UUID del formato
  SELECT key INTO _doc_key
  FROM public.portal_config_documentos
  WHERE formato_id = NEW.formato_id
    AND key = NEW.formato_id::text
  LIMIT 1;

  IF _doc_key IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.documentos_portal (matricula_id, documento_key, estado, metadata, enviado_en)
  VALUES (NEW.matricula_id, _doc_key, 'completado', COALESCE(NEW.answers, '{}'::jsonb), now())
  ON CONFLICT (matricula_id, documento_key)
  DO UPDATE SET estado = 'completado',
    metadata = COALESCE(EXCLUDED.metadata, documentos_portal.metadata),
    enviado_en = COALESCE(documentos_portal.enviado_en, now()),
    updated_at = now();
  RETURN NEW;
END; $function$;

-- 2.2 Trigger: documentos_portal → formato_respuestas
-- Cambio clave: exigimos que documento_key sea UUID válido del formato_id que apunta.
CREATE OR REPLACE FUNCTION public.sync_portal_to_formato_respuestas()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _formato_id UUID;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NEW; END IF;
  IF NEW.estado != 'completado' THEN RETURN NEW; END IF;

  -- Match estricto: solo entradas del catálogo cuya key sea exactamente el UUID del formato_id
  SELECT formato_id INTO _formato_id
  FROM public.portal_config_documentos
  WHERE key = NEW.documento_key
    AND formato_id IS NOT NULL
    AND key = formato_id::text
  LIMIT 1;

  IF _formato_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.formato_respuestas (matricula_id, formato_id, estado, answers, completado_at)
  VALUES (NEW.matricula_id, _formato_id, 'completado', COALESCE(NEW.metadata, '{}'::jsonb), now())
  ON CONFLICT (matricula_id, formato_id)
  DO UPDATE SET estado = 'completado',
    answers = COALESCE(EXCLUDED.answers, formato_respuestas.answers),
    completado_at = COALESCE(formato_respuestas.completado_at, now()),
    updated_at = now();
  RETURN NEW;
END; $function$;

-- 2.3 UNIQUE constraint: un formato solo puede estar en el catálogo del portal una vez.
-- Permite múltiples filas con formato_id NULL (entradas legacy info_aprendiz / evaluacion).
CREATE UNIQUE INDEX IF NOT EXISTS portal_config_documentos_formato_id_unique
  ON public.portal_config_documentos (formato_id)
  WHERE formato_id IS NOT NULL;