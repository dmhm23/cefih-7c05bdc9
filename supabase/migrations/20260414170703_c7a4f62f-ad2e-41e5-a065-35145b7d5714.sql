
CREATE OR REPLACE FUNCTION public.get_formatos_for_matricula(_matricula_id uuid)
 RETURNS SETOF formatos_formacion
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _curso_id UUID;
  _tipo_formacion public.tipo_formacion;
  _nivel_id UUID;
BEGIN
  -- Leer nivel_formacion_id directamente de la matrícula (fuente de verdad)
  SELECT m.curso_id, m.nivel_formacion_id
  INTO _curso_id, _nivel_id
  FROM public.matriculas m WHERE m.id = _matricula_id;

  -- Fallback: si la matrícula no tiene nivel directo, intentar desde el curso
  IF _nivel_id IS NULL AND _curso_id IS NOT NULL THEN
    SELECT c.nivel_formacion_id INTO _nivel_id
    FROM public.cursos c WHERE c.id = _curso_id;
  END IF;

  -- Resolver tipo_formacion desde el nivel
  IF _nivel_id IS NOT NULL THEN
    SELECT nf.tipo_formacion INTO _tipo_formacion
    FROM public.niveles_formacion nf WHERE nf.id = _nivel_id;
  ELSIF _curso_id IS NOT NULL THEN
    SELECT c.tipo_formacion INTO _tipo_formacion
    FROM public.cursos c WHERE c.id = _curso_id;
  END IF;

  RETURN QUERY
  SELECT f.*
  FROM public.formatos_formacion f
  WHERE f.estado IN ('activo', 'borrador')
    AND f.activo = TRUE
    AND f.deleted_at IS NULL
    AND f.visible_en_matricula = TRUE
    AND (
      -- Global formats (no specific assignment)
      (
        (f.niveles_asignados IS NULL OR f.niveles_asignados = '{}')
        AND (f.tipos_curso IS NULL OR f.tipos_curso = '{}')
      )
      OR
      (f.asignacion_scope = 'nivel_formacion' AND _nivel_id IS NOT NULL AND _nivel_id = ANY(f.niveles_asignados))
      OR
      (f.asignacion_scope = 'tipo_curso' AND _tipo_formacion IS NOT NULL AND _tipo_formacion = ANY(f.tipos_curso))
    )
    AND (
      -- Evaluate precondition dependencies
      f.dependencias = '[]'::jsonb
      OR NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(f.dependencias) dep
        WHERE dep->>'tipo' = 'precondicion'
          AND NOT EXISTS (
            SELECT 1
            FROM public.formato_respuestas fr
            WHERE fr.matricula_id = _matricula_id
              AND fr.formato_id = (dep->>'formatoId')::uuid
              AND fr.estado = COALESCE(dep->>'condicion', 'completado')::public.estado_formato_respuesta
          )
      )
    );
END;
$function$;
