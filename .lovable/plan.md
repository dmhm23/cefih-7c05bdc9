

# Eliminar casilla de reutilización de firma del portal

## Cambio

Eliminar ambos bloques de checkbox "Guardar mi firma para uso en documentos futuros" del componente `PortalSignatureCapture.tsx`:
- Líneas 75-87 (en la vista de firma capturada/reutilizada)
- Líneas 130-142 (en la vista de captura de firma)

También limpiar las props no usadas (`esOrigenFirma`, `autorizaReutilizacion`, `onAutorizaReutilizacionChange`) de la interfaz y del destructuring.

## Archivo afectado

`src/components/portal/PortalSignatureCapture.tsx`

