
-- 1. Agregar columnas a formatos_formacion
ALTER TABLE public.formatos_formacion
  ADD COLUMN IF NOT EXISTS dependencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS eventos_disparadores jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.formatos_formacion.dependencias IS 'Array de dependencias: [{formatoId, tipo: activacion|datos|precondicion, condicion: completado|firmado|aprobado}]';
COMMENT ON COLUMN public.formatos_formacion.eventos_disparadores IS 'Array de eventos que disparan generación automática: [asignacion_curso, cierre_curso, firma_completada]';

-- 2. Extender enum estado_formato_respuesta
ALTER TYPE public.estado_formato_respuesta ADD VALUE IF NOT EXISTS 'bloqueado';
ALTER TYPE public.estado_formato_respuesta ADD VALUE IF NOT EXISTS 'firmado';
ALTER TYPE public.estado_formato_respuesta ADD VALUE IF NOT EXISTS 'reabierto';

-- 3. Agregar columnas de reapertura y reintentos a formato_respuestas
ALTER TABLE public.formato_respuestas
  ADD COLUMN IF NOT EXISTS reabierto_por uuid,
  ADD COLUMN IF NOT EXISTS reabierto_at timestamptz,
  ADD COLUMN IF NOT EXISTS intentos_evaluacion jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 4. Crear tipo enum para tipo de firma
DO $$ BEGIN
  CREATE TYPE public.tipo_firma_matricula AS ENUM ('aprendiz', 'entrenador', 'supervisor');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Crear tabla firmas_matricula
CREATE TABLE IF NOT EXISTS public.firmas_matricula (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  matricula_id uuid NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  tipo public.tipo_firma_matricula NOT NULL,
  firma_base64 text NOT NULL,
  formato_origen_id uuid REFERENCES public.formatos_formacion(id) ON DELETE SET NULL,
  ip text,
  user_agent text,
  hash_integridad text,
  autoriza_reutilizacion boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(matricula_id, tipo)
);

-- 6. Enable RLS
ALTER TABLE public.firmas_matricula ENABLE ROW LEVEL SECURITY;

-- 7. RLS policies
CREATE POLICY "Admin gestiona firmas_matricula"
  ON public.firmas_matricula FOR ALL TO authenticated
  USING (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]))
  WITH CHECK (get_my_rol() = ANY (ARRAY['superadministrador'::text, 'administrador'::text]));

CREATE POLICY "Autenticados leen firmas_matricula"
  ON public.firmas_matricula FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anon inserta firmas_matricula"
  ON public.firmas_matricula FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anon lee firmas_matricula"
  ON public.firmas_matricula FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon actualiza firmas_matricula"
  ON public.firmas_matricula FOR UPDATE TO anon
  USING (true);

-- 8. Trigger updated_at
CREATE TRIGGER update_firmas_matricula_updated_at
  BEFORE UPDATE ON public.firmas_matricula
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
