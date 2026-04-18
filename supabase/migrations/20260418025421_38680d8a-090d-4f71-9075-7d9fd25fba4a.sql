-- Fase 1: limpieza de schema legacy del módulo de formatos

-- 1. Eliminar tabla versiones_formato no utilizada (0 registros)
DROP TABLE IF EXISTS public.versiones_formato CASCADE;

-- 2. Eliminar columna legacy_component_id (todos los valores son NULL)
--    También se debe actualizar la función duplicar_formato que la referenciaba.
CREATE OR REPLACE FUNCTION public.duplicar_formato(_formato_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _new_id UUID;
BEGIN
  INSERT INTO public.formatos_formacion (
    nombre, descripcion, codigo, version, motor_render, categoria, estado,
    asignacion_scope, niveles_asignados, tipos_curso,
    html_template, css_template, bloques,
    usa_encabezado_institucional, encabezado_config,
    tokens_usados, requiere_firma_aprendiz, requiere_firma_entrenador, requiere_firma_supervisor,
    visible_en_matricula, visible_en_curso, visible_en_portal_estudiante,
    activo, modo_diligenciamiento, es_automatico, document_meta,
    plantilla_base_id
  )
  SELECT
    'Copia de ' || nombre, descripcion, codigo || '-COPIA', '001', motor_render, categoria, 'borrador',
    asignacion_scope, niveles_asignados, tipos_curso,
    html_template, css_template, bloques,
    usa_encabezado_institucional, encabezado_config,
    tokens_usados, requiere_firma_aprendiz, requiere_firma_entrenador, requiere_firma_supervisor,
    visible_en_matricula, visible_en_curso, visible_en_portal_estudiante,
    TRUE, modo_diligenciamiento, es_automatico, document_meta,
    id
  FROM public.formatos_formacion
  WHERE id = _formato_id
  RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$function$;

ALTER TABLE public.formatos_formacion DROP COLUMN IF EXISTS legacy_component_id;