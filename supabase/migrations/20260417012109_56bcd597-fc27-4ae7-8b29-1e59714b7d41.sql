-- RPC para que edge functions con service_role ejecuten SQL administrativo (solo cron)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM authenticated;

-- Cron job diario para limpieza de backups según retención (03:00 UTC)
DO $$
DECLARE
  _supabase_url text;
  _service_key text;
BEGIN
  -- Obtenemos del vault si está disponible; si no, usamos placeholders que deberán configurarse en la UI manualmente
  BEGIN
    SELECT decrypted_secret INTO _supabase_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    _supabase_url := NULL;
  END;

  -- Eliminar job previo si existe
  PERFORM cron.unschedule('backup_cleanup_diario') WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'backup_cleanup_diario'
  );

  -- Programar limpieza: el comando se mantiene como placeholder lógico.
  -- La invocación real al edge se hace vía pg_net con la URL del proyecto.
  PERFORM cron.schedule(
    'backup_cleanup_diario',
    '0 3 * * *',
    $cmd$
      select net.http_post(
        url := 'https://qdnnpymcvbtptiappjrn.supabase.co/functions/v1/backup-cleanup',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := '{}'::jsonb
      );
    $cmd$
  );
EXCEPTION WHEN OTHERS THEN
  -- No abortar si pg_cron aún no está totalmente configurado
  RAISE NOTICE 'Cron setup pospuesto: %', SQLERRM;
END $$;