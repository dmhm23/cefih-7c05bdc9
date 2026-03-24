// ============ CARTERA ============

export type TipoResponsable = 'empresa' | 'independiente' | 'arl';
export type EstadoGrupoCartera = 'sin_facturar' | 'facturado' | 'abonado' | 'pagado' | 'vencido';
export type EstadoFactura = 'pendiente' | 'parcial' | 'pagada';
export type MetodoPago = 'transferencia' | 'efectivo' | 'consignacion' | 'tarjeta';
export type TipoActividadCartera = 'llamada' | 'promesa_pago' | 'comentario' | 'sistema';

export interface ResponsablePago {
  id: string;
  tipo: TipoResponsable;
  nombre: string;
  nit: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
  direccionFacturacion?: string;
  observaciones?: string;
}

export interface GrupoCartera {
  id: string;
  responsablePagoId: string;
  estado: EstadoGrupoCartera;
  totalValor: number;
  totalAbonos: number;
  saldo: number;
  matriculaIds: string[];
  observaciones?: string;
  createdAt: string;
}

export interface Factura {
  id: string;
  grupoCarteraId: string;
  numeroFactura: string;
  fechaEmision: string;
  fechaVencimiento: string;
  subtotal: number;
  total: number;
  estado: EstadoFactura;
  archivoFactura?: string;
  matriculaIds: string[];
}

export interface FacturaMatricula {
  facturaId: string;
  matriculaId: string;
  valorAsignado: number;
}

export interface RegistroPago {
  id: string;
  facturaId: string;
  fechaPago: string;
  valorPago: number;
  metodoPago: MetodoPago;
  soportePago?: string;
  observaciones?: string;
}

export interface ActividadCartera {
  id: string;
  grupoCarteraId: string;
  facturaId?: string;
  tipo: TipoActividadCartera;
  descripcion: string;
  fecha: string;
  usuario?: string;
}

// Labels
export const TIPO_RESPONSABLE_LABELS: Record<TipoResponsable, string> = {
  empresa: 'Empresa',
  independiente: 'Independiente',
  arl: 'ARL',
};

export const ESTADO_GRUPO_CARTERA_LABELS: Record<EstadoGrupoCartera, string> = {
  pendiente: 'Pendiente',
  facturado: 'Facturado',
  abonado: 'Abonado',
  pagado: 'Pagado',
  vencido: 'Vencido',
};

export const ESTADO_FACTURA_LABELS: Record<EstadoFactura, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagada: 'Pagada',
};

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  consignacion: 'Consignación',
  tarjeta: 'Tarjeta',
};

export const TIPO_ACTIVIDAD_LABELS: Record<TipoActividadCartera, string> = {
  llamada: 'Llamada',
  promesa_pago: 'Promesa de pago',
  comentario: 'Comentario',
  sistema: 'Sistema',
};
