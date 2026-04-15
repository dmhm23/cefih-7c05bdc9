
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-formatos', 'logos-formatos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logos públicos lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos-formatos');

CREATE POLICY "Admin sube logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'logos-formatos' AND (public.get_my_rol() IN ('superadministrador', 'administrador')));

CREATE POLICY "Admin actualiza logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'logos-formatos' AND (public.get_my_rol() IN ('superadministrador', 'administrador')));

CREATE POLICY "Admin elimina logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'logos-formatos' AND (public.get_my_rol() IN ('superadministrador', 'administrador')));
