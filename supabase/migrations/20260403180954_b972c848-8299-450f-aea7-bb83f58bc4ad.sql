CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalPersonas', (SELECT count(*) FROM personas WHERE deleted_at IS NULL AND activo),
    'totalMatriculas', (SELECT count(*) FROM matriculas WHERE deleted_at IS NULL),
    'matriculasActivas', (SELECT count(*) FROM matriculas WHERE deleted_at IS NULL AND activo AND estado != 'cerrada'),
    'cursosAbiertos', (SELECT count(*) FROM cursos WHERE deleted_at IS NULL AND estado = 'programado'),
    'cursosEnProgreso', (SELECT count(*) FROM cursos WHERE deleted_at IS NULL AND estado = 'en_progreso'),
    'certificadosEmitidos', (SELECT count(*) FROM certificados WHERE estado = 'generado'),
    'ingresosMes', (
      SELECT COALESCE(SUM(p.valor_pago), 0)
      FROM pagos p
      WHERE date_trunc('month', p.fecha_pago) = date_trunc('month', CURRENT_DATE)
    ),
    'carteraPendiente', (
      SELECT COALESCE(SUM(gc.saldo), 0)
      FROM grupos_cartera gc
      WHERE gc.estado != 'pagado'
    ),
    'matriculasIncompletas', (
      SELECT count(DISTINCT dm.matricula_id)
      FROM documentos_matricula dm
      WHERE dm.opcional = FALSE AND dm.estado = 'pendiente'
    ),
    'cursosSinCerrar', (
      SELECT count(*)
      FROM cursos
      WHERE deleted_at IS NULL AND estado = 'en_progreso'
        AND fecha_fin IS NOT NULL AND fecha_fin < CURRENT_DATE
    ),
    'facturadoPagado', (
      SELECT COALESCE(SUM(gc.total_abonos), 0)
      FROM grupos_cartera gc
      WHERE gc.estado = 'pagado'
    ),
    'pendientesMinTrabajo', (
      SELECT count(*)
      FROM cursos
      WHERE deleted_at IS NULL AND estado = 'cerrado'
        AND NOT EXISTS (
          SELECT 1 FROM cursos_fechas_mintrabajo cfm WHERE cfm.curso_id = cursos.id
        )
    )
  ) INTO result;

  RETURN result;
END;
$$;
