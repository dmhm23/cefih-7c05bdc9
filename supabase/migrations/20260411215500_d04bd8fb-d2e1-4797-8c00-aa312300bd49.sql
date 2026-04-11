
-- Trigger: sync documentos_portal → formato_respuestas
CREATE OR REPLACE FUNCTION public.sync_portal_to_formato_respuestas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _formato_id UUID;
BEGIN
  -- Only act when estado becomes 'completado'
  IF NEW.estado != 'completado' THEN
    RETURN NEW;
  END IF;

  -- Look up formato_id from portal_config_documentos
  SELECT formato_id INTO _formato_id
  FROM public.portal_config_documentos
  WHERE key = NEW.documento_key AND formato_id IS NOT NULL
  LIMIT 1;

  -- If no linked formato, nothing to sync
  IF _formato_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Upsert into formato_respuestas
  INSERT INTO public.formato_respuestas (matricula_id, formato_id, estado, answers, completado_at)
  VALUES (NEW.matricula_id, _formato_id, 'completado', COALESCE(NEW.metadata, '{}'::jsonb), now())
  ON CONFLICT (matricula_id, formato_id)
  DO UPDATE SET
    estado = 'completado',
    answers = COALESCE(EXCLUDED.answers, formato_respuestas.answers),
    completado_at = COALESCE(formato_respuestas.completado_at, now()),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_portal_to_formato_respuestas
AFTER INSERT OR UPDATE ON public.documentos_portal
FOR EACH ROW
EXECUTE FUNCTION public.sync_portal_to_formato_respuestas();

-- Trigger: sync formato_respuestas → documentos_portal
CREATE OR REPLACE FUNCTION public.sync_formato_respuestas_to_portal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _doc_key TEXT;
BEGIN
  -- Only act when estado becomes 'completado'
  IF NEW.estado != 'completado' THEN
    RETURN NEW;
  END IF;

  -- Find the portal document key linked to this formato
  SELECT key INTO _doc_key
  FROM public.portal_config_documentos
  WHERE formato_id = NEW.formato_id
  LIMIT 1;

  -- If no linked portal doc, nothing to sync
  IF _doc_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Upsert into documentos_portal
  INSERT INTO public.documentos_portal (matricula_id, documento_key, estado, metadata, enviado_en)
  VALUES (NEW.matricula_id, _doc_key, 'completado', COALESCE(NEW.answers, '{}'::jsonb), now())
  ON CONFLICT (matricula_id, documento_key)
  DO UPDATE SET
    estado = 'completado',
    metadata = COALESCE(EXCLUDED.metadata, documentos_portal.metadata),
    enviado_en = COALESCE(documentos_portal.enviado_en, now()),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_formato_respuestas_to_portal
AFTER INSERT OR UPDATE ON public.formato_respuestas
FOR EACH ROW
EXECUTE FUNCTION public.sync_formato_respuestas_to_portal();

-- Add unique constraint on formato_respuestas for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'formato_respuestas_matricula_formato_unique'
  ) THEN
    ALTER TABLE public.formato_respuestas
    ADD CONSTRAINT formato_respuestas_matricula_formato_unique UNIQUE (matricula_id, formato_id);
  END IF;
END $$;

-- Add unique constraint on documentos_portal for upsert to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documentos_portal_matricula_key_unique'
  ) THEN
    ALTER TABLE public.documentos_portal
    ADD CONSTRAINT documentos_portal_matricula_key_unique UNIQUE (matricula_id, documento_key);
  END IF;
END $$;

-- Allow anon to read/insert/update formato_respuestas (for portal student writes)
CREATE POLICY "Anon lee formato_respuestas"
ON public.formato_respuestas
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Anon inserta formato_respuestas"
ON public.formato_respuestas
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Anon actualiza formato_respuestas"
ON public.formato_respuestas
FOR UPDATE
TO anon
USING (true);
