-- Add es_origen_firma to formatos_formacion
ALTER TABLE public.formatos_formacion
ADD COLUMN es_origen_firma boolean NOT NULL DEFAULT false;