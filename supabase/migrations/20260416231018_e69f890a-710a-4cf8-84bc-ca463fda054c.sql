-- Tabla de adjuntos MinTrabajo
CREATE TABLE public.cursos_mintrabajo_adjuntos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id uuid NOT NULL,
  fecha_id uuid NULL REFERENCES public.cursos_fechas_mintrabajo(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  tipo_mime text,
  tamano bigint,
  storage_path text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mintrabajo_adjuntos_curso ON public.cursos_mintrabajo_adjuntos (curso_id);
CREATE INDEX idx_mintrabajo_adjuntos_fecha ON public.cursos_mintrabajo_adjuntos (fecha_id);

ALTER TABLE public.cursos_mintrabajo_adjuntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen mintrabajo_adjuntos"
ON public.cursos_mintrabajo_adjuntos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin gestiona mintrabajo_adjuntos"
ON public.cursos_mintrabajo_adjuntos
FOR ALL
TO authenticated
USING (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]))
WITH CHECK (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]));

-- Bucket privado
INSERT INTO storage.buckets (id, name, public)
VALUES ('adjuntos-mintrabajo', 'adjuntos-mintrabajo', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (mismo patrón que adjuntos-personal)
CREATE POLICY "Autenticados leen adjuntos-mintrabajo"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'adjuntos-mintrabajo');

CREATE POLICY "Autenticados suben adjuntos-mintrabajo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'adjuntos-mintrabajo');

CREATE POLICY "Autenticados actualizan adjuntos-mintrabajo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'adjuntos-mintrabajo');

CREATE POLICY "Autenticados eliminan adjuntos-mintrabajo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'adjuntos-mintrabajo');