## Correcciones en Vista Previa del Documento

### 1. Reducir margen gris del preview a `p-2`

El margen gris visible en la vista previa proviene del `div` contenedor en la linea 161: `className="p-6 bg-muted/30"`. El `p-6` (24px) genera ese espacio gris alrededor del documento.

**Solucion:** Cambiar `p-6` por `p-2` en ese contenedor (linea 161). Esto no afecta la descarga PDF, que usa sus propios estilos en `PRINT_STYLES`.

### 2. Eliminar tooltip del boton "Descargar PDF"

El tooltip "Descargar como PDF" se muestra automaticamente al abrir el modal porque Radix Tooltip puede activarse con el foco inicial del dialog. Ademas, el boton ya tiene texto visible "Descargar PDF", haciendo el tooltip redundante.

**Solucion:** Eliminar el wrapper `TooltipProvider > Tooltip > TooltipTrigger > TooltipContent` (lineas 146-156) y dejar solo el `Button` directamente.

### Archivo modificado

`**src/components/matriculas/formatos/InfoAprendizPreviewDialog.tsx**`

- Linea 161: cambiar `p-6` a `p-[5mm]`
- Lineas 146-156: remover Tooltip wrapper, dejar solo el Button
- Eliminar import de Tooltip components (linea 10) si ya no se usan en el archivo