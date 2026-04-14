-- Backfill: copiar empresa_nivel_formacion → nivel_formacion_id donde falta
UPDATE public.matriculas
SET nivel_formacion_id = empresa_nivel_formacion::uuid
WHERE nivel_formacion_id IS NULL
  AND empresa_nivel_formacion IS NOT NULL
  AND empresa_nivel_formacion != ''
  AND empresa_nivel_formacion IN (SELECT id::text FROM public.niveles_formacion);

-- Force PostgREST schema cache reload so nivel_formacion_id is recognized in INSERT/UPDATE
NOTIFY pgrst, 'reload schema';