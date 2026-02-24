

## PARTE 4 — Drag and Drop Profesional

### Objetivo

Reemplazar los botones de mover arriba/abajo con drag-and-drop fluido usando `@dnd-kit/core` y `@dnd-kit/sortable`, logrando una experiencia de reordenamiento profesional con animaciones suaves, placeholder visible y auto-scroll.

---

### Situacion actual

- Los bloques se reordenan con botones flecha arriba/abajo en el hover de cada tarjeta (lineas 125-130).
- Existe `moveBloque(index, direction)` que intercambia posiciones.
- El drag handle (`GripVertical`) es visual pero no funcional.
- No hay ninguna libreria de drag-and-drop instalada.

---

### Cambios detallados

#### 1. Instalar dependencia @dnd-kit

Se necesitan dos paquetes:
- `@dnd-kit/core` — motor de drag-and-drop
- `@dnd-kit/sortable` — utilidades para listas ordenables
- `@dnd-kit/utilities` — helpers CSS (transform)

#### 2. Refactorizar BloqueItem para ser sortable

**Archivo:** `src/pages/formatos/FormatoEditorPage.tsx`

Envolver cada `BloqueItem` con `useSortable` de dnd-kit:

- El hook provee `attributes`, `listeners`, `setNodeRef`, `transform`, `transition`, e `isDragging`.
- Los `listeners` se aplican SOLO al drag handle (GripVertical), no a toda la tarjeta, para que el click normal siga funcionando para seleccionar.
- Cuando `isDragging` es true: opacidad 0.5, sombra elevada, escala ligera.
- Se aplica `CSS.Transform.toString(transform)` al contenedor para animacion suave.
- Se elimina la prop `transition` personalizada y se usa la de dnd-kit (`transition`).

Los botones de mover arriba/abajo se eliminan del hover (ya no son necesarios con drag funcional).

#### 3. Envolver la lista de bloques con DndContext y SortableContext

**Archivo:** `src/pages/formatos/FormatoEditorPage.tsx`

La seccion de bloques (lineas 594-623) se envuelve con:

```
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
  modifiers={[restrictToVerticalAxis]}
>
  <SortableContext items={bloques.map(b => b.id)} strategy={verticalListSortingStrategy}>
    {bloques.map((bloque, index) => (
      <SortableBloqueItem key={bloque.id} ... />
    ))}
  </SortableContext>
  <DragOverlay>
    {activeDragBloque ? <BloqueItemOverlay bloque={activeDragBloque} /> : null}
  </DragOverlay>
</DndContext>
```

**Sensores configurados:**
- `PointerSensor` con `activationConstraint: { distance: 5 }` para evitar activacion accidental al hacer click.
- `KeyboardSensor` con `sortableKeyboardCoordinates` para accesibilidad.

**handleDragEnd:**
- Usa `arrayMove` de `@dnd-kit/sortable` para reordenar el array de bloques.
- Llama `markDirty()` tras el reordenamiento.

#### 4. DragOverlay con ghost estilizado

Se usa `DragOverlay` de dnd-kit para mostrar un "ghost" del bloque siendo arrastrado:

- El ghost es una version simplificada del bloque (solo label + tipo + badges).
- Tiene sombra elevada (`shadow-lg`), borde primary, fondo blanco, opacidad 0.95.
- El bloque original en su posicion tiene opacidad reducida (0.4) durante el drag.

Se gestiona con un state `activeId` que se setea en `onDragStart` y se limpia en `onDragEnd`.

#### 5. Eliminar moveBloque y botones de flechas

- Se elimina la funcion `moveBloque` (linea 385-392).
- Se eliminan los props `onMoveUp`, `onMoveDown`, `isFirst`, `isLast` de `BloqueItemProps`.
- Se eliminan los botones de flecha arriba/abajo del hover actions (lineas 125-130).
- Se mantienen los botones de Duplicar y Eliminar en el hover.

#### 6. Auto-scroll

`DndContext` de dnd-kit incluye auto-scroll nativo cuando se arrastra hacia los bordes del contenedor scrollable. Esto funciona automaticamente si el contenedor tiene `overflow-y: auto`, lo cual el canvas ya tiene.

---

### Resumen de archivos

| Archivo | Cambio |
|---|---|
| `package.json` | Agregar `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@dnd-kit/modifiers` |
| `src/pages/formatos/FormatoEditorPage.tsx` | Importar dnd-kit, envolver bloques con DndContext/SortableContext, refactorizar BloqueItem como sortable, agregar DragOverlay, eliminar moveBloque y botones de flechas |

### Lo que NO cambia

- Layout de header sticky y canvas (Parte 1)
- Apariencia de tarjetas compactas (Parte 2) — solo se agrega drag funcional
- Inspector en panel derecho (Parte 3)
- Preview dialog
- Logica de guardado y dirty state
- Paleta de bloques

