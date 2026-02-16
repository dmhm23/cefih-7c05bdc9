## Corregir Vista Previa de Informacion del Aprendiz

### Problemas identificados y soluciones

**1. Botones sin tooltips**

- En `FormatosList.tsx`: los botones "Vista previa" y "Descargar PDF" usan `title` pero no tienen tooltip visual con el componente Tooltip de Radix.
- En `InfoAprendizPreviewDialog.tsx`: el boton "Descargar PDF" tampoco tiene tooltip.
- Solucion: envolver los botones de accion con el componente `Tooltip` + `TooltipTrigger` + `TooltipContent` de Radix UI.

**2. Clic en el card abre la vista previa**

- Actualmente el card del documento solo tiene botones individuales de accion.
- Solucion: hacer todo el card clickeable (excepto los botones de accion) agregando `onClick={() => onPreview(fmt.id)}` al contenedor del card y `cursor-pointer hover:bg-muted/50` para feedback visual. Los botones de accion usan `e.stopPropagation()` para evitar doble accion.

**3. Vista previa mas ancha**

- Actualmente usa `max-w-4xl` (896px).
- Solucion: cambiar a `max-w-6xl` (1152px) para aprovechar mejor el ancho de pantalla.

**4. Doble boton de cerrar**

- El componente `DialogContent` de Radix incluye automaticamente un boton X (definido en `dialog.tsx` linea 45-48).
- Ademas, `InfoAprendizPreviewDialog.tsx` agrega manualmente otro boton X (linea 95-97).
- Solucion: eliminar el boton X manual del preview dialog y dejar solo el que viene integrado en `DialogContent`.

**5. PDF sin formato al descargar**

- El problema: `handlePrint` copia `innerHTML` del documento React, pero las clases de Tailwind CSS (como `grid grid-cols-2`, `text-muted-foreground`, colores HSL) no existen en la ventana de impresion. El CSS inline del print window no cubre todas las clases usadas.
- Solucion: reescribir el `handlePrint` para que el HTML copiado use atributos `data-*` y clases CSS propias en lugar de depender de Tailwind. Esto se logra mejorando significativamente los estilos inline del print window para mapear correctamente:
  - Grid 2 columnas (`.grid-2` ya existe pero no se aplica porque el HTML usa `class="grid grid-cols-2"`)
  - Colores de texto (reemplazar variables HSL por colores fijos)
  - Badges, separadores, tabla de autoevaluacion
  - Marca de agua "Borrador"
- Ademas, agregar al documento clases CSS simples junto a las de Tailwind (ej: `className="grid grid-cols-2 grid-2"`) para que el print window las reconozca. Alternativamente, usar `data-` attributes.

---

### Detalle tecnico

**Archivos modificados:**

**A. `src/components/matriculas/formatos/FormatosList.tsx**`

- Importar Tooltip, TooltipTrigger, TooltipContent
- Envolver cada boton de accion con Tooltip
- Agregar `onClick` y `cursor-pointer` al contenedor del card
- `e.stopPropagation()` en los botones individuales

**B. `src/components/matriculas/formatos/InfoAprendizPreviewDialog.tsx**`

- Eliminar el boton X manual (lineas 95-97), dejar el integrado de DialogContent
- Cambiar `max-w-4xl` a `max-w-6xl`
- Agregar tooltip al boton "Descargar PDF"
- Reescribir `handlePrint`: mejorar los estilos CSS del print window para cubrir todas las clases usadas en el documento, incluyendo grids, colores, badges, tablas, y la marca de agua

**C. `src/components/matriculas/formatos/InfoAprendizDocument.tsx**`

- Agregar clases CSS auxiliares (como `grid-2`, `field-cell`, `section-title`, etc.) junto a las clases Tailwind existentes, para que el print window las reconozca
- Esto permite que el mismo HTML funcione tanto en el preview (Tailwind) como en el PDF (CSS propio)