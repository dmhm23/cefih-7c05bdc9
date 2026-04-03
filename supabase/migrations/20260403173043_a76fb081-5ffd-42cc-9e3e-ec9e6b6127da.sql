
-- =============================================
-- FASE 3 — PASO 2: Tabla documentos_matricula
-- =============================================

CREATE TABLE public.documentos_matricula (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  tipo public.tipo_documento_matricula NOT NULL DEFAULT 'otro',
  nombre TEXT NOT NULL,
  estado public.estado_documento_matricula NOT NULL DEFAULT 'pendiente',
  storage_path TEXT,
  fecha_carga DATE,
  fecha_documento DATE,
  fecha_inicio_cobertura DATE,
  opcional BOOLEAN NOT NULL DEFAULT FALSE,
  archivo_nombre TEXT,
  archivo_tamano BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_docs_matricula ON public.documentos_matricula(matricula_id);

-- RLS
ALTER TABLE public.documentos_matricula ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leen documentos matricula"
  ON public.documentos_matricula FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Admin/global gestionan documentos matricula"
  ON public.documentos_matricula FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));

-- Audit trigger
CREATE TRIGGER audit_documentos_matricula
  AFTER INSERT OR UPDATE OR DELETE ON public.documentos_matricula
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('documento_matricula');

-- Storage policies for documentos-matricula bucket
CREATE POLICY "Autenticados leen documentos-matricula"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-matricula');

CREATE POLICY "Admin/global suben documentos-matricula"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-matricula' AND (SELECT get_my_rol()) = ANY(ARRAY['admin','global']));

CREATE POLICY "Admin/global eliminan documentos-matricula"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-matricula' AND (SELECT get_my_rol()) = ANY(ARRAY['admin','global']));
