
-- Table for user activity logs
CREATE TABLE public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  module TEXT,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::JSONB,
  route TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ual_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_ual_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX idx_ual_module ON public.user_activity_logs(module);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert logs
CREATE POLICY "Autenticados insertan sus logs"
ON public.user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only admin/superadmin can read logs
CREATE POLICY "Admin lee todos los logs"
ON public.user_activity_logs
FOR SELECT
TO authenticated
USING (get_my_rol() IN ('superadministrador', 'administrador'));
