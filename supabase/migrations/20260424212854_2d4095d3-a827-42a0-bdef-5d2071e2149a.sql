-- =========================================================
-- FASE 1: Cascada de firmas server-side
-- =========================================================

CREATE OR REPLACE FUNCTION public.cascade_firma_to_targets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _formato_origen RECORD;
  _bloque JSONB;
  _signature_base64 TEXT;
  _tipo_firmante TEXT;
  _es_origen_bloque BOOLEAN;
  _nivel_id UUID;
  _target RECORD;
  _target_bloques JSONB;
  _target_bloque JSONB;
  _new_answers JSONB;
  _att_firma_mode TEXT;
BEGIN
  -- Evitar recursión: si el trigger se dispara desde dentro de sí mismo, salir
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  -- Solo procesar respuestas completadas
  IF NEW.estado IS DISTINCT FROM 'completado' THEN
    RETURN NEW;
  END IF;

  -- Cargar el formato origen
  SELECT id, bloques, es_origen_firma
  INTO _formato_origen
  FROM public.formatos_formacion
  WHERE id = NEW.formato_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Buscar dentro de los bloques una captura de firma marcada como origen
  _signature_base64 := NULL;
  _tipo_firmante := 'aprendiz';

  FOR _bloque IN SELECT * FROM jsonb_array_elements(COALESCE(_formato_origen.bloques, '[]'::jsonb))
  LOOP
    IF _bloque->>'type' = 'signature_capture' THEN
      -- Determinar si este bloque es origen de firma (default = es_origen_firma del formato)
      _es_origen_bloque := COALESCE(
        (_bloque->'props'->>'esOrigenFirma')::boolean,
        _formato_origen.es_origen_firma,
        FALSE
      );

      IF _es_origen_bloque THEN
        -- Leer el valor de la respuesta para este bloque
        DECLARE
          _val TEXT := NEW.answers->>(_bloque->>'id');
        BEGIN
          IF _val IS NOT NULL AND _val LIKE 'data:image%' THEN
            _signature_base64 := _val;
            _tipo_firmante := COALESCE(_bloque->'props'->>'tipoFirmante', 'aprendiz');
            EXIT; -- nos quedamos con la primera firma origen encontrada
          END IF;
        END;
      END IF;
    END IF;
  END LOOP;

  -- Si no hay firma origen, no hay nada que propagar
  IF _signature_base64 IS NULL THEN
    RETURN NEW;
  END IF;

  -- 1) Persistir la firma en firmas_matricula
  INSERT INTO public.firmas_matricula (
    matricula_id, tipo, firma_base64, formato_origen_id,
    autoriza_reutilizacion, user_agent
  ) VALUES (
    NEW.matricula_id,
    _tipo_firmante::public.tipo_firma_matricula,
    _signature_base64,
    NEW.formato_id,
    TRUE,
    'cascade_firma_to_targets'
  )
  ON CONFLICT (matricula_id, tipo) DO UPDATE SET
    firma_base64 = EXCLUDED.firma_base64,
    formato_origen_id = EXCLUDED.formato_origen_id,
    autoriza_reutilizacion = EXCLUDED.autoriza_reutilizacion,
    updated_at = now();

  -- Resolver nivel de la matrícula (para filtrar formatos destino)
  SELECT nivel_formacion_id INTO _nivel_id
  FROM public.matriculas
  WHERE id = NEW.matricula_id;

  -- 2) Propagar a todos los formatos que escuchen `firma_completada`
  --    (sin filtrar por es_automatico → soluciona el caso "PARTICIPACIÓN PTA - ATS")
  FOR _target IN
    SELECT id, bloques
    FROM public.formatos_formacion
    WHERE activo = TRUE
      AND deleted_at IS NULL
      AND id <> NEW.formato_id
      AND eventos_disparadores @> '["firma_completada"]'::jsonb
      AND (
        niveles_asignados IS NULL
        OR niveles_asignados = '{}'
        OR _nivel_id IS NULL
        OR _nivel_id = ANY(niveles_asignados)
      )
  LOOP
    _target_bloques := COALESCE(_target.bloques, '[]'::jsonb);
    _new_answers := '{}'::jsonb;

    -- Recorrer bloques del destino e inyectar la firma donde corresponda
    FOR _target_bloque IN SELECT * FROM jsonb_array_elements(_target_bloques)
    LOOP
      IF _target_bloque->>'type' = 'signature_capture' THEN
        _new_answers := _new_answers || jsonb_build_object(
          _target_bloque->>'id', _signature_base64
        );
      ELSIF _target_bloque->>'type' = 'attendance_by_day' THEN
        _att_firma_mode := _target_bloque->'props'->>'firmaMode';
        IF _att_firma_mode IN ('reuse_if_available', 'reuse_required') THEN
          _new_answers := _new_answers || jsonb_build_object(
            _target_bloque->>'id',
            jsonb_build_object('firmaHeredada', _signature_base64)
          );
        END IF;
      END IF;
    END LOOP;

    -- Upsert: marcar como completado e inyectar respuestas
    INSERT INTO public.formato_respuestas (
      matricula_id, formato_id, estado, answers, completado_at
    ) VALUES (
      NEW.matricula_id,
      _target.id,
      'completado',
      _new_answers,
      now()
    )
    ON CONFLICT (matricula_id, formato_id) DO UPDATE SET
      estado = 'completado',
      answers = public.formato_respuestas.answers || EXCLUDED.answers,
      completado_at = COALESCE(public.formato_respuestas.completado_at, now()),
      updated_at = now();
  END LOOP;

  RETURN NEW;
END;
$$;

-- Disparador
DROP TRIGGER IF EXISTS trg_cascade_firma ON public.formato_respuestas;
CREATE TRIGGER trg_cascade_firma
AFTER INSERT OR UPDATE OF estado, answers
ON public.formato_respuestas
FOR EACH ROW
EXECUTE FUNCTION public.cascade_firma_to_targets();

-- =========================================================
-- BACKFILL HISTÓRICO
-- Reprocesa todas las respuestas ya completadas de formatos origen,
-- para restaurar firmas perdidas y formatos pendientes existentes.
-- =========================================================
DO $backfill$
DECLARE
  _r RECORD;
BEGIN
  FOR _r IN
    SELECT fr.id
    FROM public.formato_respuestas fr
    JOIN public.formatos_formacion ff ON ff.id = fr.formato_id
    WHERE fr.estado = 'completado'
      AND ff.deleted_at IS NULL
      AND (
        ff.es_origen_firma = TRUE
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(ff.bloques, '[]'::jsonb)) b
          WHERE b->>'type' = 'signature_capture'
            AND COALESCE((b->'props'->>'esOrigenFirma')::boolean, ff.es_origen_firma, FALSE) = TRUE
        )
      )
  LOOP
    -- Re-tocar la fila para disparar el trigger sin cambiar datos reales
    UPDATE public.formato_respuestas
    SET updated_at = now()
    WHERE id = _r.id;
  END LOOP;
END;
$backfill$;