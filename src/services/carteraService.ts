import { v4 as uuid } from 'uuid';
import {
  ResponsablePago,
  GrupoCartera,
  Factura,
  RegistroPago,
  EstadoGrupoCartera,
  EstadoFactura,
  MetodoPago,
} from '@/types/cartera';
import {
  mockResponsables,
  mockGruposCartera,
  mockFacturas,
  mockPagos,
} from '@/data/mockCartera';
import { delay } from './api';

// ─── helpers ──────────────────────────────────────────────
function recalcGrupo(grupo: GrupoCartera) {
  const facturas = mockFacturas.filter(f => f.grupoCarteraId === grupo.id);
  const pagos = mockPagos.filter(p => facturas.some(f => f.id === p.facturaId));
  grupo.totalAbonos = pagos.reduce((s, p) => s + p.valorPago, 0);
  grupo.saldo = grupo.totalValor - grupo.totalAbonos;

  if (grupo.saldo <= 0) grupo.estado = 'pagado';
  else if (grupo.totalAbonos > 0) grupo.estado = 'abonado';
  else if (facturas.length > 0) grupo.estado = 'facturado';
  else grupo.estado = 'pendiente';
}

function recalcFactura(factura: Factura) {
  const pagos = mockPagos.filter(p => p.facturaId === factura.id);
  const totalPagado = pagos.reduce((s, p) => s + p.valorPago, 0);
  if (totalPagado >= factura.total) factura.estado = 'pagada';
  else if (totalPagado > 0) factura.estado = 'parcial';
  else factura.estado = 'pendiente';
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
    return [...mockGruposCartera];
  },

  async getGrupoById(id: string): Promise<GrupoCartera | null> {
    await delay(400);
    return mockGruposCartera.find(g => g.id === id) || null;
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
      if (grupo) recalcGrupo(grupo);
    }

    return pago;
  },
};
