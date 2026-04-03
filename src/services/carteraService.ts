import { supabase } from '@/integrations/supabase/client';
import type {
  ResponsablePago,
  GrupoCartera,
  Factura,
  RegistroPago,
  ActividadCartera,
  MetodoPago,
  TipoActividadCartera,
  TipoResponsable,
} from '@/types/cartera';

// ─── helpers: map DB rows to domain types ─────────────────

function mapResponsable(row: any): ResponsablePago {
  return {
    id: row.id,
    tipo: row.tipo,
    nombre: row.nombre,
    nit: row.nit,
    empresaId: row.empresa_id ?? undefined,
    contactoNombre: row.contacto_nombre ?? undefined,
    contactoTelefono: row.contacto_telefono ?? undefined,
    contactoEmail: row.contacto_email ?? undefined,
    direccionFacturacion: row.direccion_facturacion ?? undefined,
    observaciones: row.observaciones ?? undefined,
  };
}

function mapGrupo(row: any): GrupoCartera {
  return {
    id: row.id,
    responsablePagoId: row.responsable_pago_id,
    estado: row.estado,
    totalValor: Number(row.total_valor),
    totalAbonos: Number(row.total_abonos),
    saldo: Number(row.saldo),
    matriculaIds: row.matricula_ids ?? [],
    observaciones: row.observaciones ?? undefined,
    createdAt: row.created_at,
  };
}

function mapFactura(row: any): Factura {
  return {
    id: row.id,
    grupoCarteraId: row.grupo_cartera_id,
    numeroFactura: row.numero_factura,
    fechaEmision: row.fecha_emision,
    fechaVencimiento: row.fecha_vencimiento,
    subtotal: Number(row.subtotal),
    total: Number(row.total),
    estado: row.estado,
    archivoFactura: row.archivo_factura ?? undefined,
    matriculaIds: row.matricula_ids ?? [],
  };
}

function mapPago(row: any): RegistroPago {
  return {
    id: row.id,
    facturaId: row.factura_id,
    fechaPago: row.fecha_pago,
    valorPago: Number(row.valor_pago),
    metodoPago: row.metodo_pago,
    soportePago: row.soporte_pago ?? undefined,
    observaciones: row.observaciones ?? undefined,
  };
}

function mapActividad(row: any): ActividadCartera {
  return {
    id: row.id,
    grupoCarteraId: row.grupo_cartera_id,
    facturaId: row.factura_id ?? undefined,
    tipo: row.tipo,
    descripcion: row.descripcion,
    fecha: row.fecha,
    usuario: row.usuario ?? undefined,
  };
}

// ─── auto-grouping ───────────────────────────────────────
export async function asignarMatriculaACartera(params: {
  matriculaId: string;
  valorCupo: number;
  tipoVinculacion: TipoResponsable;
  empresaNombre?: string;
  empresaNit?: string;
  empresaId?: string;
  empresaContactoNombre?: string;
  empresaContactoTelefono?: string;
  personaNombre?: string;
  personaDocumento?: string;
  personaTelefono?: string;
  personaEmail?: string;
}): Promise<{ responsableId: string; grupoId: string }> {
  const {
    matriculaId, valorCupo, tipoVinculacion,
    empresaNombre, empresaNit, empresaId, empresaContactoNombre, empresaContactoTelefono,
    personaNombre, personaDocumento, personaTelefono, personaEmail,
  } = params;

  let responsable: ResponsablePago | null = null;

  if ((tipoVinculacion === 'empresa' || tipoVinculacion === 'arl') && empresaNit) {
    // Find by NIT
    const { data: existing } = await supabase
      .from('responsables_pago')
      .select('*')
      .eq('nit', empresaNit)
      .eq('tipo', tipoVinculacion)
      .maybeSingle();

    if (existing) {
      responsable = mapResponsable(existing);
    } else {
      const { data: created, error } = await supabase
        .from('responsables_pago')
        .insert({
          tipo: tipoVinculacion,
          nombre: empresaNombre || 'Empresa sin nombre',
          nit: empresaNit,
          empresa_id: empresaId || null,
          contacto_nombre: empresaContactoNombre || null,
          contacto_telefono: empresaContactoTelefono || null,
        })
        .select()
        .single();
      if (error) throw error;
      responsable = mapResponsable(created);
    }
  } else {
    // Independiente
    const nit = personaDocumento || '';
    const { data: existing } = await supabase
      .from('responsables_pago')
      .select('*')
      .eq('tipo', 'independiente')
      .eq('nit', nit)
      .maybeSingle();

    if (existing) {
      responsable = mapResponsable(existing);
    } else {
      const { data: created, error } = await supabase
        .from('responsables_pago')
        .insert({
          tipo: 'independiente' as TipoResponsable,
          nombre: personaNombre || 'Independiente',
          nit,
          contacto_telefono: personaTelefono || null,
          contacto_email: personaEmail || null,
        })
        .select()
        .single();
      if (error) throw error;
      responsable = mapResponsable(created);
    }
  }

  // Find or create grupo for this responsable
  const { data: existingGrupo } = await supabase
    .from('grupos_cartera')
    .select('*')
    .eq('responsable_pago_id', responsable!.id)
    .maybeSingle();

  let grupoId: string;
  if (existingGrupo) {
    grupoId = existingGrupo.id;
  } else {
    const { data: newGrupo, error } = await supabase
      .from('grupos_cartera')
      .insert({ responsable_pago_id: responsable!.id })
      .select()
      .single();
    if (error) throw error;
    grupoId = newGrupo.id;
  }

  // Link matrícula to grupo
  await supabase
    .from('grupo_cartera_matriculas')
    .upsert({ grupo_cartera_id: grupoId, matricula_id: matriculaId });

  // Recalcular grupo (trigger-based, but force refresh)
  await supabase.rpc('recalcular_grupo_cartera', { p_grupo_id: grupoId });

  return { responsableId: responsable!.id, grupoId };
}

// ─── service ──────────────────────────────────────────────
export const carteraService = {
  // Responsables
  async getResponsables(): Promise<ResponsablePago[]> {
    const { data, error } = await supabase
      .from('responsables_pago')
      .select('*')
      .is('deleted_at', null)
      .order('nombre');
    if (error) throw error;
    return (data || []).map(mapResponsable);
  },

  async getResponsableById(id: string): Promise<ResponsablePago | null> {
    const { data, error } = await supabase
      .from('responsables_pago')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapResponsable(data) : null;
  },

  async createResponsable(data: Omit<ResponsablePago, 'id'>): Promise<ResponsablePago> {
    const { data: created, error } = await supabase
      .from('responsables_pago')
      .insert({
        tipo: data.tipo,
        nombre: data.nombre,
        nit: data.nit,
        empresa_id: data.empresaId || null,
        contacto_nombre: data.contactoNombre || null,
        contacto_telefono: data.contactoTelefono || null,
        contacto_email: data.contactoEmail || null,
        direccion_facturacion: data.direccionFacturacion || null,
        observaciones: data.observaciones || null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapResponsable(created);
  },

  // Grupos
  async getGrupos(): Promise<GrupoCartera[]> {
    const { data, error } = await supabase
      .from('grupos_cartera')
      .select('*, grupo_cartera_matriculas(matricula_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({
      ...mapGrupo(row),
      matriculaIds: (row.grupo_cartera_matriculas || []).map((gcm: any) => gcm.matricula_id),
    }));
  },

  async getGrupoById(id: string): Promise<GrupoCartera | null> {
    const { data, error } = await supabase
      .from('grupos_cartera')
      .select('*, grupo_cartera_matriculas(matricula_id)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      ...mapGrupo(data),
      matriculaIds: (data.grupo_cartera_matriculas || []).map((gcm: any) => gcm.matricula_id),
    };
  },

  // Facturas
  async getFacturasByGrupo(grupoId: string): Promise<Factura[]> {
    const { data, error } = await supabase
      .from('facturas')
      .select('*, factura_matriculas(matricula_id)')
      .eq('grupo_cartera_id', grupoId)
      .order('fecha_emision', { ascending: false });
    if (error) throw error;
    return (data || []).map(row => ({
      ...mapFactura(row),
      matriculaIds: (row.factura_matriculas || []).map((fm: any) => fm.matricula_id),
    }));
  },

  async createFactura(data: {
    grupoCarteraId: string;
    numeroFactura: string;
    fechaEmision: string;
    fechaVencimiento: string;
    matriculaIds: string[];
    total: number;
    archivoFactura?: string;
  }): Promise<Factura> {
    const { data: created, error } = await supabase
      .from('facturas')
      .insert({
        grupo_cartera_id: data.grupoCarteraId,
        numero_factura: data.numeroFactura,
        fecha_emision: data.fechaEmision,
        fecha_vencimiento: data.fechaVencimiento,
        subtotal: data.total,
        total: data.total,
        archivo_factura: data.archivoFactura || null,
      })
      .select()
      .single();
    if (error) throw error;

    // Link matrículas
    if (data.matriculaIds.length > 0) {
      const links = data.matriculaIds.map(mId => ({
        factura_id: created.id,
        matricula_id: mId,
        valor_asignado: 0,
      }));
      await supabase.from('factura_matriculas').insert(links);
    }

    // Recalc grupo (triggers handle factura state + activities)
    await supabase.rpc('recalcular_grupo_cartera', { p_grupo_id: data.grupoCarteraId });

    return { ...mapFactura(created), matriculaIds: data.matriculaIds };
  },

  async updateFactura(id: string, data: {
    numeroFactura?: string;
    fechaEmision?: string;
    fechaVencimiento?: string;
    total?: number;
    archivoFactura?: string;
  }): Promise<Factura | null> {
    const updateObj: Record<string, unknown> = {};
    if (data.numeroFactura !== undefined) updateObj.numero_factura = data.numeroFactura;
    if (data.fechaEmision !== undefined) updateObj.fecha_emision = data.fechaEmision;
    if (data.fechaVencimiento !== undefined) updateObj.fecha_vencimiento = data.fechaVencimiento;
    if (data.total !== undefined) {
      updateObj.subtotal = data.total;
      updateObj.total = data.total;
    }
    if (data.archivoFactura !== undefined) updateObj.archivo_factura = data.archivoFactura;

    const { data: updated, error } = await supabase
      .from('facturas')
      .update(updateObj)
      .eq('id', id)
      .select('*, factura_matriculas(matricula_id)')
      .single();
    if (error) throw error;

    // Recalc grupo
    await supabase.rpc('recalcular_grupo_cartera', { p_grupo_id: updated.grupo_cartera_id });

    return {
      ...mapFactura(updated),
      matriculaIds: (updated.factura_matriculas || []).map((fm: any) => fm.matricula_id),
    };
  },

  async deleteFactura(id: string): Promise<void> {
    // Get grupo_cartera_id before delete
    const { data: factura } = await supabase
      .from('facturas')
      .select('grupo_cartera_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('facturas').delete().eq('id', id);
    if (error) throw error;

    // Trigger handles cleanup; recalc grupo
    if (factura) {
      await supabase.rpc('recalcular_grupo_cartera', { p_grupo_id: factura.grupo_cartera_id });
    }
  },

  // Pagos
  async getPagosByFactura(facturaId: string): Promise<RegistroPago[]> {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('factura_id', facturaId)
      .order('fecha_pago', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapPago);
  },

  async getPagosByGrupo(grupoId: string): Promise<RegistroPago[]> {
    const { data: facturas } = await supabase
      .from('facturas')
      .select('id')
      .eq('grupo_cartera_id', grupoId);

    if (!facturas || facturas.length === 0) return [];

    const facturaIds = facturas.map(f => f.id);
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .in('factura_id', facturaIds)
      .order('fecha_pago', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapPago);
  },

  async registrarPago(data: {
    facturaId: string;
    fechaPago: string;
    valorPago: number;
    metodoPago: MetodoPago;
    observaciones?: string;
    soportePago?: string;
  }): Promise<RegistroPago> {
    const { data: created, error } = await supabase
      .from('pagos')
      .insert({
        factura_id: data.facturaId,
        fecha_pago: data.fechaPago,
        valor_pago: data.valorPago,
        metodo_pago: data.metodoPago,
        observaciones: data.observaciones || null,
        soporte_pago: data.soportePago || null,
      })
      .select()
      .single();
    if (error) throw error;
    // Triggers handle recalculation of factura state + grupo + activity log
    return mapPago(created);
  },

  async updatePago(id: string, data: {
    fechaPago?: string;
    valorPago?: number;
    metodoPago?: MetodoPago;
    observaciones?: string;
    soportePago?: string;
  }): Promise<RegistroPago | null> {
    const updateObj: Record<string, unknown> = {};
    if (data.fechaPago !== undefined) updateObj.fecha_pago = data.fechaPago;
    if (data.valorPago !== undefined) updateObj.valor_pago = data.valorPago;
    if (data.metodoPago !== undefined) updateObj.metodo_pago = data.metodoPago;
    if (data.observaciones !== undefined) updateObj.observaciones = data.observaciones;
    if (data.soportePago !== undefined) updateObj.soporte_pago = data.soportePago;

    const { data: updated, error } = await supabase
      .from('pagos')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapPago(updated);
  },

  async deletePago(id: string): Promise<void> {
    const { error } = await supabase.from('pagos').delete().eq('id', id);
    if (error) throw error;
    // Triggers handle recalculation
  },

  // Actividades
  async getActividadesByGrupo(grupoId: string): Promise<ActividadCartera[]> {
    const { data, error } = await supabase
      .from('actividades_cartera')
      .select('*')
      .eq('grupo_cartera_id', grupoId)
      .order('fecha', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapActividad);
  },

  async getActividadesByFactura(facturaId: string): Promise<ActividadCartera[]> {
    const { data, error } = await supabase
      .from('actividades_cartera')
      .select('*')
      .eq('factura_id', facturaId)
      .order('fecha', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapActividad);
  },

  async registrarActividad(data: {
    grupoCarteraId: string;
    facturaId?: string;
    tipo: TipoActividadCartera;
    descripcion: string;
    usuario?: string;
  }): Promise<ActividadCartera> {
    const { data: created, error } = await supabase
      .from('actividades_cartera')
      .insert({
        grupo_cartera_id: data.grupoCarteraId,
        factura_id: data.facturaId || null,
        tipo: data.tipo,
        descripcion: data.descripcion,
        usuario: data.usuario || 'Admin',
      })
      .select()
      .single();
    if (error) throw error;
    return mapActividad(created);
  },
};
