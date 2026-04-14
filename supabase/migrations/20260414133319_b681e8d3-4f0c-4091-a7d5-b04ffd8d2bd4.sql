-- Add nivel_formacion_id column to matriculas
ALTER TABLE public.matriculas
ADD COLUMN nivel_formacion_id UUID REFERENCES public.niveles_formacion(id);

-- Backfill from existing cursos
UPDATE public.matriculas m
SET nivel_formacion_id = c.nivel_formacion_id
FROM public.cursos c
WHERE m.curso_id = c.id AND c.nivel_formacion_id IS NOT NULL;

-- Index for performance
CREATE INDEX idx_matriculas_nivel_formacion_id ON public.matriculas (nivel_formacion_id);