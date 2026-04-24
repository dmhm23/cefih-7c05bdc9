-- Fase 1.1: Re-instalar trigger trg_cascade_firma + backfill forzado

-- 1) Re-crear el trigger faltante
DROP TRIGGER IF EXISTS trg_cascade_firma ON public.formato_respuestas;

CREATE TRIGGER trg_cascade_firma
AFTER INSERT OR UPDATE OF estado, answers
ON public.formato_respuestas
FOR EACH ROW
EXECUTE FUNCTION public.cascade_firma_to_targets();

-- 2) Backfill forzado: tocar updated_at en respuestas completadas de formatos origen
--    para que el trigger se dispare y propague firmas + cree registros hijos faltantes.
--    La función usa ON CONFLICT DO UPDATE con merge JSONB, no sobrescribe respuestas.
UPDATE public.formato_respuestas fr
SET updated_at = now()
FROM public.formatos_formacion ff
WHERE fr.formato_id = ff.id
  AND fr.estado = 'completado'
  AND ff.es_origen_firma = TRUE
  AND ff.deleted_at IS NULL;