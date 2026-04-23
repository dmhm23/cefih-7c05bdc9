-- Desactivar sincronización automática de codigo_estudiante (temporal)
DROP TRIGGER IF EXISTS trg_matriculas_resync_codigo_aiu ON public.matriculas;
DROP TRIGGER IF EXISTS trg_matriculas_resync_codigo_au ON public.matriculas;
DROP TRIGGER IF EXISTS trg_cursos_resync_codigos_au ON public.cursos;
DROP TRIGGER IF EXISTS trg_niveles_resync_codigos_au ON public.niveles_formacion;

-- Neutralizar la función de recálculo (no-op) por si alguna ruta interna aún la llama.
-- TEMPORALMENTE DESACTIVADO: ver plan de refactor del código de estudiante.
CREATE OR REPLACE FUNCTION public.recalcular_codigos_curso(_curso_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- TEMPORALMENTE DESACTIVADO
  -- La sincronización de codigo_estudiante se hace en el frontend.
  -- Reactivar cuando se complete el refactor que evite colisiones del índice
  -- único uniq_matriculas_codigo_por_curso durante la renumeración.
  RETURN;
END;
$$;