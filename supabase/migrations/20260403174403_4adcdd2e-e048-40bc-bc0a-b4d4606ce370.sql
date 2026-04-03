
-- ============================================================
-- PASO 2: Módulo de Cartera — 7 tablas + funciones + triggers
-- ============================================================

-- ==================== TABLAS ====================

-- 1. responsables_pago
CREATE TABLE public.responsables_pago (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo public.tipo_responsable NOT NULL,
  nombre TEXT NOT NULL,
  nit TEXT NOT NULL DEFAULT '',
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  contacto_email TEXT,
  direccion_facturacion TEXT,
  observaciones TEXT,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.responsables_pago ENABLE ROW LEVEL SECURITY;

-- 2. grupos_cartera
CREATE TABLE public.grupos_cartera (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  responsable_pago_id UUID NOT NULL REFERENCES public.responsables_pago(id) ON DELETE RESTRICT,
  estado public.estado_grupo_cartera NOT NULL DEFAULT 'sin_facturar',
  total_valor NUMERIC NOT NULL DEFAULT 0,
  total_abonos NUMERIC NOT NULL DEFAULT 0,
  saldo NUMERIC NOT NULL DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grupos_cartera ENABLE ROW LEVEL SECURITY;

-- 3. grupo_cartera_matriculas (tabla pivote)
CREATE TABLE public.grupo_cartera_matriculas (
  grupo_cartera_id UUID NOT NULL REFERENCES public.grupos_cartera(id) ON DELETE CASCADE,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (grupo_cartera_id, matricula_id)
);
ALTER TABLE public.grupo_cartera_matriculas ENABLE ROW LEVEL SECURITY;

-- 4. facturas
CREATE TABLE public.facturas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_cartera_id UUID NOT NULL REFERENCES public.grupos_cartera(id) ON DELETE RESTRICT,
  numero_factura TEXT NOT NULL DEFAULT '',
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  estado public.estado_factura NOT NULL DEFAULT 'por_pagar',
  archivo_factura TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;

-- 5. factura_matriculas (tabla pivote)
CREATE TABLE public.factura_matriculas (
  factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE RESTRICT,
  valor_asignado NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY (factura_id, matricula_id)
);
ALTER TABLE public.factura_matriculas ENABLE ROW LEVEL SECURITY;

-- 6. pagos
CREATE TABLE public.pagos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  factura_id UUID NOT NULL REFERENCES public.facturas(id) ON DELETE CASCADE,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_pago NUMERIC NOT NULL,
  metodo_pago public.metodo_pago NOT NULL,
  soporte_pago TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;

-- 7. actividades_cartera
CREATE TABLE public.actividades_cartera (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grupo_cartera_id UUID NOT NULL REFERENCES public.grupos_cartera(id) ON DELETE CASCADE,
  factura_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL,
  tipo public.tipo_actividad_cartera NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.actividades_cartera ENABLE ROW LEVEL SECURITY;

-- ==================== ÍNDICES ====================
CREATE INDEX idx_grupos_cartera_responsable ON public.grupos_cartera(responsable_pago_id);
CREATE INDEX idx_facturas_grupo ON public.facturas(grupo_cartera_id);
CREATE INDEX idx_pagos_factura ON public.pagos(factura_id);
CREATE INDEX idx_actividades_grupo ON public.actividades_cartera(grupo_cartera_id);
CREATE INDEX idx_responsables_empresa ON public.responsables_pago(empresa_id) WHERE empresa_id IS NOT NULL;

-- ==================== RLS POLICIES ====================

-- responsables_pago
CREATE POLICY "Admin/global gestionan responsables_pago" ON public.responsables_pago
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen responsables_pago" ON public.responsables_pago
  FOR SELECT TO authenticated USING (deleted_at IS NULL);

-- grupos_cartera
CREATE POLICY "Admin/global gestionan grupos_cartera" ON public.grupos_cartera
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen grupos_cartera" ON public.grupos_cartera
  FOR SELECT TO authenticated USING (true);

-- grupo_cartera_matriculas
CREATE POLICY "Admin/global gestionan grupo_cartera_matriculas" ON public.grupo_cartera_matriculas
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen grupo_cartera_matriculas" ON public.grupo_cartera_matriculas
  FOR SELECT TO authenticated USING (true);

-- facturas
CREATE POLICY "Admin/global gestionan facturas" ON public.facturas
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen facturas" ON public.facturas
  FOR SELECT TO authenticated USING (true);

-- factura_matriculas
CREATE POLICY "Admin/global gestionan factura_matriculas" ON public.factura_matriculas
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen factura_matriculas" ON public.factura_matriculas
  FOR SELECT TO authenticated USING (true);

-- pagos
CREATE POLICY "Admin/global gestionan pagos" ON public.pagos
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen pagos" ON public.pagos
  FOR SELECT TO authenticated USING (true);

-- actividades_cartera
CREATE POLICY "Admin/global gestionan actividades_cartera" ON public.actividades_cartera
  FOR ALL TO authenticated
  USING (get_my_rol() = ANY(ARRAY['admin','global']))
  WITH CHECK (get_my_rol() = ANY(ARRAY['admin','global']));
CREATE POLICY "Autenticados leen actividades_cartera" ON public.actividades_cartera
  FOR SELECT TO authenticated USING (true);

-- ==================== FUNCIONES ====================

-- Función: recalcular totales y estado de un grupo de cartera
CREATE OR REPLACE FUNCTION public.recalcular_grupo_cartera(p_grupo_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_valor NUMERIC;
  _total_abonos NUMERIC;
  _saldo NUMERIC;
  _tiene_facturas BOOLEAN;
  _todas_pagadas BOOLEAN;
  _alguna_parcial BOOLEAN;
  _alguna_vencida BOOLEAN;
  _nuevo_estado public.estado_grupo_cartera;
BEGIN
  -- Calcular total_valor desde las matrículas del grupo
  SELECT COALESCE(SUM(m.valor_cupo), 0)
  INTO _total_valor
  FROM public.grupo_cartera_matriculas gcm
  JOIN public.matriculas m ON m.id = gcm.matricula_id
  WHERE gcm.grupo_cartera_id = p_grupo_id;

  -- Calcular total_abonos desde los pagos de las facturas del grupo
  SELECT COALESCE(SUM(p.valor_pago), 0)
  INTO _total_abonos
  FROM public.pagos p
  JOIN public.facturas f ON f.id = p.factura_id
  WHERE f.grupo_cartera_id = p_grupo_id;

  _saldo := _total_valor - _total_abonos;

  -- Determinar estado
  SELECT EXISTS(SELECT 1 FROM public.facturas WHERE grupo_cartera_id = p_grupo_id)
  INTO _tiene_facturas;

  IF NOT _tiene_facturas THEN
    _nuevo_estado := 'sin_facturar';
  ELSE
    SELECT
      bool_and(f.estado = 'pagada'),
      bool_or(f.estado = 'parcial'),
      bool_or(f.fecha_vencimiento IS NOT NULL AND f.fecha_vencimiento < CURRENT_DATE AND f.estado != 'pagada')
    INTO _todas_pagadas, _alguna_parcial, _alguna_vencida
    FROM public.facturas f
    WHERE f.grupo_cartera_id = p_grupo_id;

    IF _alguna_vencida THEN
      _nuevo_estado := 'vencido';
    ELSIF _todas_pagadas THEN
      _nuevo_estado := 'pagado';
    ELSIF _alguna_parcial OR _total_abonos > 0 THEN
      _nuevo_estado := 'abonado';
    ELSE
      _nuevo_estado := 'facturado';
    END IF;
  END IF;

  UPDATE public.grupos_cartera
  SET total_valor = _total_valor,
      total_abonos = _total_abonos,
      saldo = _saldo,
      estado = _nuevo_estado,
      updated_at = now()
  WHERE id = p_grupo_id;
END;
$$;

-- Trigger function: recalcular factura y grupo después de INSERT/DELETE en pagos
CREATE OR REPLACE FUNCTION public.recalcular_estado_factura()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _factura_id UUID;
  _grupo_id UUID;
  _total_factura NUMERIC;
  _total_pagos NUMERIC;
  _nuevo_estado public.estado_factura;
BEGIN
  _factura_id := COALESCE(NEW.factura_id, OLD.factura_id);

  SELECT grupo_cartera_id, total INTO _grupo_id, _total_factura
  FROM public.facturas WHERE id = _factura_id;

  SELECT COALESCE(SUM(valor_pago), 0) INTO _total_pagos
  FROM public.pagos WHERE factura_id = _factura_id;

  IF _total_pagos >= _total_factura AND _total_factura > 0 THEN
    _nuevo_estado := 'pagada';
  ELSIF _total_pagos > 0 THEN
    _nuevo_estado := 'parcial';
  ELSE
    _nuevo_estado := 'por_pagar';
  END IF;

  UPDATE public.facturas SET estado = _nuevo_estado, updated_at = now()
  WHERE id = _factura_id;

  PERFORM public.recalcular_grupo_cartera(_grupo_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger function: sync factura data a matrículas vinculadas
CREATE OR REPLACE FUNCTION public.sync_factura_a_matriculas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Actualizar factura_numero en las matrículas vinculadas a esta factura
  UPDATE public.matriculas m
  SET factura_numero = NEW.numero_factura,
      fecha_facturacion = NEW.fecha_emision,
      updated_at = now()
  FROM public.factura_matriculas fm
  WHERE fm.factura_id = NEW.id AND fm.matricula_id = m.id;

  RETURN NEW;
END;
$$;

-- Trigger function: limpiar matrículas al eliminar factura
CREATE OR REPLACE FUNCTION public.on_delete_factura()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpiar datos de factura en matrículas vinculadas
  UPDATE public.matriculas m
  SET factura_numero = NULL,
      fecha_facturacion = NULL,
      updated_at = now()
  FROM public.factura_matriculas fm
  WHERE fm.factura_id = OLD.id AND fm.matricula_id = m.id;

  -- Recalcular grupo
  PERFORM public.recalcular_grupo_cartera(OLD.grupo_cartera_id);

  RETURN OLD;
END;
$$;

-- Trigger function: registrar actividad sistema al crear factura
CREATE OR REPLACE FUNCTION public.registrar_actividad_sistema_factura()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.actividades_cartera (grupo_cartera_id, factura_id, tipo, descripcion, fecha)
  VALUES (NEW.grupo_cartera_id, NEW.id, 'sistema',
    'Factura ' || COALESCE(NEW.numero_factura, 'S/N') || ' registrada por $' || NEW.total,
    now());
  RETURN NEW;
END;
$$;

-- Trigger function: registrar actividad sistema al registrar pago
CREATE OR REPLACE FUNCTION public.registrar_actividad_sistema_pago()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _grupo_id UUID;
BEGIN
  SELECT grupo_cartera_id INTO _grupo_id
  FROM public.facturas WHERE id = NEW.factura_id;

  INSERT INTO public.actividades_cartera (grupo_cartera_id, factura_id, tipo, descripcion, fecha)
  VALUES (_grupo_id, NEW.factura_id, 'sistema',
    'Pago de $' || NEW.valor_pago || ' registrado (' || NEW.metodo_pago || ')',
    now());
  RETURN NEW;
END;
$$;

-- ==================== TRIGGERS ====================

-- updated_at
CREATE TRIGGER update_responsables_pago_updated_at BEFORE UPDATE ON public.responsables_pago
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_grupos_cartera_updated_at BEFORE UPDATE ON public.grupos_cartera
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_facturas_updated_at BEFORE UPDATE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Recalcular factura/grupo al registrar/eliminar pagos
CREATE TRIGGER trg_recalcular_estado_factura_insert
  AFTER INSERT ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_estado_factura();
CREATE TRIGGER trg_recalcular_estado_factura_delete
  AFTER DELETE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.recalcular_estado_factura();

-- Sync factura a matrículas
CREATE TRIGGER trg_sync_factura_matriculas
  AFTER INSERT OR UPDATE OF numero_factura, fecha_emision ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.sync_factura_a_matriculas();

-- Limpiar al eliminar factura
CREATE TRIGGER trg_on_delete_factura
  BEFORE DELETE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.on_delete_factura();

-- Actividades sistema automáticas
CREATE TRIGGER trg_actividad_sistema_factura
  AFTER INSERT ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.registrar_actividad_sistema_factura();
CREATE TRIGGER trg_actividad_sistema_pago
  AFTER INSERT ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.registrar_actividad_sistema_pago();

-- Auditoría
CREATE TRIGGER audit_responsables_pago AFTER INSERT OR UPDATE OR DELETE ON public.responsables_pago
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('responsable_pago');
CREATE TRIGGER audit_grupos_cartera AFTER INSERT OR UPDATE OR DELETE ON public.grupos_cartera
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('grupo_cartera');
CREATE TRIGGER audit_facturas AFTER INSERT OR UPDATE OR DELETE ON public.facturas
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('factura');
CREATE TRIGGER audit_pagos AFTER INSERT OR UPDATE OR DELETE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('pago');
CREATE TRIGGER audit_actividades_cartera AFTER INSERT OR UPDATE OR DELETE ON public.actividades_cartera
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger_fn('actividad_cartera');
