-- Drop duplicate unique constraint that can cause upsert conflicts
ALTER TABLE public.formato_respuestas DROP CONSTRAINT IF EXISTS formato_respuestas_matricula_formato_unique;