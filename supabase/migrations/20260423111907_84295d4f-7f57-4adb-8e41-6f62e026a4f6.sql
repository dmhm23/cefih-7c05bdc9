-- 1) Columna codigo_estudiante + índice único parcial por curso
ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS codigo_estudiante TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_matriculas_codigo_por_curso
  ON public.matriculas (curso_id, codigo_estudiante)
  WHERE codigo_estudiante IS NOT NULL AND deleted_at IS NULL;

-- 2) Función pura: extraer último segmento numérico del nombre del curso
CREATE OR REPLACE FUNCTION public.extraer_consecutivo_nombre_curso(_nombre TEXT, _sep TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _segs TEXT[];
  _ultimo TEXT;
  _num INTEGER;
BEGIN
  IF _nombre IS NULL OR _nombre = '' THEN RETURN NULL; END IF;

  -- Intentar con el separador del config
  IF _sep IS NOT NULL AND _sep <> '' THEN
    _segs := string_to_array(_nombre, _sep);
    IF array_length(_segs, 1) > 0 THEN
      _ultimo := trim(_segs[array_length(_segs, 1)]);
      BEGIN
        _num := _ultimo::INTEGER;
        RETURN _num;
      EXCEPTION WHEN others THEN
        -- continuar al fallback
      END;
    END IF;
  END IF;

  -- Fallback: separar por guion
  _segs := string_to_array(_nombre, '-');
  IF array_length(_segs, 1) > 0 THEN
    _ultimo := trim(_segs[array_length(_segs, 1)]);
    BEGIN
      _num := _ultimo::INTEGER;
      RETURN _num;
    EXCEPTION WHEN others THEN
      RETURN NULL;
    END;
  END IF;

  RETURN NULL;
END;
$$;

-- 3) Función pura: construir el código de un estudiante
CREATE OR REPLACE FUNCTION public.calcular_codigo_estudiante(
  _config JSONB,
  _nombre_curso TEXT,
  _fecha_inicio DATE,
  _index INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  _sep TEXT;
  _prefijo TEXT;
  _tipo TEXT;
  _long INTEGER;
  _parts TEXT[] := ARRAY[]::TEXT[];
  _consec INTEGER;
BEGIN
  IF _config IS NULL OR COALESCE((_config->>'activo')::BOOLEAN, FALSE) = FALSE THEN
    RETURN NULL;
  END IF;

  _sep := COALESCE(_config->>'separadorCodigo', '-');
  _prefijo := COALESCE(_config->>'prefijoCodigo', '');
  _tipo := COALESCE(_config->>'codigoTipoFormacion', '');
  _long := COALESCE((_config->>'longitudConsecutivoEstudiante')::INTEGER, 4);

  IF _prefijo <> '' THEN _parts := array_append(_parts, _prefijo); END IF;
  IF _tipo <> '' THEN _parts := array_append(_parts, _tipo); END IF;

  IF COALESCE((_config->>'usarAnioCurso')::BOOLEAN, FALSE) AND _fecha_inicio IS NOT NULL THEN
    _parts := array_append(_parts, to_char(_fecha_inicio, 'YY'));
  END IF;

  IF COALESCE((_config->>'usarMesCurso')::BOOLEAN, FALSE) AND _fecha_inicio IS NOT NULL THEN
    _parts := array_append(_parts, to_char(_fecha_inicio, 'MM'));
  END IF;

  IF COALESCE((_config->>'usarConsecutivoCursoMes')::BOOLEAN, FALSE) THEN
    _consec := public.extraer_consecutivo_nombre_curso(_nombre_curso, _sep);
    IF _consec IS NULL THEN _consec := 1; END IF;
    _parts := array_append(_parts, lpad(_consec::TEXT, 2, '0'));
  END IF;

  _parts := array_append(_parts, lpad(_index::TEXT, _long, '0'));

  RETURN array_to_string(_parts, _sep);
END;
$$;

-- 4) Recalculador para todas las matrículas de un curso
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

  -- Iterar matrículas activas del curso en orden estable
  FOR _mat IN
    SELECT id, codigo_estudiante
    FROM public.matriculas
    WHERE curso_id = _curso_id
      AND deleted_at IS NULL
      AND activo = TRUE
    ORDER BY created_at ASC, id ASC
  LOOP
    _idx := _idx + 1;
    _nuevo := public.calcular_codigo_estudiante(_config, _curso.nombre, _curso.fecha_inicio, _idx);

    IF _mat.codigo_estudiante IS DISTINCT FROM _nuevo THEN
      UPDATE public.matriculas
      SET codigo_estudiante = _nuevo,
          updated_at = now()
      WHERE id = _mat.id;
    END IF;
  END LOOP;
END;
$$;

-- 5) Trigger sobre matriculas: recalcular cuando cambia curso_id / activo / deleted_at
CREATE OR REPLACE FUNCTION public.trg_matriculas_resync_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NULL; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.curso_id IS NOT NULL THEN
      PERFORM public.recalcular_codigos_curso(NEW.curso_id);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Curso anterior (si cambió o se desactivó/borró)
    IF OLD.curso_id IS NOT NULL AND OLD.curso_id IS DISTINCT FROM NEW.curso_id THEN
      PERFORM public.recalcular_codigos_curso(OLD.curso_id);
    END IF;
    -- Curso actual
    IF NEW.curso_id IS NOT NULL THEN
      PERFORM public.recalcular_codigos_curso(NEW.curso_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.curso_id IS NOT NULL THEN
      PERFORM public.recalcular_codigos_curso(OLD.curso_id);
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

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

-- 6) Trigger sobre cursos: recalcular cuando cambia nombre / fecha_inicio / nivel_formacion_id
CREATE OR REPLACE FUNCTION public.trg_cursos_resync_codigos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NULL; END IF;
  PERFORM public.recalcular_codigos_curso(NEW.id);
  RETURN NULL;
END;
$$;

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

-- 7) Trigger sobre niveles_formacion: recalcular cuando cambia config_codigo_estudiante
CREATE OR REPLACE FUNCTION public.trg_niveles_resync_codigos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _curso_id UUID;
BEGIN
  IF pg_trigger_depth() > 1 THEN RETURN NULL; END IF;
  FOR _curso_id IN
    SELECT id FROM public.cursos
    WHERE nivel_formacion_id = NEW.id AND deleted_at IS NULL
  LOOP
    PERFORM public.recalcular_codigos_curso(_curso_id);
  END LOOP;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_niveles_resync_codigos_au ON public.niveles_formacion;
CREATE TRIGGER trg_niveles_resync_codigos_au
AFTER UPDATE OF config_codigo_estudiante ON public.niveles_formacion
FOR EACH ROW
WHEN (OLD.config_codigo_estudiante IS DISTINCT FROM NEW.config_codigo_estudiante)
EXECUTE FUNCTION public.trg_niveles_resync_codigos();

-- 8) Backfill: recalcular para todos los cursos existentes con matrículas activas
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