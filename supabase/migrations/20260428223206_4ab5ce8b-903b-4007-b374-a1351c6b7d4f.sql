-- =====================================================================
-- BACKUP: snapshot de codigo_estudiante actual antes de tocar nada
-- =====================================================================
CREATE TABLE IF NOT EXISTS public._backup_codigos_estudiante (
  matricula_id UUID PRIMARY KEY,
  codigo_estudiante_old TEXT,
  curso_id_old UUID,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public._backup_codigos_estudiante (matricula_id, codigo_estudiante_old, curso_id_old)
SELECT id, codigo_estudiante, curso_id
FROM public.matriculas
WHERE deleted_at IS NULL
ON CONFLICT (matricula_id) DO NOTHING;

-- =====================================================================
-- NUEVA FUNCIÓN: recalcular_codigos_curso con lock + dos fases
-- =====================================================================
CREATE OR REPLACE FUNCTION public.recalcular_codigos_curso(_curso_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _curso RECORD;
  _config JSONB;
  _mat RECORD;
  _idx INTEGER := 0;
  _nuevo TEXT;
BEGIN
  IF _curso_id IS NULL THEN RETURN; END IF;

  -- Serialización por curso: dos recálculos del mismo curso no corren en paralelo
  PERFORM pg_advisory_xact_lock(hashtext('codigo_curso:' || _curso_id::text));

  SELECT c.id, c.nombre, c.fecha_inicio, c.nivel_formacion_id
    INTO _curso
  FROM public.cursos c
  WHERE c.id = _curso_id AND c.deleted_at IS NULL;

  IF NOT FOUND THEN RETURN; END IF;

  -- Resolver config del nivel
  IF _curso.nivel_formacion_id IS NOT NULL THEN
    SELECT nf.config_codigo_estudiante INTO _config
    FROM public.niveles_formacion nf
    WHERE nf.id = _curso.nivel_formacion_id;
  END IF;

  -- FASE 1: nulificar todos los códigos del curso (los saca del índice único parcial)
  UPDATE public.matriculas
  SET codigo_estudiante = NULL
  WHERE curso_id = _curso_id
    AND deleted_at IS NULL
    AND activo = TRUE
    AND codigo_estudiante IS NOT NULL;

  -- FASE 2: reasignar códigos en orden estable
  FOR _mat IN
    SELECT id
    FROM public.matriculas
    WHERE curso_id = _curso_id
      AND deleted_at IS NULL
      AND activo = TRUE
    ORDER BY created_at ASC, id ASC
  LOOP
    _idx := _idx + 1;
    _nuevo := public.calcular_codigo_estudiante(_config, _curso.nombre, _curso.fecha_inicio, _idx);

    IF _nuevo IS NOT NULL THEN
      UPDATE public.matriculas
      SET codigo_estudiante = _nuevo,
          updated_at = now()
      WHERE id = _mat.id;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================================
-- TRIGGERS: reactivar sincronización automática
-- =====================================================================
DROP TRIGGER IF EXISTS trg_matriculas_resync_codigo_aiu ON public.matriculas;
CREATE TRIGGER trg_matriculas_resync_codigo_aiu
AFTER INSERT OR DELETE ON public.matriculas
FOR EACH ROW
EXECUTE FUNCTION public.trg_matriculas_resync_codigo();

DROP TRIGGER IF EXISTS trg_matriculas_resync_codigo_au ON public.matriculas;
CREATE TRIGGER trg_matriculas_resync_codigo_au
AFTER UPDATE OF curso_id, activo, deleted_at ON public.matriculas
FOR EACH ROW
WHEN (
  OLD.curso_id IS DISTINCT FROM NEW.curso_id
  OR OLD.activo IS DISTINCT FROM NEW.activo
  OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at
)
EXECUTE FUNCTION public.trg_matriculas_resync_codigo();

DROP TRIGGER IF EXISTS trg_cursos_resync_codigos_au ON public.cursos;
CREATE TRIGGER trg_cursos_resync_codigos_au
AFTER UPDATE OF nombre, fecha_inicio, nivel_formacion_id ON public.cursos
FOR EACH ROW
WHEN (
  OLD.nombre IS DISTINCT FROM NEW.nombre
  OR OLD.fecha_inicio IS DISTINCT FROM NEW.fecha_inicio
  OR OLD.nivel_formacion_id IS DISTINCT FROM NEW.nivel_formacion_id
)
EXECUTE FUNCTION public.trg_cursos_resync_codigos();

DROP TRIGGER IF EXISTS trg_niveles_resync_codigos_au ON public.niveles_formacion;
CREATE TRIGGER trg_niveles_resync_codigos_au
AFTER UPDATE OF config_codigo_estudiante ON public.niveles_formacion
FOR EACH ROW
WHEN (OLD.config_codigo_estudiante IS DISTINCT FROM NEW.config_codigo_estudiante)
EXECUTE FUNCTION public.trg_niveles_resync_codigos();

-- =====================================================================
-- BACKFILL: recalcular todos los cursos con matrículas activas
-- (corrige los 65 NULL y el código heredado huérfano)
-- =====================================================================
DO $$
DECLARE
  _curso_id UUID;
BEGIN
  FOR _curso_id IN
    SELECT DISTINCT curso_id
    FROM public.matriculas
    WHERE curso_id IS NOT NULL
      AND deleted_at IS NULL
      AND activo = TRUE
  LOOP
    PERFORM public.recalcular_codigos_curso(_curso_id);
  END LOOP;
END $$;