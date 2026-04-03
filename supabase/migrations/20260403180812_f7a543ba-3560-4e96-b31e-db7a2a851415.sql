-- ============================================================
-- Paso 2: Funciones SQL del Dashboard
-- ============================================================

-- get_dashboard_stats: métricas principales
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
    'matriculasActivas', (SELECT count(*) FROM matriculas WHERE deleted_at IS NULL AND activo AND estado NOT IN ('cancelada')),
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
      WHERE gc.estado NOT IN ('pagado')
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

-- get_dashboard_charts_data: datos para gráficos
CREATE OR REPLACE FUNCTION public.get_dashboard_charts_data(p_periodo TEXT DEFAULT 'anual')
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  _meses INTEGER;
  _desde DATE;
BEGIN
  _meses := CASE p_periodo
    WHEN 'trimestre' THEN 3
    WHEN 'semestre' THEN 6
    ELSE 12
  END;
  _desde := date_trunc('month', CURRENT_DATE) - ((_meses - 1) || ' months')::INTERVAL;

  SELECT jsonb_build_object(
    'matriculasPorMes', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.mes), '[]'::JSONB)
      FROM (
        SELECT to_char(gs.m, 'Mon') AS mes, count(mat.id) AS valor
        FROM generate_series(_desde, date_trunc('month', CURRENT_DATE), '1 month') gs(m)
        LEFT JOIN matriculas mat ON date_trunc('month', mat.created_at) = gs.m AND mat.deleted_at IS NULL
        GROUP BY gs.m ORDER BY gs.m
      ) t
    ),
    'ingresosPorMes', (
      SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.mes), '[]'::JSONB)
      FROM (
        SELECT to_char(gs.m, 'Mon') AS mes, COALESCE(SUM(p.valor_pago), 0) AS valor
        FROM generate_series(_desde, date_trunc('month', CURRENT_DATE), '1 month') gs(m)
        LEFT JOIN pagos p ON date_trunc('month', p.fecha_pago) = gs.m
        GROUP BY gs.m ORDER BY gs.m
      ) t
    ),
    'distribucionTipoFormacion', (
      SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::JSONB)
      FROM (
        SELECT c.tipo_formacion AS nivel, count(*) AS cantidad
        FROM cursos c
        WHERE c.deleted_at IS NULL
        GROUP BY c.tipo_formacion
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;
