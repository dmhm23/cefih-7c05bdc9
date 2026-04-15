

# Agregar opción de enlace al editor de párrafo

## Cambio

### 1. Instalar extensión — `package.json`
```
npm install @tiptap/extension-link
```

### 2. Actualizar `RichTextEditor.tsx`
- Importar `Link` de `@tiptap/extension-link` y el ícono `Link2` / `Unlink` de `lucide-react`.
- Registrar la extensión `Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } })` en el array de extensiones.
- Agregar un botón de enlace en la toolbar (después de las listas, antes de alineación) que:
  - Si hay texto seleccionado sin enlace → abre un `window.prompt` pidiendo la URL y aplica `setLink({ href })`.
  - Si el cursor está sobre un enlace existente → lo remueve con `unsetLink()`.
- El botón muestra estado activo cuando el cursor está sobre un enlace.

### 3. Estilo del enlace en el editor
Los enlaces dentro del área `prose` se estilizan automáticamente por `@tailwindcss/typography` (azul, subrayado). No se necesitan estilos adicionales.

### Archivos afectados
| Archivo | Cambio |
|---|---|
| `package.json` | Agregar `@tiptap/extension-link` |
| `RichTextEditor.tsx` | Import + extensión + botón toolbar |

No se modifican otros componentes. Los enlaces generados son HTML estándar `<a>` que ya se renderizan correctamente en `BlockPreview`, `FormatoPreviewDocument` y el PDF gracias a `dangerouslySetInnerHTML` + `prose`.

