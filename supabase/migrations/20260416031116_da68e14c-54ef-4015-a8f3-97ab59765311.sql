-- Add 'anulada' to estado_factura enum
ALTER TYPE public.estado_factura ADD VALUE IF NOT EXISTS 'anulada';

-- Create cascade function
CREATE OR REPLACE FUNCTION public.cascade_softdelete_matricula_cartera()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _grupo_id UUID;
  _matriculas_restantes INTEGER;
BEGIN
  -- Solo actuar cuando deleted_at cambia de NULL a un valor
  IF OLD.deleted_at IS NOT NULL OR NEW.deleted_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Encontrar grupo de cartera vinculado
  SELECT grupo_cartera_id INTO _grupo_id
  FROM public.grupo_cartera_matriculas
  WHERE matricula_id = NEW.id;

  IF _grupo_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Eliminar el vínculo
  DELETE FROM public.grupo_cartera_matriculas
  WHERE matricula_id = NEW.id;

  -- Contar matrículas restantes en el grupo
  SELECT count(*) INTO _matriculas_restantes
  FROM public.grupo_cartera_matriculas
  WHERE grupo_cartera_id = _grupo_id;

  IF _matriculas_restantes = 0 THEN
    -- Anular facturas del grupo
    UPDATE public.facturas
    SET estado = 'anulada', updated_at = now()
    WHERE grupo_cartera_id = _grupo_id;

    -- Liquidar grupo
    UPDATE public.grupos_cartera
    SET estado = 'pagado', saldo = 0, total_valor = 0, 
        total_abonos = 0, updated_at = now()
    WHERE id = _grupo_id;

    -- Registrar actividad
    INSERT INTO public.actividades_cartera 
      (grupo_cartera_id, tipo, descripcion, fecha)
    VALUES (_grupo_id, 'sistema', 
      'Grupo liquidado automáticamente por eliminación de matrícula(s)', now());
  ELSE
    -- Recalcular con las matrículas restantes
    PERFORM public.recalcular_grupo_cartera(_grupo_id);

    INSERT INTO public.actividades_cartera 
      (grupo_cartera_id, tipo, descripcion, fecha)
    VALUES (_grupo_id, 'sistema', 
      'Matrícula desvinculada por soft-delete', now());
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trg_cascade_softdelete_matricula_cartera
  AFTER UPDATE OF deleted_at ON public.matriculas
  FOR EACH ROW
  EXECUTE FUNCTION public.cascade_softdelete_matricula_cartera();