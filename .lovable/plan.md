

# Fix: Vista previa de formatos y calidad de PDF

## Problemas identificados

### 1. Párrafo muestra etiquetas HTML literales (FormatoPreviewDocument)
En `FormatoPreviewDocument.tsx` línea 119-121, el bloque `paragraph` renderiza `props.text` como texto plano dentro de un `<p>`, sin detectar ni renderizar HTML. El componente `BlockPreview.tsx` ya fue corregido (usa `dangerouslySetInnerHTML` + DOMPurify), pero `FormatoPreviewDocument` — que es el que se usa para la vista previa del documento y para el PDF — no fue actualizado.

### 2. Texto gris en listas/párrafos
En `BlockPreview.tsx` línea 113, el párrafo HTML usa `text-muted-foreground` lo que pinta todo en gris, incluyendo listas. Debe usar `text-foreground` para que el contenido sea negro.

### 3. PDF desordenado
`PRINT_STYLES` en `FormatoPreviewDialog.tsx` tiene solo 6 líneas de CSS. Al copiar `innerHTML` a la ventana de impresión, se pierden todas las clases de Tailwind. El PDF sale sin grid, sin colores, sin tipografía. Necesitamos inyectar estilos completos que repliquen la apariencia de la vista previa.

### 4. `multi_choice` no existe en FormatoPreviewDocument
El nuevo tipo de bloque `multi_choice` no tiene caso en `renderBloque()`, por lo que no aparece ni en vista previa ni en PDF.

### 5. Badge "Auto" no deseado en PDF
El usuario indicó que la etiqueta "Auto" no es necesaria en la UI de impresión/PDF.

---

## Cambios propuestos

### Archivo 1: `src/components/formatos/editor/BlockPreview.tsx`
- Línea 113: cambiar `text-muted-foreground` → `text-foreground` en el `<div>` del párrafo HTML para que listas y texto se muestren en negro.

### Archivo 2: `src/components/formatos/FormatoPreviewDocument.tsx`
- **Párrafo (líneas 116-123)**: Replicar la misma lógica de detección HTML que ya existe en `BlockPreview`: si `props.text` contiene HTML, renderizar con `dangerouslySetInnerHTML` + DOMPurify + clases `prose prose-sm`; si no, renderizar como texto plano.
- **Agregar caso `multi_choice`**: Renderizar opciones con checkboxes (similar a `radio` pero con cuadrados en vez de círculos).
- **Auto field badge**: Eliminar el badge "Auto" del renderizado dentro de `FormatoPreviewDocument` (solo aplica aquí, no en el editor).

### Archivo 3: `src/components/formatos/FormatoPreviewDialog.tsx`
- **Expandir `PRINT_STYLES`** con reglas CSS puras que repliquen la apariencia de los bloques tal como se ven en la vista previa:
  - Grid de 2 columnas con `gap`
  - Tipografía, tamaños, pesos
  - `field-cell` con label pequeño + valor
  - Estilos para radio circles, checkboxes, firmas
  - Tablas con bordes
  - Section titles con borde inferior
  - Listas ordenadas/desordenadas (prose-like)
  - Encabezado de documento (grid de 3 columnas con bordes)
  - Ocultar badge "Auto"
  - `@page { size: A4 portrait; margin: 12mm; }`

No se modifica ningún otro módulo de la aplicación.

---

## Resumen técnico

| Archivo | Cambio |
|---|---|
| `BlockPreview.tsx` | Color del párrafo HTML: gris → negro |
| `FormatoPreviewDocument.tsx` | HTML rendering en párrafo + caso `multi_choice` + quitar badge Auto |
| `FormatoPreviewDialog.tsx` | PRINT_STYLES completo (~80 reglas CSS) para fidelidad en PDF |

