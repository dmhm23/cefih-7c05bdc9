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
import { mockMatriculas, mockAuditLogs } from '@/data/mockData';
import { mockEmpresas } from '@/data/mockEmpresas';
import {
  mockResponsables,
  mockGruposCartera,
  mockFacturas,
  mockPagos,
  mockActividades,
} from '@/data/mockCartera';
import { delay } from './api';

function addCarteraAuditLog(
  accion: 'crear' | 'editar' | 'eliminar',
  entidadTipo: 'factura' | 'pago' | 'grupo_cartera',
  entidadId: string,
  valorAnterior?: Record<string, unknown>,
  valorNuevo?: Record<string, unknown>,
  camposModificados?: string[]
) {
  mockAuditLogs.push({
    id: uuid(),
    entidadTipo,
    entidadId,
    accion,
    camposModificados,
    valorAnterior,
    valorNuevo,
    usuarioId: 'current_user',
    usuarioNombre: 'Usuario Actual',
    timestamp: new Date().toISOString(),
  });
}

// ─── helpers ──────────────────────────────────────────────
function recalcGrupo(grupo: GrupoCartera) {
  const facturas = mockFacturas.filter(f => f.grupoCarteraId === grupo.id);
  const pagos = mockPagos.filter(p => facturas.some(f => f.id === p.facturaId));
  grupo.totalAbonos = pagos.reduce((s, p) => s + p.valorPago, 0);
  grupo.saldo = grupo.totalValor - grupo.totalAbonos;

  if (grupo.saldo <= 0 && grupo.totalValor > 0) {
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
      grupo.estado = 'sin_facturar';
    }
  }
}

function recalcFactura(factura: Factura) {
  const pagos = mockPagos.filter(p => p.facturaId === factura.id);
  const totalPagado = pagos.reduce((s, p) => s + p.valorPago, 0);
  if (totalPagado >= factura.total) factura.estado = 'pagada';
  else if (totalPagado > 0) factura.estado = 'parcial';
  else factura.estado = 'por_pagar';
}

function addSystemActivity(grupoCarteraId: string, descripcion: string, facturaId?: string) {
  mockActividades.push({
    id: uuid(),
    grupoCarteraId,
    facturaId,
    tipo: 'sistema',
    descripcion,
    fecha: new Date().toISOString(),
    usuario: 'Sistema',
  });
}

// ─── auto-grouping ───────────────────────────────────────
/**
 * Assigns a matrícula to a cartera group automatically.
 * - For 'empresa': finds/creates ResponsablePago by NIT, then finds/creates GrupoCartera.
 * - For 'independiente': finds/creates ResponsablePago by persona document, then finds/creates GrupoCartera.
 */
export function asignarMatriculaACartera(params: {
  matriculaId: string;
  valorCupo: number;
  tipoVinculacion: 'empresa' | 'independiente' | 'arl';
  // Empresa fields
  empresaNombre?: string;
  empresaNit?: string;
  empresaContactoNombre?: string;
  empresaContactoTelefono?: string;
  // Independiente fields
  personaNombre?: string;
  personaDocumento?: string;
  personaTelefono?: string;
  personaEmail?: string;
}) {
  const {
    matriculaId, valorCupo, tipoVinculacion,
    empresaNombre, empresaNit, empresaContactoNombre, empresaContactoTelefono,
    personaNombre, personaDocumento, personaTelefono, personaEmail,
  } = params;

  let responsable: ResponsablePago | undefined;

  if ((tipoVinculacion === 'empresa' || tipoVinculacion === 'arl') && empresaNit) {
    // Find by NIT
    responsable = mockResponsables.find(r => r.nit === empresaNit);
    if (!responsable) {
      // Try to find empresaId from directorio
      const empresaDir = mockEmpresas.find(e => e.nit === empresaNit);
      responsable = {
        id: uuid(),
        tipo: tipoVinculacion as TipoResponsable,
        nombre: empresaNombre || 'Empresa sin nombre',
        nit: empresaNit,
        empresaId: empresaDir?.id,
        contactoNombre: empresaContactoNombre,
        contactoTelefono: empresaContactoTelefono,
      };
      mockResponsables.push(responsable);
    }
  } else {
    // Independiente — find by document number
    const nit = personaDocumento || uuid();
    responsable = mockResponsables.find(r => r.tipo === 'independiente' && r.nit === nit);
    if (!responsable) {
      responsable = {
        id: uuid(),
        tipo: 'independiente' as TipoResponsable,
        nombre: personaNombre || 'Independiente',
        nit,
        contactoTelefono: personaTelefono,
        contactoEmail: personaEmail,
      };
      mockResponsables.push(responsable);
    }
  }

  // Find or create GrupoCartera for this responsable
  let grupo = mockGruposCartera.find(g => g.responsablePagoId === responsable!.id);
  if (!grupo) {
    grupo = {
      id: uuid(),
      responsablePagoId: responsable.id,
      estado: 'sin_facturar',
      totalValor: 0,
      totalAbonos: 0,
      saldo: 0,
      matriculaIds: [],
      createdAt: new Date().toISOString(),
    };
    mockGruposCartera.push(grupo);
  }

  // Add matrícula to group if not already there
  if (!grupo.matriculaIds.includes(matriculaId)) {
    grupo.matriculaIds.push(matriculaId);
    grupo.totalValor += valorCupo || 0;
    grupo.saldo = grupo.totalValor - grupo.totalAbonos;
  }

  addSystemActivity(grupo.id, `Matrícula ${matriculaId} asignada automáticamente al grupo.`);

  return { responsableId: responsable.id, grupoId: grupo.id };
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
    archivoFactura?: string;
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
      estado: 'por_pagar',
      archivoFactura: data.archivoFactura,
      matriculaIds: data.matriculaIds,
    };
    mockFacturas.push(factura);
    addCarteraAuditLog('crear', 'factura', factura.id, undefined, { numeroFactura: data.numeroFactura, total: data.total });
    if (data.matriculaIds.length > 0) {
      data.matriculaIds.forEach(mId => {
        const mat = mockMatriculas.find(m => m.id === mId);
        if (mat) {
          mat.facturaNumero = data.numeroFactura;
          mat.fechaFacturacion = data.fechaEmision;
        }
      });
    }

    // Update grupo state
    const grupo = mockGruposCartera.find(g => g.id === data.grupoCarteraId);
    if (grupo) recalcGrupo(grupo);

    // Auto-log activity
    addSystemActivity(
      data.grupoCarteraId,
      `Factura ${data.numeroFactura} registrada por $${data.total.toLocaleString('es-CO')}.`,
      factura.id
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
    soportePago?: string;
  }): Promise<RegistroPago> {
    await delay(600);
    const pago: RegistroPago = { id: uuid(), ...data };
    mockPagos.push(pago);
    addCarteraAuditLog('crear', 'pago', pago.id, undefined, { valorPago: data.valorPago, metodoPago: data.metodoPago });

    // Recalc factura
    const factura = mockFacturas.find(f => f.id === data.facturaId);
    if (factura) {
      recalcFactura(factura);
      // Recalc grupo
      const grupo = mockGruposCartera.find(g => g.id === factura.grupoCarteraId);
      if (grupo) {
        recalcGrupo(grupo);
        // Auto-log activity
        const metodoLabel = METODO_PAGO_LABELS;
        addSystemActivity(
          grupo.id,
          `Pago registrado por $${data.valorPago.toLocaleString('es-CO')} — ${metodoLabel[data.metodoPago]}.`,
          data.facturaId
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

  async getActividadesByFactura(facturaId: string): Promise<ActividadCartera[]> {
    await delay(300);
    return mockActividades
      .filter(a => a.facturaId === facturaId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  },

  async registrarActividad(data: {
    grupoCarteraId: string;
    facturaId?: string;
    tipo: TipoActividadCartera;
    descripcion: string;
    usuario?: string;
  }): Promise<ActividadCartera> {
    await delay(400);
    const actividad: ActividadCartera = {
      id: uuid(),
      grupoCarteraId: data.grupoCarteraId,
      facturaId: data.facturaId,
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
    archivoFactura?: string;
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
    if (data.archivoFactura !== undefined) factura.archivoFactura = data.archivoFactura;
    recalcFactura(factura);
    addCarteraAuditLog('editar', 'factura', id, undefined, data as unknown as Record<string, unknown>, Object.keys(data));
    if (factura.matriculaIds?.length) {
      factura.matriculaIds.forEach(mId => {
        const mat = mockMatriculas.find(m => m.id === mId);
        if (mat) {
          mat.facturaNumero = factura.numeroFactura;
          mat.fechaFacturacion = factura.fechaEmision;
        }
      });
    }

    const grupo = mockGruposCartera.find(g => g.id === factura.grupoCarteraId);
    if (grupo) {
      recalcGrupo(grupo);
      addSystemActivity(grupo.id, `Factura ${factura.numeroFactura} actualizada.`, factura.id);
    }
    return { ...factura };
  },

  // Update pago
  async updatePago(id: string, data: {
    fechaPago?: string;
    valorPago?: number;
    metodoPago?: MetodoPago;
    observaciones?: string;
    soportePago?: string;
  }): Promise<RegistroPago | null> {
    await delay(500);
    const idx = mockPagos.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const pago = mockPagos[idx];
    if (data.fechaPago !== undefined) pago.fechaPago = data.fechaPago;
    if (data.valorPago !== undefined) pago.valorPago = data.valorPago;
    if (data.metodoPago !== undefined) pago.metodoPago = data.metodoPago;
    if (data.observaciones !== undefined) pago.observaciones = data.observaciones;
    if (data.soportePago !== undefined) pago.soportePago = data.soportePago;

    // Recalc factura & grupo
    const factura = mockFacturas.find(f => f.id === pago.facturaId);
    if (factura) {
      recalcFactura(factura);
      const grupo = mockGruposCartera.find(g => g.id === factura.grupoCarteraId);
      if (grupo) {
        recalcGrupo(grupo);
        addSystemActivity(grupo.id, `Pago actualizado — ${METODO_PAGO_LABELS[pago.metodoPago]} $${pago.valorPago.toLocaleString('es-CO')}.`, pago.facturaId);
      }
    }
    return { ...pago };
  },

  // Delete factura
  async deleteFactura(id: string): Promise<void> {
    await delay(500);
    const idx = mockFacturas.findIndex(f => f.id === id);
    if (idx === -1) return;
    const factura = mockFacturas[idx];
    // Remove associated payments first
    const pagoIds = mockPagos.filter(p => p.facturaId === id).map(p => p.id);
    pagoIds.forEach(pid => {
      const pi = mockPagos.findIndex(p => p.id === pid);
      if (pi !== -1) mockPagos.splice(pi, 1);
    });
    addCarteraAuditLog('eliminar', 'factura', id);
    mockFacturas.splice(idx, 1);
    // Recalc grupo
    const grupo = mockGruposCartera.find(g => g.id === factura.grupoCarteraId);
    if (grupo) {
      recalcGrupo(grupo);
      addSystemActivity(grupo.id, `Factura ${factura.numeroFactura} eliminada${pagoIds.length ? ` (con ${pagoIds.length} pago(s) asociados)` : ''}.`, id);
    }
  },

  // Delete pago
  async deletePago(id: string): Promise<void> {
    await delay(500);
    const idx = mockPagos.findIndex(p => p.id === id);
    if (idx === -1) return;
    const pago = mockPagos[idx];
    mockPagos.splice(idx, 1);
    // Recalc factura & grupo
    const factura = mockFacturas.find(f => f.id === pago.facturaId);
    if (factura) {
      recalcFactura(factura);
      const grupo = mockGruposCartera.find(g => g.id === factura.grupoCarteraId);
      if (grupo) {
        recalcGrupo(grupo);
        addSystemActivity(grupo.id, `Pago de $${pago.valorPago.toLocaleString('es-CO')} eliminado.`, pago.facturaId);
      }
    }
  },
};
