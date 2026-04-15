

# Fix: "stack depth limit exceeded" — Recursive trigger loop

## Root Cause

Two database triggers form a circular dependency:

```text
documentos_portal INSERT/UPDATE
  → trg_sync_portal_to_formato_respuestas() → UPSERT formato_respuestas
    → trg_sync_formato_respuestas_to_portal() → UPSERT documentos_portal
      → trg_sync_portal_to_formato_respuestas() → ... (infinite loop)
```

Additionally, `portalDinamicoService.enviarFormatoDinamico` writes to **both** tables explicitly (lines 28-52), making the triggers redundant for the dynamic portal flow and guaranteeing the loop fires.

## Solution

Add a **recursion guard** to both trigger functions using `pg_trigger_depth()`. This is the standard PostgreSQL mechanism — if the trigger is already being called from within another trigger, skip the sync. This ensures:

- When the **client** writes to one table, the trigger syncs to the other (depth=1), but the second trigger does NOT bounce back (depth=2 → skip).
- When the **client** writes to both tables (as `enviarFormatoDinamico` does), neither trigger causes a loop because the direct write already handled it.

### Migration SQL

```sql
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
```

### Files affected

| Resource | Change |
|---|---|
| DB migration | Add `pg_trigger_depth() > 1` guard to both sync functions |
| No frontend changes needed | The service code is correct; the bug is purely in the DB triggers |

