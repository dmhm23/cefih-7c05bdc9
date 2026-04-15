
# Ajustes: eliminar "(reutilizada)" y bloquear reapertura de formatos automáticos

## Cambio 1: Eliminar texto "(reutilizada)" de firmas reutilizadas

Tres archivos tienen texto con "reutilizada" o "firma heredada" visible en documentos renderizados:

- **`DynamicFormatoDocument.tsx`** (línea 125): cambiar `Firma ${tipoFirmante} (reutilizada)` → `Firma ${tipoFirmante}`
- **`FormatoPreviewDocument.tsx`** (líneas 288, 298): eliminar `(hereda ...)` del encabezado de columna y `(firma heredada)` de las celdas de asistencia
- **`PortalSignatureCapture.tsx`** (línea 55): cambiar `"Firma reutilizada"` → `"Firma capturada"` (o simplemente `"Firma registrada"`)

## Cambio 2: No permitir reabrir formatos automáticos

El botón "Reabrir" aparece en `FormatosList.tsx` (línea 62) para cualquier formato con estado `completado` o `firmado`. Necesitamos:

1. **`FormatosList.tsx`**: agregar `esAutomatico?: boolean` al interface `FormatoItem` y ocultar el botón de reabrir cuando `esAutomatico` es `true`.

2. **`MatriculaDetailSheet.tsx`** (línea 556): pasar `esAutomatico: f.esAutomatico` en el map de formatos.

3. **`MatriculaDetallePage.tsx`** (línea 1022): igual, pasar `esAutomatico: f.esAutomatico` — y también agregar el `onReopen` que actualmente no se pasa aquí (solo se pasa en el Sheet).

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | Quitar "(reutilizada)" del label |
| `src/components/formatos/FormatoPreviewDocument.tsx` | Quitar "(hereda ...)" y "(firma heredada)" del preview |
| `src/components/portal/PortalSignatureCapture.tsx` | Cambiar "Firma reutilizada" → "Firma registrada" |
| `src/components/matriculas/formatos/FormatosList.tsx` | Agregar prop `esAutomatico` y ocultar botón reabrir si es automático |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Pasar `esAutomatico` al map |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Pasar `esAutomatico` al map |
