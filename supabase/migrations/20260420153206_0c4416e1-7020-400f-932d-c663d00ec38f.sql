-- 1. Recrear la función trigger con SECURITY DEFINER para bypassear RLS en curso_consecutivos
CREATE OR REPLACE FUNCTION public.autogenerar_nombre_curso()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _config JSONB;
  _prefijo TEXT;
  _tipo_code TEXT;
  _sep TEXT;
  _anio_num SMALLINT;
  _mes_num SMALLINT;
  _anio TEXT;
  _mes TEXT;
  _consecutivo INTEGER;
  _consecutivo_txt TEXT;
BEGIN
  -- Si nombre ya tiene valor, respetar (edición manual)
  IF NEW.nombre IS NOT NULL AND NEW.nombre != '' THEN
    RETURN NEW;
  END IF;

  -- Intentar generar con la regla oficial si hay nivel y fecha
  IF NEW.nivel_formacion_id IS NOT NULL AND NEW.fecha_inicio IS NOT NULL THEN
    SELECT nf.config_codigo_estudiante INTO _config
    FROM public.niveles_formacion nf
    WHERE nf.id = NEW.nivel_formacion_id;

    IF _config IS NOT NULL AND (_config->>'activo')::BOOLEAN = TRUE THEN
      _prefijo := COALESCE(_config->>'prefijoCodigo', '');
      _tipo_code := COALESCE(_config->>'codigoTipoFormacion', '');
      _sep := COALESCE(_config->>'separadorCodigo', '-');
      _anio_num := EXTRACT(YEAR FROM NEW.fecha_inicio)::SMALLINT;
      _mes_num := EXTRACT(MONTH FROM NEW.fecha_inicio)::SMALLINT;
      _anio := to_char(NEW.fecha_inicio, 'YY');
      _mes := to_char(NEW.fecha_inicio, 'MM');

      -- Obtener consecutivo de forma atómica con UPSERT + RETURNING
      INSERT INTO public.curso_consecutivos (nivel_formacion_id, anio, mes, ultimo_consecutivo)
      VALUES (NEW.nivel_formacion_id, _anio_num, _mes_num, 1)
      ON CONFLICT (nivel_formacion_id, anio, mes)
      DO UPDATE SET ultimo_consecutivo = public.curso_consecutivos.ultimo_consecutivo + 1
      RETURNING ultimo_consecutivo INTO _consecutivo;

      _consecutivo_txt := lpad(_consecutivo::TEXT, 2, '0');
      NEW.nombre := _prefijo || _sep || _tipo_code || _sep || _anio || _sep || _mes || _sep || _consecutivo_txt;
      RETURN NEW;
    END IF;
  END IF;

  -- Fallback legacy si no hay config de nivel
  DECLARE
    _seq INTEGER;
    _tipo_label TEXT;
  BEGIN
    SELECT COUNT(*) + 1 INTO _seq
    FROM public.cursos
    WHERE tipo_formacion = NEW.tipo_formacion;

    _tipo_label := CASE NEW.tipo_formacion
      WHEN 'formacion_inicial' THEN 'FI'
      WHEN 'reentrenamiento' THEN 'RE'
      WHEN 'jefe_area' THEN 'JA'
      WHEN 'coordinador_alturas' THEN 'CA'
    END;

    NEW.nombre := _tipo_label || '-' || lpad(_seq::TEXT, 4, '0');
  END;

  RETURN NEW;
END;
$function$;

-- 2. Actualizar política RLS de curso_consecutivos para usar el sistema granular de permisos
DROP POLICY IF EXISTS "Admin gestiona curso_consecutivos" ON public.curso_consecutivos;

CREATE POLICY "Usuarios con permiso gestionan curso_consecutivos"
ON public.curso_consecutivos FOR ALL TO authenticated
USING (public.has_permission(auth.uid(), 'cursos', 'editar'))
WITH CHECK (public.has_permission(auth.uid(), 'cursos', 'editar'));