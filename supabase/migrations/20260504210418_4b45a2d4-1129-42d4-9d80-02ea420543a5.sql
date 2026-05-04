ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS arl_otra text,
  ADD COLUMN IF NOT EXISTS sector_economico_otro text;