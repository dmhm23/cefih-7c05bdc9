ALTER TABLE public._backup_codigos_estudiante ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo admin lee backup codigos"
ON public._backup_codigos_estudiante
FOR SELECT TO authenticated
USING (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]));