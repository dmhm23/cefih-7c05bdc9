# Fix: Bloques de párrafo en 2 columnas no se renderizan en vista previa ni PDF

## Problema

El tipo `row2` (bloque de 2 columnas) no tiene caso en la función `renderBloque()` de `FormatoPreviewDocument.tsx`. Cuando el array de bloques incluye un item con `type: 'row2'`, el `switch` no lo reconoce y no renderiza nada — ni el contenedor de 2 columnas ni los bloques hijos (párrafos u otros) dentro de cada columna.

## Cambio

### Archivo: `src/components/formatos/FormatoPreviewDocument.tsx`

1. **Importar el tipo `Row2Block**` desde el store.
2. **Agregar caso `row2` en `renderBloque()**`: Detectar cuando `bloque.type === 'row2'`, hacer cast a `Row2Block`, y renderizar un grid de 2 columnas con `gridColumn: span 2` (para ocupar todo el ancho). Cada columna renderiza recursivamente su bloque hijo con `renderBloque()`, o muestra un espacio vacío si la columna está vacía.

```text
┌─────────────────────────────────┐
│  row2  (span 2, grid 2-cols)    │
│  ┌─────────┐  ┌─────────┐       │
│  │ col[0]  │  │ col[1]  │       │
│  │ párrafo │  │ bloque ó│       │ 
│  │         │  │ parrafo │       │ 
│  └─────────┘  └─────────┘       │
└─────────────────────────────────┘
```

### Archivo: `src/components/matriculas/formatos/DynamicFormatoDocument.tsx`

Aplicar el mismo tratamiento para que el portal del estudiante también renderice correctamente bloques dentro de `row2`.

No se requieren cambios en `PRINT_STYLES` ya que las reglas de grid de 2 columnas y `span 2` ya existen.