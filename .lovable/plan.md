

## Plan: Eliminar encabezado duplicado en vista previa

### Problema

En `FormatoPreviewDocument.tsx`, líneas 302-309, siempre se renderiza un `DocumentHeader` hardcodeado antes de los bloques. Si el usuario ya añadió un bloque `document_header` en el canvas, este se renderiza otra vez dentro del loop de bloques (línea 265-281), produciendo dos encabezados.

### Solución

En `FormatoPreviewDocument.tsx`, condicionar el `DocumentHeader` por defecto (líneas 302-309): solo renderizarlo si **no existe** ningún bloque de tipo `document_header` en el array `bloques`. Si existe, el bloque del canvas se encarga de renderizarlo.

### Cambio en un solo archivo

**`src/components/formatos/FormatoPreviewDocument.tsx`** (líneas 296-310)

- Agregar: `const hasHeaderBlock = bloques.some(b => b.type === 'document_header');`
- Envolver el `DocumentHeader` default en `{!hasHeaderBlock && <DocumentHeader ... />}`
- Todo lo demás permanece igual

