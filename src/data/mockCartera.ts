import { ResponsablePago, GrupoCartera, Factura, FacturaMatricula, RegistroPago, ActividadCartera } from '@/types/cartera';

// ============ RESPONSABLES DE PAGO ============
export const mockResponsables: ResponsablePago[] = [
  {
    id: 'rp1',
    tipo: 'empresa',
    nombre: 'Constructora ABC S.A.S',
    nit: '900123456-1',
    contactoNombre: 'Sandra Milena López',
    contactoTelefono: '3201234567',
    contactoEmail: 'sandra.lopez@constructoraabc.com',
    direccionFacturacion: 'Calle 45 #12-30, Bogotá',
    observaciones: 'Empresa frecuente, buen historial de pago.',
  },
  {
    id: 'rp2',
    tipo: 'empresa',
    nombre: 'Infraestructuras del Norte S.A.',
    nit: '800567890-3',
    contactoNombre: 'Camila Herrera',
    contactoTelefono: '3109876543',
    contactoEmail: 'camila.herrera@infranorte.com',
    direccionFacturacion: 'Carrera 7 #80-15, Bucaramanga',
  },
  {
    id: 'rp3',
    tipo: 'independiente',
    nombre: 'Ana Maria Garcia Lopez',
    nit: '0987654321',
    contactoTelefono: '3112223344',
    contactoEmail: 'ana.garcia@email.com',
  },
  {
    id: 'rp4',
    tipo: 'empresa',
    nombre: 'Telecom Solutions S.A.S',
    nit: '901234567-8',
    contactoNombre: 'Andrés Patiño',
    contactoTelefono: '3154567890',
    contactoEmail: 'andres.patino@telecomsol.com',
    direccionFacturacion: 'Av. El Dorado #68-45, Bogotá',
  },
];

// ============ GRUPOS DE CARTERA ============
export const mockGruposCartera: GrupoCartera[] = [
  {
    id: 'gc1',
    responsablePagoId: 'rp1',
    estado: 'pagado',
    totalValor: 350000,
    totalAbonos: 350000,
    saldo: 0,
    matriculaIds: ['m1'],
    createdAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'gc2',
    responsablePagoId: 'rp2',
    estado: 'vencido',
    totalValor: 280000,
    totalAbonos: 100000,
    saldo: 180000,
    matriculaIds: ['m3'],
    observaciones: 'Pendiente completar pago restante.',
    createdAt: '2024-03-05T09:00:00Z',
  },
  {
    id: 'gc3',
    responsablePagoId: 'rp3',
    estado: 'pagado',
    totalValor: 350000,
    totalAbonos: 350000,
    saldo: 0,
    matriculaIds: ['m2'],
    createdAt: '2024-02-15T11:00:00Z',
  },
  {
    id: 'gc4',
    responsablePagoId: 'rp4',
    estado: 'pagado',
    totalValor: 500000,
    totalAbonos: 500000,
    saldo: 0,
    matriculaIds: ['m4'],
    createdAt: '2024-01-10T10:00:00Z',
  },
];

// ============ FACTURAS ============
export const mockFacturas: Factura[] = [
  {
    id: 'f1',
    grupoCarteraId: 'gc1',
    numeroFactura: 'FAC-2024-001',
    fechaEmision: '2024-02-17',
    fechaVencimiento: '2024-03-17',
    subtotal: 350000,
    total: 350000,
    estado: 'pagada',
    matriculaIds: ['m1'],
  },
  {
    id: 'f2',
    grupoCarteraId: 'gc2',
    numeroFactura: 'FAC-2024-004',
    fechaEmision: '2024-03-06',
    fechaVencimiento: '2024-04-06',
    subtotal: 280000,
    total: 280000,
    estado: 'parcial',
    matriculaIds: ['m3'],
  },
  {
    id: 'f3',
    grupoCarteraId: 'gc3',
    numeroFactura: 'FAC-2024-002',
    fechaEmision: '2024-02-15',
    fechaVencimiento: '2024-03-15',
    subtotal: 350000,
    total: 350000,
    estado: 'pagada',
    matriculaIds: ['m2'],
  },
  {
    id: 'f4',
    grupoCarteraId: 'gc4',
    numeroFactura: 'FAC-2024-003',
    fechaEmision: '2024-01-10',
    fechaVencimiento: '2024-02-10',
    subtotal: 500000,
    total: 500000,
    estado: 'pagada',
    matriculaIds: ['m4'],
  },
];

// ============ RELACION FACTURA-MATRICULA ============
export const mockFacturaMatriculas: FacturaMatricula[] = [
  { facturaId: 'f1', matriculaId: 'm1', valorAsignado: 350000 },
  { facturaId: 'f2', matriculaId: 'm3', valorAsignado: 280000 },
  { facturaId: 'f3', matriculaId: 'm2', valorAsignado: 350000 },
  { facturaId: 'f4', matriculaId: 'm4', valorAsignado: 500000 },
];

// ============ REGISTROS DE PAGO ============
export const mockPagos: RegistroPago[] = [
  {
    id: 'pago1',
    facturaId: 'f1',
    fechaPago: '2024-02-18',
    valorPago: 350000,
    metodoPago: 'transferencia',
    observaciones: 'Pago completo por transferencia bancaria.',
  },
  {
    id: 'pago2',
    facturaId: 'f2',
    fechaPago: '2024-03-10',
    valorPago: 100000,
    metodoPago: 'consignacion',
    observaciones: 'Abono parcial, pendiente $180.000.',
  },
  {
    id: 'pago3',
    facturaId: 'f3',
    fechaPago: '2024-02-16',
    valorPago: 350000,
    metodoPago: 'efectivo',
  },
  {
    id: 'pago4',
    facturaId: 'f4',
    fechaPago: '2024-01-11',
    valorPago: 500000,
    metodoPago: 'consignacion',
  },
];

// ============ ACTIVIDADES DE CARTERA ============
export const mockActividades: ActividadCartera[] = [
  {
    id: 'act1',
    grupoCarteraId: 'gc1',
    tipo: 'sistema',
    descripcion: 'Factura FAC-2024-001 creada por $350.000.',
    fecha: '2024-02-17T10:30:00Z',
    usuario: 'Sistema',
  },
  {
    id: 'act2',
    grupoCarteraId: 'gc1',
    tipo: 'sistema',
    descripcion: 'Pago registrado por $350.000 — Transferencia.',
    fecha: '2024-02-18T14:00:00Z',
    usuario: 'Sistema',
  },
  {
    id: 'act3',
    grupoCarteraId: 'gc2',
    tipo: 'sistema',
    descripcion: 'Factura FAC-2024-004 creada por $280.000.',
    fecha: '2024-03-06T09:15:00Z',
    usuario: 'Sistema',
  },
  {
    id: 'act4',
    grupoCarteraId: 'gc2',
    tipo: 'sistema',
    descripcion: 'Pago registrado por $100.000 — Consignación.',
    fecha: '2024-03-10T11:00:00Z',
    usuario: 'Sistema',
  },
  {
    id: 'act5',
    grupoCarteraId: 'gc2',
    tipo: 'llamada',
    descripcion: 'Se contactó a Camila Herrera para recordar saldo pendiente de $180.000.',
    fecha: '2024-03-20T09:00:00Z',
    usuario: 'Admin',
  },
  {
    id: 'act6',
    grupoCarteraId: 'gc2',
    tipo: 'promesa_pago',
    descripcion: 'Camila confirma pago para el 30 de marzo.',
    fecha: '2024-03-20T09:10:00Z',
    usuario: 'Admin',
  },
  {
    id: 'act7',
    grupoCarteraId: 'gc2',
    tipo: 'comentario',
    descripcion: 'La empresa solicita enviar nueva factura con datos actualizados.',
    fecha: '2024-03-25T14:30:00Z',
    usuario: 'Admin',
  },
];
