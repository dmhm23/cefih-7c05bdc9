// ============ CARTERA ============

export type TipoResponsable = 'empresa' | 'independiente' | 'arl';
export type EstadoGrupoCartera = 'sin_facturar' | 'facturado' | 'abonado' | 'pagado' | 'vencido';
export type EstadoFactura = 'por_pagar' | 'parcial' | 'pagada';
export type MetodoPago = 'transferencia_bancaria' | 'efectivo' | 'consignacion' | 'nequi' | 'daviplata' | 'bre_b' | 'corresponsal_bancario' | 'otro';
export type TipoActividadCartera = 'llamada' | 'promesa_pago' | 'comentario' | 'sistema';

export interface ResponsablePago {
  id: string;
  tipo: TipoResponsable;
  nombre: string;
  nit: string;
  empresaId?: string;
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
  sin_facturar: 'Sin facturar',
  facturado: 'Facturado',
  abonado: 'Abonado',
  pagado: 'Pagado',
  vencido: 'Vencido',
};

export const ESTADO_FACTURA_LABELS: Record<EstadoFactura, string> = {
  por_pagar: 'Por pagar',
  parcial: 'Parcial',
  pagada: 'Pagada',
};

export const METODO_PAGO_LABELS: Record<MetodoPago, string> = {
  transferencia_bancaria: 'Transferencia Bancaria',
  efectivo: 'Efectivo',
  consignacion: 'Consignación',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  bre_b: 'Bre-b',
  corresponsal_bancario: 'Corresponsal Bancario',
  otro: '+ Añadir opción',
};

export const TIPO_ACTIVIDAD_LABELS: Record<TipoActividadCartera, string> = {
  llamada: 'Llamada',
  promesa_pago: 'Promesa de pago',
  comentario: 'Comentario',
  sistema: 'Sistema',
};
