## Nombre de archivo PDF y margenes optimizados

### Cambios

**1. Nombre del archivo descargado**

Estructura: `{nombreFormato}-{tipoDocumento}-{numeroDocumento}-{nombres}-{apellidos}.pdf`

- Se crea una funcion utilitaria `buildPdfFilename` que:
  - Recibe el nombre del formato, persona (tipo doc, numero doc, nombres, apellidos)
  - Convierte todo a minusculas
  - Elimina tildes y caracteres especiales con `normalize("NFD").replace(/[\u0300-\u036f]/g, "")`
  - Reemplaza espacios por guiones
  - Elimina dobles guiones si algun campo esta vacio
  - Retorna el string final con `.pdf`
- Se aplica en `InfoAprendizPreviewDialog.tsx`:
  - El `<title>` del print window se establece con el nombre generado (los navegadores usan el title como nombre por defecto al guardar PDF)
- Se aplica tambien en `FormatosList.tsx` → `onDownload`: el callback del padre ya invoca `handlePrint`, por lo que el nombre se genera en el mismo lugar.

**2. Margenes del documento a 1cm**

- En `PRINT_STYLES`, cambiar el padding del body de `20mm 15mm` a `10mm` (1cm uniforme en todos los lados)
- En `@media print`, cambiar de `10mm` a `5mm`
- En `.doc-root`, reducir el padding interno ya que los margenes del body cubren el espaciado

### Archivos modificados

`**src/components/matriculas/formatos/InfoAprendizPreviewDialog.tsx**`

- Agregar funcion `buildPdfFilename(formatName, persona)`
- Usar el nombre generado en `printWindow.document.write` como `<title>`
- Ajustar margenes en `PRINT_STYLES`: body padding a `10mm`, `@media print` body padding a `10mm`