-- Habilitar extensiones necesarias para programación futura
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.backup_alcance AS ENUM ('db_only', 'completo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.backup_estado AS ENUM ('en_progreso', 'completado', 'fallido');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.backup_origen AS ENUM ('manual', 'programado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.backup_restore_modo AS ENUM ('reemplazar', 'enriquecer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.backup_restore_estado AS ENUM ('en_progreso', 'completado', 'fallido', 'parcial');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla principal de respaldos
CREATE TABLE IF NOT EXISTS public.system_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alcance public.backup_alcance NOT NULL DEFAULT 'completo',
  origen public.backup_origen NOT NULL DEFAULT 'manual',
  estado public.backup_estado NOT NULL DEFAULT 'en_progreso',
  schedule_id UUID NULL,
  storage_path TEXT NULL,
  tamano_bytes BIGINT NOT NULL DEFAULT 0,
  tamano_db_bytes BIGINT NOT NULL DEFAULT 0,
  tamano_files_bytes BIGINT NOT NULL DEFAULT 0,
  tablas_count INTEGER NOT NULL DEFAULT 0,
  filas_count BIGINT NOT NULL DEFAULT 0,
  archivos_count INTEGER NOT NULL DEFAULT 0,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_msg TEXT NULL,
  created_by UUID NULL,
  created_by_email TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL
);

-- Solo un backup en progreso a la vez
CREATE UNIQUE INDEX IF NOT EXISTS uniq_backup_en_progreso
  ON public.system_backups ((1)) WHERE estado = 'en_progreso';

CREATE INDEX IF NOT EXISTS idx_system_backups_created_at
  ON public.system_backups (created_at DESC);

-- Tabla de programaciones
CREATE TABLE IF NOT EXISTS public.system_backup_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  frecuencia_cron TEXT NOT NULL,
  frecuencia_legible TEXT NOT NULL DEFAULT '',
  alcance public.backup_alcance NOT NULL DEFAULT 'completo',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  retener_n_ultimos INTEGER NOT NULL DEFAULT 7,
  cron_job_id BIGINT NULL,
  ultima_ejecucion TIMESTAMPTZ NULL,
  proxima_ejecucion TIMESTAMPTZ NULL,
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_backup_schedules_activo
  ON public.system_backup_schedules (activo) WHERE activo = TRUE;

-- Tabla de logs de restauración
CREATE TABLE IF NOT EXISTS public.system_backup_restore_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID NULL,
  modo public.backup_restore_modo NOT NULL,
  estado public.backup_restore_estado NOT NULL DEFAULT 'en_progreso',
  incluyo_archivos BOOLEAN NOT NULL DEFAULT FALSE,
  tablas_afectadas JSONB NOT NULL DEFAULT '[]'::jsonb,
  filas_insertadas BIGINT NOT NULL DEFAULT 0,
  filas_omitidas BIGINT NOT NULL DEFAULT 0,
  archivos_restaurados INTEGER NOT NULL DEFAULT 0,
  errores JSONB NOT NULL DEFAULT '[]'::jsonb,
  ejecutado_por UUID NULL,
  ejecutado_por_email TEXT NULL,
  ejecutado_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completado_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_system_backup_restore_logs_at
  ON public.system_backup_restore_logs (ejecutado_at DESC);

-- Trigger para updated_at en schedules
DROP TRIGGER IF EXISTS trg_system_backup_schedules_updated_at ON public.system_backup_schedules;
CREATE TRIGGER trg_system_backup_schedules_updated_at
  BEFORE UPDATE ON public.system_backup_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.system_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_backup_restore_logs ENABLE ROW LEVEL SECURITY;

-- Policies system_backups
DROP POLICY IF EXISTS "Superadmin gestiona system_backups" ON public.system_backups;
CREATE POLICY "Superadmin gestiona system_backups"
  ON public.system_backups FOR ALL TO authenticated
  USING (public.get_my_rol() = 'superadministrador')
  WITH CHECK (public.get_my_rol() = 'superadministrador');

DROP POLICY IF EXISTS "Admin lee system_backups" ON public.system_backups;
CREATE POLICY "Admin lee system_backups"
  ON public.system_backups FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['superadministrador','administrador']));

-- Policies system_backup_schedules
DROP POLICY IF EXISTS "Superadmin gestiona schedules" ON public.system_backup_schedules;
CREATE POLICY "Superadmin gestiona schedules"
  ON public.system_backup_schedules FOR ALL TO authenticated
  USING (public.get_my_rol() = 'superadministrador')
  WITH CHECK (public.get_my_rol() = 'superadministrador');

DROP POLICY IF EXISTS "Admin lee schedules" ON public.system_backup_schedules;
CREATE POLICY "Admin lee schedules"
  ON public.system_backup_schedules FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['superadministrador','administrador']));

-- Policies restore_logs
DROP POLICY IF EXISTS "Superadmin gestiona restore_logs" ON public.system_backup_restore_logs;
CREATE POLICY "Superadmin gestiona restore_logs"
  ON public.system_backup_restore_logs FOR ALL TO authenticated
  USING (public.get_my_rol() = 'superadministrador')
  WITH CHECK (public.get_my_rol() = 'superadministrador');

DROP POLICY IF EXISTS "Admin lee restore_logs" ON public.system_backup_restore_logs;
CREATE POLICY "Admin lee restore_logs"
  ON public.system_backup_restore_logs FOR SELECT TO authenticated
  USING (public.get_my_rol() = ANY (ARRAY['superadministrador','administrador']));

-- Bucket privado para los archivos ZIP de respaldo
INSERT INTO storage.buckets (id, name, public)
VALUES ('system-backups', 'system-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: solo superadmin
DROP POLICY IF EXISTS "Superadmin lee system-backups" ON storage.objects;
CREATE POLICY "Superadmin lee system-backups"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'system-backups' AND public.get_my_rol() = 'superadministrador');

DROP POLICY IF EXISTS "Superadmin sube system-backups" ON storage.objects;
CREATE POLICY "Superadmin sube system-backups"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'system-backups' AND public.get_my_rol() = 'superadministrador');

DROP POLICY IF EXISTS "Superadmin borra system-backups" ON storage.objects;
CREATE POLICY "Superadmin borra system-backups"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'system-backups' AND public.get_my_rol() = 'superadministrador');