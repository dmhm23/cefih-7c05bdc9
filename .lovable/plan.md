

# Columnas multi-bloque en el editor de formatos

## Problema

Actualmente `Row1Block.col` es `Bloque | null` (un solo bloque) y `Row2Block.cols` es `[Bloque | null, Bloque | null]`. Esto impide agrupar varios bloques dentro de una columna (ej: párrafo + checkbox + firma).

## Solución

Cambiar la estructura de datos para que cada columna sea un **array de bloques** en vez de un solo bloque.

### Modelo de datos

```typescript
// Antes
Row1Block { col: Bloque | null }
Row2Block { cols: [(Bloque | null), (Bloque | null)] }

// Después
Row1Block { col: Bloque[] }
Row2Block { cols: [Bloque[], Bloque[]] }
```

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `useFormatoEditorStore.ts` | Tipos `Row1Block`/`Row2Block` pasan a arrays. `insertIntoCol` hace push en vez de reemplazar. `removeFromCol` filtra por id del bloque. `updateBlock` busca dentro del array. `getSelectedBlock` itera arrays. `createRow1`/`createRow2` inicializan con `[]`. |
| `formatoSchema.ts` | Schema Zod: `col: z.array(bloqueBaseSchema)`, `cols: z.tuple([z.array(...), z.array(...)])` |
| `CanvasRow.tsx` | `ColDrop` recibe `Bloque[]` en vez de `Bloque | null`. Renderiza lista de bloques con botón X individual. El drop zone siempre está visible al final (no desaparece al agregar 1 bloque). `anyColSelected` revisa si algún bloque en algún array está seleccionado. |
| `FormatoPreviewDocument.tsx` | `row1`: itera `row.col.map(renderBloque)`. `row2`: itera cada `row.cols[i].map(renderBloque)`. |
| `DynamicFormatoDocument.tsx` | Mismo cambio que FormatoPreviewDocument. |
| `PortalFormatoRenderer.tsx` | `renderPortalBlock` para row1/row2 itera arrays. `classifyBlock` para row1/row2 clasifica basándose en los hijos del array. |
| `FormatoEditorPage.tsx` | Sin cambios — ya pasa `items as Bloque[]` al guardar. |

### Migración de datos existentes

Para formatos guardados con la estructura vieja (`col: Bloque | null`), en `loadFromFormato` del store se normalizará automáticamente:
- Si `col` es un objeto → convertir a `[col]`
- Si `col` es `null` → convertir a `[]`
- Si `cols[i]` es un objeto → `[cols[i]]`
- Si `cols[i]` es `null` → `[]`

### Detalle de `insertIntoCol` y `removeFromCol`

```typescript
// insertIntoCol: push al array
insertIntoCol: (rowId, colIndex, type) => {
  const block = createDefaultBlock(type);
  // find the row, push block into col array at colIndex
}

// removeFromCol: ahora necesita blockId, no colIndex
// Se cambiará la firma a removeFromCol(rowId, colIndex, blockId)
// para poder eliminar un bloque específico del array
```

### UX en el canvas (CanvasRow/ColDrop)

- Cada columna muestra la lista vertical de bloques con sus previews
- Debajo de los bloques siempre hay una zona de drop "Arrastra aquí" para seguir agregando
- Cada bloque individual tiene su botón X para eliminarlo
- Click en un bloque lo selecciona para el inspector

