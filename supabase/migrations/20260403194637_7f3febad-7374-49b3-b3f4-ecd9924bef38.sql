
ALTER TABLE public.portal_config_documentos
ADD COLUMN formato_id UUID REFERENCES public.formatos_formacion(id) ON DELETE SET NULL;

CREATE INDEX idx_portal_config_docs_formato ON public.portal_config_documentos(formato_id);
