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
  // Nuevos responsables
  {
    id: 'rp5',
    tipo: 'empresa',
    nombre: 'Energía Solar del Caribe S.A.S',
    nit: '902345678-5',
    contactoNombre: 'Ricardo Mendoza',
    contactoTelefono: '3189876543',
    contactoEmail: 'ricardo.mendoza@energiasolar.com',
    direccionFacturacion: 'Calle 72 #10-20, Barranquilla',
  },
  {
    id: 'rp6',
    tipo: 'empresa',
    nombre: 'Minera Andina S.A.S',
    nit: '903456789-2',
    contactoNombre: 'Luis Arango',
    contactoTelefono: '3176543210',
    contactoEmail: 'luis.arango@mineraandina.com',
    direccionFacturacion: 'Carrera 15 #45-60, Bucaramanga',
  },
  // Independientes nuevos
  {
    id: 'rp7',
    tipo: 'independiente',
    nombre: 'María Valentina Ospina Cruz',
    nit: '2233445566',
    contactoTelefono: '3143216789',
    contactoEmail: 'maria.ospina@email.com',
  },
  {
    id: 'rp8',
    tipo: 'independiente',
    nombre: 'Carlos Alberto Valencia Restrepo',
    nit: '1012345678',
    contactoTelefono: '3008765432',
    contactoEmail: 'carlos.valencia@email.com',
  },
  {
    id: 'rp9',
    tipo: 'independiente',
    nombre: 'Alejandra Rincón Vega',
    nit: '1054321098',
    contactoTelefono: '3145678901',
    contactoEmail: 'alejandra.rincon@email.com',
  },
  {
    id: 'rp10',
    tipo: 'independiente',
    nombre: 'Fabián Duarte Acosta',
    nit: '1065432109',
    contactoTelefono: '3006789012',
    contactoEmail: 'fabian.duarte@email.com',
  },
  {
    id: 'rp11',
    tipo: 'independiente',
    nombre: 'Viviana Molina Zapata',
    nit: '1076543210',
    contactoTelefono: '3187890123',
    contactoEmail: 'viviana.molina@email.com',
  },
  {
    id: 'rp12',
    tipo: 'independiente',
    nombre: 'Hernán Aguilar Romero',
    nit: '1087654321',
    contactoTelefono: '3228901234',
    contactoEmail: 'hernan.aguilar@email.com',
  },
  {
    id: 'rp13',
    tipo: 'independiente',
    nombre: 'Edwin Cortés Beltrán',
    nit: '1019876543',
    contactoTelefono: '3001234568',
    contactoEmail: 'edwin.cortes@email.com',
  },
  {
    id: 'rp14',
    tipo: 'independiente',
    nombre: 'Yesenia Contreras Medina',
    nit: '4455667788',
    contactoTelefono: '3152345678',
    contactoEmail: 'yesenia.contreras@email.com',
  },
];

// ============ GRUPOS DE CARTERA ============
export const mockGruposCartera: GrupoCartera[] = [
  // Constructora ABC — m1, m5, m6, m7
  {
    id: 'gc1',
    responsablePagoId: 'rp1',
    estado: 'abonado',
    totalValor: 1400000, // 350k x4
    totalAbonos: 1250000, // m1:350k + m5:350k + m6:350k + m7:200k
    saldo: 150000,
    matriculaIds: ['m1', 'm5', 'm6', 'm7'],
    createdAt: '2024-02-15T10:00:00Z',
  },
  // Infra del Norte — m3, m11, m12
  {
    id: 'gc2',
    responsablePagoId: 'rp2',
    estado: 'vencido',
    totalValor: 840000, // 280k x3
    totalAbonos: 380000, // m3:100k + m11:280k + m12:0
    saldo: 460000,
    matriculaIds: ['m3', 'm11', 'm12'],
    observaciones: 'Pendiente completar pago restante.',
    createdAt: '2024-03-05T09:00:00Z',
  },
  // Ana Maria Garcia (independiente) — m2
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
  // Telecom Solutions — m4, m13, m14
  {
    id: 'gc4',
    responsablePagoId: 'rp4',
    estado: 'abonado',
    totalValor: 1060000, // 500k + 280k + 280k
    totalAbonos: 930000, // m4:500k + m13:280k + m14:150k
    saldo: 130000,
    matriculaIds: ['m4', 'm13', 'm14'],
    createdAt: '2024-01-10T10:00:00Z',
  },
  // Energía Solar del Caribe — m8, m9, m22
  {
    id: 'gc5',
    responsablePagoId: 'rp5',
    estado: 'abonado',
    totalValor: 1050000, // 400k + 400k + 250k
    totalAbonos: 650000, // m8:0 + m9:400k + m22:250k
    saldo: 400000,
    matriculaIds: ['m8', 'm9', 'm22'],
    createdAt: '2024-03-03T08:00:00Z',
  },
  // Minera Andina — m16, m17
  {
    id: 'gc6',
    responsablePagoId: 'rp6',
    estado: 'abonado',
    totalValor: 600000, // 300k x2
    totalAbonos: 300000, // m16:0 + m17:300k
    saldo: 300000,
    matriculaIds: ['m16', 'm17'],
    createdAt: '2024-03-06T08:00:00Z',
  },
  // Independientes
  { id: 'gc7', responsablePagoId: 'rp7', estado: 'pagado', totalValor: 350000, totalAbonos: 350000, saldo: 0, matriculaIds: ['m10'], createdAt: '2024-03-03T10:00:00Z' },
  { id: 'gc8', responsablePagoId: 'rp8', estado: 'pagado', totalValor: 280000, totalAbonos: 280000, saldo: 0, matriculaIds: ['m15'], createdAt: '2024-03-06T08:00:00Z' },
  { id: 'gc9', responsablePagoId: 'rp9', estado: 'pagado', totalValor: 300000, totalAbonos: 300000, saldo: 0, matriculaIds: ['m18'], createdAt: '2024-03-07T09:00:00Z' },
  { id: 'gc10', responsablePagoId: 'rp10', estado: 'pendiente', totalValor: 300000, totalAbonos: 0, saldo: 300000, matriculaIds: ['m19'], createdAt: '2024-03-08T08:00:00Z' },
  { id: 'gc11', responsablePagoId: 'rp11', estado: 'pagado', totalValor: 250000, totalAbonos: 250000, saldo: 0, matriculaIds: ['m20'], createdAt: '2024-03-08T08:00:00Z' },
  { id: 'gc12', responsablePagoId: 'rp12', estado: 'pendiente', totalValor: 250000, totalAbonos: 0, saldo: 250000, matriculaIds: ['m21'], createdAt: '2024-03-09T08:00:00Z' },
  { id: 'gc13', responsablePagoId: 'rp13', estado: 'abonado', totalValor: 250000, totalAbonos: 125000, saldo: 125000, matriculaIds: ['m23'], createdAt: '2024-03-10T08:00:00Z' },
  { id: 'gc14', responsablePagoId: 'rp14', estado: 'pendiente', totalValor: 250000, totalAbonos: 0, saldo: 250000, matriculaIds: ['m24'], createdAt: '2024-03-10T09:00:00Z' },
];

// ============ FACTURAS ============
export const mockFacturas: Factura[] = [
  // Constructora ABC
  {
    id: 'f1', grupoCarteraId: 'gc1', numeroFactura: 'FAC-2024-001', fechaEmision: '2024-02-17', fechaVencimiento: '2024-03-17',
    subtotal: 1400000, total: 1400000, estado: 'parcial', matriculaIds: ['m1', 'm5', 'm6', 'm7'],
  },
  // Infra del Norte
  {
    id: 'f2', grupoCarteraId: 'gc2', numeroFactura: 'FAC-2024-004', fechaEmision: '2024-03-06', fechaVencimiento: '2024-04-06',
    subtotal: 840000, total: 840000, estado: 'parcial', matriculaIds: ['m3', 'm11', 'm12'],
  },
  // Ana Maria Garcia
  {
    id: 'f3', grupoCarteraId: 'gc3', numeroFactura: 'FAC-2024-002', fechaEmision: '2024-02-15', fechaVencimiento: '2024-03-15',
    subtotal: 350000, total: 350000, estado: 'pagada', matriculaIds: ['m2'],
  },
  // Telecom Solutions
  {
    id: 'f4', grupoCarteraId: 'gc4', numeroFactura: 'FAC-2024-003', fechaEmision: '2024-01-10', fechaVencimiento: '2024-02-10',
    subtotal: 1060000, total: 1060000, estado: 'parcial', matriculaIds: ['m4', 'm13', 'm14'],
  },
  // Energía Solar
  {
    id: 'f5', grupoCarteraId: 'gc5', numeroFactura: 'FAC-2024-005', fechaEmision: '2024-03-05', fechaVencimiento: '2024-04-05',
    subtotal: 1050000, total: 1050000, estado: 'parcial', matriculaIds: ['m8', 'm9', 'm22'],
  },
  // Minera Andina
  {
    id: 'f6', grupoCarteraId: 'gc6', numeroFactura: 'FAC-2024-006', fechaEmision: '2024-03-07', fechaVencimiento: '2024-04-07',
    subtotal: 600000, total: 600000, estado: 'parcial', matriculaIds: ['m16', 'm17'],
  },
  // Independientes con factura
  { id: 'f7', grupoCarteraId: 'gc7', numeroFactura: 'FAC-2024-007', fechaEmision: '2024-03-04', fechaVencimiento: '2024-04-04', subtotal: 350000, total: 350000, estado: 'pagada', matriculaIds: ['m10'] },
  { id: 'f8', grupoCarteraId: 'gc8', numeroFactura: 'FAC-2024-008', fechaEmision: '2024-03-07', fechaVencimiento: '2024-04-07', subtotal: 280000, total: 280000, estado: 'pagada', matriculaIds: ['m15'] },
  { id: 'f9', grupoCarteraId: 'gc9', numeroFactura: 'FAC-2024-009', fechaEmision: '2024-03-08', fechaVencimiento: '2024-04-08', subtotal: 300000, total: 300000, estado: 'pagada', matriculaIds: ['m18'] },
  { id: 'f10', grupoCarteraId: 'gc11', numeroFactura: 'FAC-2024-010', fechaEmision: '2024-03-09', fechaVencimiento: '2024-04-09', subtotal: 250000, total: 250000, estado: 'pagada', matriculaIds: ['m20'] },
  { id: 'f11', grupoCarteraId: 'gc13', numeroFactura: 'FAC-2024-011', fechaEmision: '2024-03-10', fechaVencimiento: '2024-04-10', subtotal: 250000, total: 250000, estado: 'parcial', matriculaIds: ['m23'] },
];

// ============ RELACION FACTURA-MATRICULA ============
export const mockFacturaMatriculas: FacturaMatricula[] = [
  { facturaId: 'f1', matriculaId: 'm1', valorAsignado: 350000 },
  { facturaId: 'f1', matriculaId: 'm5', valorAsignado: 350000 },
  { facturaId: 'f1', matriculaId: 'm6', valorAsignado: 350000 },
  { facturaId: 'f1', matriculaId: 'm7', valorAsignado: 350000 },
  { facturaId: 'f2', matriculaId: 'm3', valorAsignado: 280000 },
  { facturaId: 'f2', matriculaId: 'm11', valorAsignado: 280000 },
  { facturaId: 'f2', matriculaId: 'm12', valorAsignado: 280000 },
  { facturaId: 'f3', matriculaId: 'm2', valorAsignado: 350000 },
  { facturaId: 'f4', matriculaId: 'm4', valorAsignado: 500000 },
  { facturaId: 'f4', matriculaId: 'm13', valorAsignado: 280000 },
  { facturaId: 'f4', matriculaId: 'm14', valorAsignado: 280000 },
  { facturaId: 'f5', matriculaId: 'm8', valorAsignado: 400000 },
  { facturaId: 'f5', matriculaId: 'm9', valorAsignado: 400000 },
  { facturaId: 'f5', matriculaId: 'm22', valorAsignado: 250000 },
  { facturaId: 'f6', matriculaId: 'm16', valorAsignado: 300000 },
  { facturaId: 'f6', matriculaId: 'm17', valorAsignado: 300000 },
  { facturaId: 'f7', matriculaId: 'm10', valorAsignado: 350000 },
  { facturaId: 'f8', matriculaId: 'm15', valorAsignado: 280000 },
  { facturaId: 'f9', matriculaId: 'm18', valorAsignado: 300000 },
  { facturaId: 'f10', matriculaId: 'm20', valorAsignado: 250000 },
  { facturaId: 'f11', matriculaId: 'm23', valorAsignado: 250000 },
];

// ============ REGISTROS DE PAGO ============
export const mockPagos: RegistroPago[] = [
  // Constructora ABC
  { id: 'pago1', facturaId: 'f1', fechaPago: '2024-02-18', valorPago: 350000, metodoPago: 'transferencia', observaciones: 'Pago m1 completo.' },
  { id: 'pago5', facturaId: 'f1', fechaPago: '2024-03-02', valorPago: 350000, metodoPago: 'transferencia', observaciones: 'Pago m5 completo.' },
  { id: 'pago6', facturaId: 'f1', fechaPago: '2024-03-03', valorPago: 350000, metodoPago: 'consignacion', observaciones: 'Pago m6 completo.' },
  { id: 'pago7', facturaId: 'f1', fechaPago: '2024-03-05', valorPago: 200000, metodoPago: 'transferencia', observaciones: 'Abono parcial m7.' },
  // Infra del Norte
  { id: 'pago2', facturaId: 'f2', fechaPago: '2024-03-10', valorPago: 100000, metodoPago: 'consignacion', observaciones: 'Abono parcial m3.' },
  { id: 'pago8', facturaId: 'f2', fechaPago: '2024-03-06', valorPago: 280000, metodoPago: 'transferencia', observaciones: 'Pago m11 completo.' },
  // Ana Maria Garcia
  { id: 'pago3', facturaId: 'f3', fechaPago: '2024-02-16', valorPago: 350000, metodoPago: 'efectivo' },
  // Telecom Solutions
  { id: 'pago4', facturaId: 'f4', fechaPago: '2024-01-11', valorPago: 500000, metodoPago: 'consignacion', observaciones: 'Pago m4 completo.' },
  { id: 'pago9', facturaId: 'f4', fechaPago: '2024-03-07', valorPago: 280000, metodoPago: 'consignacion', observaciones: 'Pago m13 completo.' },
  { id: 'pago10', facturaId: 'f4', fechaPago: '2024-03-08', valorPago: 150000, metodoPago: 'transferencia', observaciones: 'Abono parcial m14.' },
  // Energía Solar
  { id: 'pago11', facturaId: 'f5', fechaPago: '2024-03-04', valorPago: 400000, metodoPago: 'transferencia', observaciones: 'Pago m9 completo.' },
  { id: 'pago12', facturaId: 'f5', fechaPago: '2024-03-10', valorPago: 250000, metodoPago: 'consignacion', observaciones: 'Pago m22 completo.' },
  // Minera Andina
  { id: 'pago13', facturaId: 'f6', fechaPago: '2024-03-08', valorPago: 300000, metodoPago: 'transferencia', observaciones: 'Pago m17 completo.' },
  // Independientes
  { id: 'pago14', facturaId: 'f7', fechaPago: '2024-03-04', valorPago: 350000, metodoPago: 'efectivo' },
  { id: 'pago15', facturaId: 'f8', fechaPago: '2024-03-07', valorPago: 280000, metodoPago: 'transferencia' },
  { id: 'pago16', facturaId: 'f9', fechaPago: '2024-03-08', valorPago: 300000, metodoPago: 'efectivo' },
  { id: 'pago17', facturaId: 'f10', fechaPago: '2024-03-09', valorPago: 250000, metodoPago: 'transferencia' },
  { id: 'pago18', facturaId: 'f11', fechaPago: '2024-03-10', valorPago: 125000, metodoPago: 'consignacion', observaciones: 'Abono parcial m23.' },
];

// ============ ACTIVIDADES DE CARTERA ============
export const mockActividades: ActividadCartera[] = [
  // Constructora ABC
  { id: 'act1', grupoCarteraId: 'gc1', tipo: 'sistema', descripcion: 'Factura FAC-2024-001 creada por $1.400.000.', fecha: '2024-02-17T10:30:00Z', usuario: 'Sistema' },
  { id: 'act2', grupoCarteraId: 'gc1', tipo: 'sistema', descripcion: 'Pago registrado por $350.000 — Transferencia (m1).', fecha: '2024-02-18T14:00:00Z', usuario: 'Sistema' },
  { id: 'act8', grupoCarteraId: 'gc1', tipo: 'sistema', descripcion: 'Pago registrado por $350.000 — Transferencia (m5).', fecha: '2024-03-02T10:00:00Z', usuario: 'Sistema' },
  { id: 'act9', grupoCarteraId: 'gc1', tipo: 'sistema', descripcion: 'Pago registrado por $350.000 — Consignación (m6).', fecha: '2024-03-03T10:00:00Z', usuario: 'Sistema' },
  { id: 'act10', grupoCarteraId: 'gc1', tipo: 'sistema', descripcion: 'Abono de $200.000 — Transferencia (m7). Saldo pendiente $150.000.', fecha: '2024-03-05T10:00:00Z', usuario: 'Sistema' },
  // Infra del Norte
  { id: 'act3', grupoCarteraId: 'gc2', tipo: 'sistema', descripcion: 'Factura FAC-2024-004 creada por $840.000.', fecha: '2024-03-06T09:15:00Z', usuario: 'Sistema' },
  { id: 'act4', grupoCarteraId: 'gc2', tipo: 'sistema', descripcion: 'Pago registrado por $100.000 — Consignación (m3).', fecha: '2024-03-10T11:00:00Z', usuario: 'Sistema' },
  { id: 'act11', grupoCarteraId: 'gc2', tipo: 'sistema', descripcion: 'Pago registrado por $280.000 — Transferencia (m11).', fecha: '2024-03-06T14:00:00Z', usuario: 'Sistema' },
  { id: 'act5', grupoCarteraId: 'gc2', tipo: 'llamada', descripcion: 'Se contactó a Camila Herrera para recordar saldo pendiente de $460.000.', fecha: '2024-03-20T09:00:00Z', usuario: 'Admin' },
  { id: 'act6', grupoCarteraId: 'gc2', tipo: 'promesa_pago', descripcion: 'Camila confirma pago para el 30 de marzo.', fecha: '2024-03-20T09:10:00Z', usuario: 'Admin' },
  { id: 'act7', grupoCarteraId: 'gc2', tipo: 'comentario', descripcion: 'La empresa solicita enviar nueva factura con datos actualizados.', fecha: '2024-03-25T14:30:00Z', usuario: 'Admin' },
  // Energía Solar
  { id: 'act12', grupoCarteraId: 'gc5', tipo: 'sistema', descripcion: 'Factura FAC-2024-005 creada por $1.050.000.', fecha: '2024-03-05T09:00:00Z', usuario: 'Sistema' },
  { id: 'act13', grupoCarteraId: 'gc5', tipo: 'sistema', descripcion: 'Pago registrado por $400.000 — Transferencia (m9).', fecha: '2024-03-04T10:00:00Z', usuario: 'Sistema' },
  { id: 'act14', grupoCarteraId: 'gc5', tipo: 'llamada', descripcion: 'Se contactó a Ricardo Mendoza para coordinar pago de m8 ($400.000).', fecha: '2024-03-15T10:00:00Z', usuario: 'Admin' },
  // Minera Andina
  { id: 'act15', grupoCarteraId: 'gc6', tipo: 'sistema', descripcion: 'Factura FAC-2024-006 creada por $600.000.', fecha: '2024-03-07T09:00:00Z', usuario: 'Sistema' },
  { id: 'act16', grupoCarteraId: 'gc6', tipo: 'sistema', descripcion: 'Pago registrado por $300.000 — Transferencia (m17).', fecha: '2024-03-08T10:00:00Z', usuario: 'Sistema' },
];
