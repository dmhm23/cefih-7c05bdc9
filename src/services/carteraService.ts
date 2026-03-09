import { v4 as uuid } from 'uuid';
import {
  ResponsablePago,
  GrupoCartera,
  Factura,
  RegistroPago,
  ActividadCartera,
  MetodoPago,
  TipoActividadCartera,
  TipoResponsable,
  METODO_PAGO_LABELS,
} from '@/types/cartera';
import {
  mockResponsables,
  mockGruposCartera,
  mockFacturas,
  mockPagos,
  mockActividades,
} from '@/data/mockCartera';
import { delay } from './api';

// ─── helpers ──────────────────────────────────────────────
function recalcGrupo(grupo: GrupoCartera) {
  const facturas = mockFacturas.filter(f => f.grupoCarteraId === grupo.id);
  const pagos = mockPagos.filter(p => facturas.some(f => f.id === p.facturaId));
  grupo.totalAbonos = pagos.reduce((s, p) => s + p.valorPago, 0);
  grupo.saldo = grupo.totalValor - grupo.totalAbonos;

  if (grupo.saldo <= 0) {
    grupo.estado = 'pagado';
  } else {
    // Check for overdue invoices
    const now = new Date();
    const hasOverdue = facturas.some(f => f.estado !== 'pagada' && new Date(f.fechaVencimiento) < now);
    if (hasOverdue) {
      grupo.estado = 'vencido';
    } else if (grupo.totalAbonos > 0) {
      grupo.estado = 'abonado';
    } else if (facturas.length > 0) {
      grupo.estado = 'facturado';
    } else {
      grupo.estado = 'pendiente';
    }
  }
}

function recalcFactura(factura: Factura) {
  const pagos = mockPagos.filter(p => p.facturaId === factura.id);
  const totalPagado = pagos.reduce((s, p) => s + p.valorPago, 0);
  if (totalPagado >= factura.total) factura.estado = 'pagada';
  else if (totalPagado > 0) factura.estado = 'parcial';
  else factura.estado = 'pendiente';
}

function addSystemActivity(grupoCarteraId: string, descripcion: string) {
  mockActividades.push({
    id: uuid(),
    grupoCarteraId,
    tipo: 'sistema',
    descripcion,
    fecha: new Date().toISOString(),
    usuario: 'Sistema',
  });
}

// ─── service ──────────────────────────────────────────────
export const carteraService = {
  // Responsables
  async getResponsables(): Promise<ResponsablePago[]> {
    await delay(500);
    return [...mockResponsables];
  },

  async getResponsableById(id: string): Promise<ResponsablePago | null> {
    await delay(300);
    return mockResponsables.find(r => r.id === id) || null;
  },

  async createResponsable(data: Omit<ResponsablePago, 'id'>): Promise<ResponsablePago> {
    await delay(500);
    const nuevo: ResponsablePago = { id: uuid(), ...data };
    mockResponsables.push(nuevo);
    return nuevo;
  },

  // Grupos
  async getGrupos(): Promise<GrupoCartera[]> {
    await delay(600);
    // Recalc all groups to detect overdue on every fetch
    mockGruposCartera.forEach(g => recalcGrupo(g));
    return [...mockGruposCartera];
  },

  async getGrupoById(id: string): Promise<GrupoCartera | null> {
    await delay(400);
    const grupo = mockGruposCartera.find(g => g.id === id);
    if (grupo) recalcGrupo(grupo);
    return grupo || null;
  },

  // Facturas
  async getFacturasByGrupo(grupoId: string): Promise<Factura[]> {
    await delay(400);
    return mockFacturas.filter(f => f.grupoCarteraId === grupoId);
  },

  async createFactura(data: {
    grupoCarteraId: string;
    numeroFactura: string;
    fechaEmision: string;
    fechaVencimiento: string;
    matriculaIds: string[];
    total: number;
  }): Promise<Factura> {
    await delay(600);
    const factura: Factura = {
      id: uuid(),
      grupoCarteraId: data.grupoCarteraId,
      numeroFactura: data.numeroFactura,
      fechaEmision: data.fechaEmision,
      fechaVencimiento: data.fechaVencimiento,
      subtotal: data.total,
      total: data.total,
      estado: 'pendiente',
      matriculaIds: data.matriculaIds,
    };
    mockFacturas.push(factura);

    // Update grupo state
    const grupo = mockGruposCartera.find(g => g.id === data.grupoCarteraId);
    if (grupo) recalcGrupo(grupo);

    // Auto-log activity
    addSystemActivity(
      data.grupoCarteraId,
      `Factura ${data.numeroFactura} creada por $${data.total.toLocaleString('es-CO')}.`
    );

    return factura;
  },

  // Pagos
  async getPagosByFactura(facturaId: string): Promise<RegistroPago[]> {
    await delay(400);
    return mockPagos.filter(p => p.facturaId === facturaId);
  },

  async getPagosByGrupo(grupoId: string): Promise<RegistroPago[]> {
    await delay(400);
    const facturaIds = mockFacturas
      .filter(f => f.grupoCarteraId === grupoId)
      .map(f => f.id);
    return mockPagos.filter(p => facturaIds.includes(p.facturaId));
  },

  async registrarPago(data: {
    facturaId: string;
    fechaPago: string;
    valorPago: number;
    metodoPago: MetodoPago;
    observaciones?: string;
  }): Promise<RegistroPago> {
    await delay(600);
    const pago: RegistroPago = { id: uuid(), ...data };
    mockPagos.push(pago);

    // Recalc factura
    const factura = mockFacturas.find(f => f.id === data.facturaId);
    if (factura) {
      recalcFactura(factura);
      // Recalc grupo
      const grupo = mockGruposCartera.find(g => g.id === factura.grupoCarteraId);
      if (grupo) {
        recalcGrupo(grupo);
        // Auto-log activity
        const metodoLabel = { transferencia: 'Transferencia', efectivo: 'Efectivo', consignacion: 'Consignación', tarjeta: 'Tarjeta' };
        addSystemActivity(
          grupo.id,
          `Pago registrado por $${data.valorPago.toLocaleString('es-CO')} — ${metodoLabel[data.metodoPago]}.`
        );
      }
    }

    return pago;
  },

  // Actividades
  async getActividadesByGrupo(grupoId: string): Promise<ActividadCartera[]> {
    await delay(400);
    return mockActividades
      .filter(a => a.grupoCarteraId === grupoId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  async registrarActividad(data: {
    grupoCarteraId: string;
    tipo: TipoActividadCartera;
    descripcion: string;
    usuario?: string;
  }): Promise<ActividadCartera> {
    await delay(400);
    const actividad: ActividadCartera = {
      id: uuid(),
      grupoCarteraId: data.grupoCarteraId,
      tipo: data.tipo,
      descripcion: data.descripcion,
      fecha: new Date().toISOString(),
      usuario: data.usuario || 'Admin',
    };
    mockActividades.push(actividad);
    return actividad;
  },

  // Update factura
  async updateFactura(id: string, data: {
    numeroFactura?: string;
    fechaEmision?: string;
    fechaVencimiento?: string;
    total?: number;
  }): Promise<Factura | null> {
    await delay(500);
    const idx = mockFacturas.findIndex(f => f.id === id);
    if (idx === -1) return null;
    const factura = mockFacturas[idx];
    if (data.numeroFactura !== undefined) factura.numeroFactura = data.numeroFactura;
    if (data.fechaEmision !== undefined) factura.fechaEmision = data.fechaEmision;
    if (data.fechaVencimiento !== undefined) factura.fechaVencimiento = data.fechaVencimiento;
    if (data.total !== undefined) {
      factura.subtotal = data.total;
      factura.total = data.total;
    }
    recalcFactura(factura);
    const grupo = mockGruposCartera.find(g => g.id === factura.grupoCarteraId);
    if (grupo) {
      recalcGrupo(grupo);
      addSystemActivity(grupo.id, `Factura ${factura.numeroFactura} actualizada.`);
    }
    return { ...factura };
  },

  // Update pago
  async updatePago(id: string, data: {
    fechaPago?: string;
    valorPago?: number;
    metodoPago?: MetodoPago;
    observaciones?: string;
  }): Promise<RegistroPago | null> {
    await delay(500);
    const idx = mockPagos.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const pago = mockPagos[idx];
    if (data.fechaPago !== undefined) pago.fechaPago = data.fechaPago;
    if (data.valorPago !== undefined) pago.valorPago = data.valorPago;
    if (data.metodoPago !== undefined) pago.metodoPago = data.metodoPago;
    if (data.observaciones !== undefined) pago.observaciones = data.observaciones;

    // Recalc factura & grupo
    const factura = mockFacturas.find(f => f.id === pago.facturaId);
    if (factura) {
      recalcFactura(factura);
      const grupo = mockGruposCartera.find(g => g.id === factura.grupoCarteraId);
      if (grupo) {
        recalcGrupo(grupo);
        addSystemActivity(grupo.id, `Pago actualizado — ${METODO_PAGO_LABELS[pago.metodoPago]} $${pago.valorPago.toLocaleString('es-CO')}.`);
      }
    }
    return { ...pago };
  },
};
