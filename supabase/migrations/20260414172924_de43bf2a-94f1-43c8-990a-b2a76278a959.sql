
-- Function: auto-generate formato_respuestas when a matricula is assigned to a curso
CREATE OR REPLACE FUNCTION public.autogenerar_formato_respuestas()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _formato RECORD;
BEGIN
  -- Only trigger when curso_id changes (assigned or re-assigned)
  IF NEW.curso_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.curso_id IS NOT DISTINCT FROM NEW.curso_id THEN
    RETURN NEW;
  END IF;

  -- Find all active automatic formats that match this matricula's nivel
  FOR _formato IN
    SELECT f.id
    FROM public.formatos_formacion f
    WHERE f.activo = TRUE
      AND f.deleted_at IS NULL
      AND f.es_automatico = TRUE
      AND f.eventos_disparadores @> '["asignacion_curso"]'::jsonb
      AND (
        f.niveles_asignados IS NULL OR f.niveles_asignados = '{}'
        OR NEW.nivel_formacion_id = ANY(f.niveles_asignados)
      )
  LOOP
    -- Insert only if not already exists
    INSERT INTO public.formato_respuestas (matricula_id, formato_id, estado, answers)
    VALUES (NEW.id, _formato.id, 'pendiente', '{}'::jsonb)
    ON CONFLICT (matricula_id, formato_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger on matriculas for auto-generation
DROP TRIGGER IF EXISTS trg_autogenerar_formatos ON public.matriculas;
CREATE TRIGGER trg_autogenerar_formatos
  AFTER INSERT OR UPDATE OF curso_id ON public.matriculas
  FOR EACH ROW
  EXECUTE FUNCTION public.autogenerar_formato_respuestas();

-- Function: auto-generate formato_respuestas on course close
CREATE OR REPLACE FUNCTION public.autogenerar_formatos_cierre_curso()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _mat RECORD;
  _formato RECORD;
BEGIN
  -- Only trigger when estado changes to 'cerrado'
  IF NEW.estado != 'cerrado' OR OLD.estado = 'cerrado' THEN
    RETURN NEW;
  END IF;

  -- For each matricula in this course
  FOR _mat IN
    SELECT m.id, m.nivel_formacion_id
    FROM public.matriculas m
    WHERE m.curso_id = NEW.id AND m.deleted_at IS NULL AND m.activo = TRUE
  LOOP
    -- Find matching automatic formats triggered by cierre_curso
    FOR _formato IN
      SELECT f.id
      FROM public.formatos_formacion f
      WHERE f.activo = TRUE
        AND f.deleted_at IS NULL
        AND f.es_automatico = TRUE
        AND f.eventos_disparadores @> '["cierre_curso"]'::jsonb
        AND (
          f.niveles_asignados IS NULL OR f.niveles_asignados = '{}'
          OR _mat.nivel_formacion_id = ANY(f.niveles_asignados)
        )
    LOOP
      INSERT INTO public.formato_respuestas (matricula_id, formato_id, estado, answers)
      VALUES (_mat.id, _formato.id, 'pendiente', '{}'::jsonb)
      ON CONFLICT (matricula_id, formato_id) DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_autogenerar_formatos_cierre ON public.cursos;
CREATE TRIGGER trg_autogenerar_formatos_cierre
  AFTER UPDATE OF estado ON public.cursos
  FOR EACH ROW
  EXECUTE FUNCTION public.autogenerar_formatos_cierre_curso();
