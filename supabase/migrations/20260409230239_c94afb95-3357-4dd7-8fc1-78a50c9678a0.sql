ALTER TABLE public.cursos
  ADD COLUMN duracion_horas integer NOT NULL DEFAULT 0,
  ADD COLUMN duracion_dias integer NOT NULL DEFAULT 0;