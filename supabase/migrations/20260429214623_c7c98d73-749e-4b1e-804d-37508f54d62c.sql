CREATE TABLE IF NOT EXISTS public._backup_empresas_arl_sector_20260429 AS
SELECT id, arl, sector_economico, now() AS snapshot_at
FROM public.empresas WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public._backup_matriculas_arl_sector_20260429 AS
SELECT id, arl, sector_economico, now() AS snapshot_at
FROM public.matriculas WHERE deleted_at IS NULL;

WITH mat_emp AS (
  SELECT empresa_id,
         NULLIF(TRIM(arl),'') AS arl,
         NULLIF(TRIM(sector_economico),'') AS sector
  FROM public.matriculas
  WHERE deleted_at IS NULL AND empresa_id IS NOT NULL
),
agg_arl AS (
  SELECT empresa_id, MAX(arl) AS arl_unico
  FROM mat_emp WHERE arl IS NOT NULL AND arl <> 'otra_arl'
  GROUP BY empresa_id HAVING COUNT(DISTINCT arl) = 1
),
agg_sec AS (
  SELECT empresa_id, MAX(sector) AS sec_unico
  FROM mat_emp WHERE sector IS NOT NULL AND sector <> 'otro_sector'
  GROUP BY empresa_id HAVING COUNT(DISTINCT sector) = 1
)
UPDATE public.empresas e
SET arl = COALESCE(e.arl, a.arl_unico::public.arl_enum),
    sector_economico = COALESCE(e.sector_economico, s.sec_unico::public.sector_economico),
    updated_at = now()
FROM agg_arl a FULL OUTER JOIN agg_sec s ON a.empresa_id = s.empresa_id
WHERE e.id = COALESCE(a.empresa_id, s.empresa_id)
  AND e.deleted_at IS NULL
  AND (
    (e.arl IS NULL AND a.arl_unico IS NOT NULL)
    OR (e.sector_economico IS NULL AND s.sec_unico IS NOT NULL)
  );

UPDATE public.matriculas m
SET arl = e.arl::text, updated_at = now()
FROM public.empresas e
WHERE m.empresa_id = e.id AND m.deleted_at IS NULL
  AND (m.arl IS NULL OR m.arl = '') AND e.arl IS NOT NULL;

UPDATE public.matriculas m
SET sector_economico = e.sector_economico::text, updated_at = now()
FROM public.empresas e
WHERE m.empresa_id = e.id AND m.deleted_at IS NULL
  AND (m.sector_economico IS NULL OR m.sector_economico = '') AND e.sector_economico IS NOT NULL;