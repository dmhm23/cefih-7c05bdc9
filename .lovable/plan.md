

## Plan: Archivos adjuntos y vista previa en Cartera

### Estado actual
- **CrearFacturaDialog**: Ya tiene FileDropZone para archivo de factura ✓
- **EditarFacturaDialog**: NO tiene FileDropZone — no se puede cambiar/ver el archivo ✗
- **RegistrarPagoDialog**: Ya tiene FileDropZone para comprobante ✓
- **EditarPagoDialog**: NO tiene FileDropZone — no se puede cambiar/ver el comprobante ✗
- **FacturaCard**: No muestra indicadores de archivos adjuntos ni permite vista previa ✗
- Los tipos ya tienen `archivoFactura` (Factura) y `soportePago` (RegistroPago) pero no se persisten al guardar

### Cambios

**1. Nuevo: `src/components/cartera/ArchivoPreviewDialog.tsx`**
- Dialog de vista previa que muestra PDFs (iframe), imágenes (img tag), o indica formato no soportado
- Recibe `url: string` y `nombre: string`
- Botón para descargar/abrir en nueva pestaña

**2. `src/components/cartera/EditarFacturaDialog.tsx`**
- Agregar FileDropZone para archivo de factura (igual que en CrearFacturaDialog)
- Inicializar con el archivo existente si `factura.archivoFactura` tiene valor
- Incluir el archivo en el submit

**3. `src/components/cartera/EditarPagoDialog.tsx`**
- Agregar FileDropZone para comprobante de pago
- Inicializar con el archivo existente si `pago.soportePago` tiene valor
- Incluir el archivo en el submit

**4. `src/components/cartera/FacturaCard.tsx`**
- En la tabla de pagos: agregar columna "Soporte" con icono clicable que abre ArchivoPreviewDialog
- En la sección de acciones de factura: botón "Ver Factura" si tiene archivo adjunto, abre ArchivoPreviewDialog
- Indicador visual (icono de clip) en el header colapsado si la factura tiene archivo

**5. `src/services/carteraService.ts`**
- Actualizar `registrarPago` para guardar `soportePago` (URL simulada del archivo)
- Actualizar `createFactura` / `updateFactura` para guardar `archivoFactura`
- Generar URLs ficticias con `URL.createObjectURL()` para la simulación mock

**6. `src/data/mockCartera.ts`**
- Agregar `archivoFactura` a algunas facturas mock y `soportePago` a algunos pagos mock para demostración visual

