

## PARTE 5 — Insercion Profesional desde Paleta + Iconos Lucide

### Objetivo

Permitir arrastrar bloques desde la paleta lateral directamente al canvas, insertandolos en la posicion deseada con un placeholder visual. Mantener el boton "+" como fallback. Reemplazar todos los emojis de la paleta con iconos Lucide profesionales.

---

### Situacion actual

- La paleta (lineas 722-740) usa botones con emojis y `onClick` que siempre agregan al final del array.
- El canvas ya tiene `DndContext` + `SortableContext` para reordenar bloques existentes.
- Los emojis no se ven consistentes entre plataformas y no son profesionales.

---

### Cambios detallados

#### 1. Reemplazar emojis por iconos Lucide en `bloqueConstants.ts`

Cambiar el tipo de `icon` de `string` (emoji) a `string` (nombre de icono Lucide). Crear un mapeo de icono Lucide por tipo:

| Tipo | Icono Lucide |
|---|---|
| `section_title` | `Bookmark` |
| `heading` | `Heading` |
| `paragraph` | `AlignLeft` |
| `text` | `TextCursorInput` |
| `date` | `CalendarDays` |
| `number` | `Hash` |
| `radio` | `CircleDot` |
| `select` | `ChevronDown` |
| `checkbox` | `CheckSquare` |
| `auto_field` | `Zap` |
| `signature_aprendiz` | `PenTool` |
| `signature_entrenador_auto` | `PenTool` |
| `signature_supervisor_auto` | `PenTool` |

Se exporta un mapeo `BLOQUE_ICONS: Record<TipoBloque, LucideIcon>` desde `bloqueConstants.ts` para reutilizar en paleta, inspector y tarjetas.

#### 2. Hacer la paleta "draggable" con dnd-kit

Cada item de la paleta se convierte en un elemento draggable usando `useDraggable` de `@dnd-kit/core`. Al iniciar el drag:

- Se genera un ID temporal con prefijo `palette-` + tipo (ej: `palette-text`).
- El `DragOverlay` muestra un ghost estilizado del bloque de paleta.
- El item original en la paleta reduce su opacidad.

El boton "+" se mantiene como fallback funcional (click = agregar al final).

#### 3. Elevar el DndContext para cubrir paleta + canvas

Actualmente el `DndContext` solo envuelve la lista de bloques (lineas 679-705). Para soportar drag desde la paleta, se necesita que el `DndContext` envuelva tanto el canvas como el aside (panel derecho).

Se mueve el `DndContext` para que envuelva el `<div className="flex flex-1 overflow-hidden">` completo (canvas + aside).

#### 4. Logica de insercion en posicion

En `handleDragEnd`, detectar si el item arrastrado viene de la paleta (id empieza con `palette-`):

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveId(null);
  
  if (!over) return;
  
  const activeIdStr = String(active.id);
  
  // Drag desde paleta
  if (activeIdStr.startsWith('palette-')) {
    const type = activeIdStr.replace('palette-', '') as TipoBloque;
    const newBloque = createDefaultBloque(type);
    const overIndex = bloques.findIndex(b => b.id === over.id);
    if (overIndex >= 0) {
      setBloques(prev => [...prev.slice(0, overIndex + 1), newBloque, ...prev.slice(overIndex + 1)]);
    } else {
      setBloques(prev => [...prev, newBloque]);
    }
    markDirty();
    setSelectedBloqueId(newBloque.id);
    return;
  }
  
  // Reordenamiento existente
  if (active.id !== over.id) {
    const oldIndex = bloques.findIndex(b => b.id === active.id);
    const newIndex = bloques.findIndex(b => b.id === over.id);
    setBloques(arrayMove(bloques, oldIndex, newIndex));
    markDirty();
  }
};
```

Al soltar sobre un bloque existente, se inserta despues de ese bloque. Al soltar sobre el area vacia del canvas (no sobre un bloque), se agrega al final.

#### 5. Placeholder visual en el canvas

Para mostrar donde se insertara el bloque al soltar, se usa el comportamiento nativo de `SortableContext` que ya maneja animaciones de desplazamiento. Cuando un item de paleta se arrastra sobre la zona de bloques, los bloques existentes se desplazan para abrir espacio.

Para que esto funcione, los items de paleta necesitan ser reconocidos por el `SortableContext`. Se usa `useDroppable` en el contenedor de bloques vacios para manejar el caso de canvas vacio.

#### 6. DragOverlay diferenciado

El `DragOverlay` ahora muestra dos tipos de ghost:

- Si es un bloque existente (`activeDragBloque`): el overlay actual con borde primary.
- Si es un item de paleta (`activeId` empieza con `palette-`): un ghost compacto con el icono Lucide + nombre del tipo + badge "Nuevo", con estilo de tarjeta con borde dashed primary.

#### 7. Actualizar la paleta en el aside

Cada item de la paleta cambia de:
```
<button onClick={...}>
  <span>emoji</span>
  <span>label</span>
  <Plus />
</button>
```

A:
```
<div draggable via useDraggable>
  <LucideIcon className="h-4 w-4 text-muted-foreground" />
  <span>label</span>
  <Plus onClick={addBloque} />  // fallback click
</div>
```

El contenedor del item tiene `cursor: grab` y al iniciar drag cambia a `cursor: grabbing`.

---

### Resumen de archivos

| Archivo | Cambio |
|---|---|
| `src/data/bloqueConstants.ts` | Reemplazar emojis por nombres de iconos Lucide, exportar `BLOQUE_ICONS` |
| `src/pages/formatos/FormatoEditorPage.tsx` | Elevar DndContext, crear items de paleta draggables, actualizar handleDragEnd con logica de insercion, diferenciar DragOverlay, actualizar renderizado de paleta con iconos Lucide |
| `src/components/formatos/BloqueInspector.tsx` | Actualizar encabezado para usar icono Lucide en vez de emoji |

### Lo que NO cambia

- Layout de header sticky y canvas (Parte 1)
- Tarjetas compactas de bloques (Parte 2)
- Inspector de propiedades (Parte 3)
- Reordenamiento por drag de bloques existentes (Parte 4)
- Preview dialog
- Logica de guardado y dirty state

