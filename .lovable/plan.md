

## Plan: Módulo de Cartera — Fase 1 y 2

### Resumen

Crear un módulo completo de Cartera que agrupa matrículas bajo responsables de pago, permite facturación individual/agrupada, registro de pagos y seguimiento. Se implementa con datos mock siguiendo los patrones existentes del sistema.

Dado el tamaño del módulo, este plan cubre **Fases 1-4** (modelo, bandeja, facturación, pagos). La Fase 5 (seguimiento/alertas) se implementará después.

---

### Cambios

#### 1. `src/types/cartera.ts` — Nuevo: tipos del módulo

Definir todas las entidades:

```typescript
// Enums
EstadoGrupoCartera: 'pendiente' | 'facturado' | 'abonado' | 'pagado'
EstadoFactura: 'pendiente' | 'parcial' | 'pagada'
TipoResponsable: 'empresa' | 'independiente' | 'arl'
MetodoPago: 'transferencia' | 'efectivo' | 'consignacion' | 'tarjeta'

// Interfaces
ResponsablePago { id, tipo, nombre, nit, contacto_nombre/telefono/email, direccion_facturacion, observaciones }
GrupoCartera { id, responsablePagoId, estado, totalValor, totalAbonos, saldo, matriculaIds[], observaciones, createdAt }
Factura { id, grupoCarteraId, numeroFactura, fechaEmision, fechaVencimiento, subtotal, total, estado, archivoFactura?, matriculaIds[] }
FacturaMatricula { facturaId, matriculaId, valorAsignado }
RegistroPago { id, facturaId, fechaPago, valorPago, metodoPago, soportePago?, observaciones }
```

#### 2. `src/data/mockCartera.ts` — Nuevo: datos mock

- 3 responsables de pago (Constructora ABC, Infraestructuras del Norte, Ana Maria Garcia independiente)
- 3 grupos de cartera vinculados a las matrículas existentes (m1 y m2 bajo Constructora ABC en c1, m3 bajo Infraestructuras, m4 bajo Telecom)
- 2 facturas de ejemplo (una pagada, una pendiente)
- 2 registros de pago

#### 3. `src/services/carteraService.ts` — Nuevo: servicio mock

CRUD para cada entidad:
- `getResponsables()`, `getGrupos()`, `getFacturas()`, `getPagos()`
- `getGrupoById(id)` — retorna grupo con responsable, matrículas y facturas resueltas
- `createFactura(grupoId, matriculaIds[], datos)` — crea factura y asocia matrículas
- `registrarPago(facturaId, datos)` — registra pago y actualiza saldos automáticamente (factura → grupo → matrículas)
- `getGrupoByResponsable(responsableId)`
- Auto-agrupación: función `resolverGrupoParaMatricula(matricula)` que busca/crea grupo según empresa/independiente

#### 4. `src/hooks/useCartera.ts` — Nuevo: hooks React Query

- `useGruposCartera()` — lista todos los grupos con resumen
- `useGrupoCartera(id)` — detalle de un grupo
- `useResponsablesPago()` — lista responsables
- `useFacturasByGrupo(grupoId)` — facturas de un grupo
- `usePagosByFactura(facturaId)` — pagos de una factura
- `useCreateFactura()`, `useRegistrarPago()`, `useCreateResponsable()`

#### 5. `src/pages/cartera/CarteraPage.tsx` — Nuevo: bandeja principal

Tabla con columnas:
- Responsable de pago, Tipo (badge empresa/independiente/arl), No. Matrículas, Valor Total, Abonado, Saldo, Estado (badge con color), Acciones

Incluye:
- SearchInput para buscar por nombre/NIT
- FilterPopover por tipo y estado
- Click en fila abre el detalle del grupo

#### 6. `src/pages/cartera/GrupoCarteraDetallePage.tsx` — Nuevo: vista detalle

Layout con Cards:
- **Info general**: responsable, contacto, resumen financiero (valor total, abonado, saldo)
- **Matrículas asociadas**: tabla con estudiante, curso, valor, abonos, saldo, estado
- **Facturación**: tabla de facturas con acciones (crear factura, ver detalle). Dialog para crear factura seleccionando matrículas del grupo
- **Pagos**: tabla de pagos por factura. Dialog para registrar pago (valor, método, observaciones)
- **Seguimiento**: sección de comentarios usando el componente `ComentariosSection` existente con seccion `'cartera'`

#### 7. `src/components/cartera/CrearFacturaDialog.tsx` — Nuevo

Dialog modal:
- Checkbox list de matrículas del grupo (con estudiante, valor)
- Campos: número factura, fecha emisión, fecha vencimiento
- Subtotal calculado automáticamente
- Upload de archivo PDF (simulado)

#### 8. `src/components/cartera/RegistrarPagoDialog.tsx` — Nuevo

Dialog modal:
- Select de factura pendiente
- Campos: valor, método pago, fecha, observaciones
- Validación: valor no puede exceder saldo de factura

#### 9. `src/App.tsx` — Agregar rutas

```
/cartera → CarteraPage
/cartera/:id → GrupoCarteraDetallePage
```

#### 10. `src/components/layout/AppSidebar.tsx` — Agregar entrada

Nuevo item en `menuItems`: `{ title: "Cartera", url: "/cartera", icon: Wallet }` (de lucide-react), posicionado después de Matrículas.

#### 11. `src/types/index.ts` — Exportar tipos

Agregar `export * from './cartera'`.

---

### Detalle técnico

**Auto-agrupación**: Al consultar grupos, el servicio cruza matrículas existentes por `empresaNombre+empresaNit` (tipo empresa) o por `personaId` (independiente). Esto permite que los grupos se generen automáticamente sin necesidad de crearlos manualmente.

**Cálculo de saldos**: El servicio recalcula `totalAbonos` y `saldo` del grupo sumando los pagos registrados en todas sus facturas. El estado del grupo se actualiza automáticamente: `pagado` si saldo=0, `abonado` si hay pagos parciales, `facturado` si tiene facturas sin pagos, `pendiente` si no tiene facturas.

**Comentarios de seguimiento**: Reutiliza `ComentariosSection` y `useComentarios` existentes con `seccion='cartera'` y `matriculaId=grupoId` (el campo es genérico).

