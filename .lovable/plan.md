

## Plan: Edición inline de facturas y pagos en /cartera/:id

### Resumen

Permitir editar los registros de facturas y pagos directamente desde las tablas del detalle de cartera, siguiendo el patrón de edición inline existente en la plataforma.

### Cambios

#### 1. `src/services/carteraService.ts` — Agregar métodos de actualización

- `updateFactura(id, data)`: actualiza campos de una factura en `mockFacturas` y recalcula grupo.
- `updatePago(id, data)`: actualiza campos de un pago en `mockPagos`, recalcula factura y grupo.

#### 2. `src/hooks/useCartera.ts` — Nuevos hooks de mutación

- `useUpdateFactura()` — mutation que invalida queries de cartera.
- `useUpdatePago()` — mutation que invalida queries de cartera.

#### 3. `src/pages/cartera/GrupoCarteraDetallePage.tsx` — Edición inline en tablas

**Tabla de Facturación**: Al hacer clic en una fila, se abre un panel/dialog de edición con los campos: número de factura, fecha emisión, fecha vencimiento, total, archivo adjunto. Usar `EditableField` para los campos dentro de un dialog de edición, o convertir las celdas a editables directamente.

**Tabla de Pagos**: Mismo patrón. Campos editables: fecha pago, valor, método de pago, observaciones, soporte adjunto.

Enfoque: Usar un dialog de edición (similar a los de creación pero pre-poblado) que se abre al hacer clic en la fila, con botón Guardar. Se reutilizará la estructura de `CrearFacturaDialog` y `RegistrarPagoDialog` adaptada para edición.

#### 4. `src/components/cartera/EditarFacturaDialog.tsx` — Nuevo

Dialog pre-poblado con los datos de la factura seleccionada. Campos editables: número, fechas, total, archivo. Botón Guardar que llama a `useUpdateFactura`.

#### 5. `src/components/cartera/EditarPagoDialog.tsx` — Nuevo

Dialog pre-poblado con los datos del pago seleccionado. Campos editables: fecha, valor, método, observaciones, soporte. Botón Guardar que llama a `useUpdatePago`.

### Detalle técnico

- Los dialogs de edición reutilizan la misma estructura visual de los dialogs de registro, pero reciben el registro existente como prop y pre-llenan los campos.
- Al guardar se llama al servicio de actualización, se recalculan saldos automáticamente y se registra actividad de sistema.
- Las filas de las tablas tendrán `cursor-pointer` y `onClick` para abrir el dialog de edición correspondiente.

