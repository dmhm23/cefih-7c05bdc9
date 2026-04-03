ALTER TABLE public.personas DROP CONSTRAINT IF EXISTS personas_numero_documento_key;
CREATE UNIQUE INDEX personas_numero_documento_activo_uq 
  ON public.personas (numero_documento) 
  WHERE deleted_at IS NULL;