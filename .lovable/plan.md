

## Plan: Deshacer / Rehacer en el editor de formatos

### Enfoque

Agregar un historial de estados (undo/redo stack) al store Zustand y exponer botones + atajos de teclado.

### Cambios

**1. `src/stores/useFormatoEditorStore.ts`**

- Agregar al estado: `history: EditorItem[][]` (stack de estados anteriores), `future: EditorItem[][]` (stack para redo), ambos inicializados como `[]`
- Crear helper interno `pushHistory(currentItems)` que se llame antes de cada mutación de `items` (en `addBlock`, `addRow2`, `removeBlock`, `updateBlock`, `reorderBlock`, `insertIntoCol`, `removeFromCol`, `duplicateBlock`, `setItems`). Pushea una copia del array actual a `history` y limpia `future`
- Limitar `history` a 50 entradas para no consumir memoria
- Nuevas acciones:
  - `undo()`: pop de `history`, push estado actual a `future`, restaurar items
  - `redo()`: pop de `future`, push estado actual a `history`, restaurar items
  - `canUndo` / `canRedo`: derivados de `history.length > 0` / `future.length > 0`
- En `reset()` y `loadFromFormato()`: limpiar `history` y `future`

**2. `src/components/formatos/editor/EditorHeader.tsx`**

- Importar `Undo2`, `Redo2` de lucide-react
- Agregar dos botones entre el badge de estado y el botón "Limpiar":
  - Deshacer: icono `Undo2`, disabled cuando `!canUndo`
  - Rehacer: icono `Redo2`, disabled cuando `!canRedo`
- Tooltip con el atajo: `Ctrl+Z` / `Ctrl+Shift+Z`

**3. `src/pages/formatos/FormatoEditorPage.tsx`**

- Agregar `useEffect` con listener de `keydown`:
  - `Ctrl+Z` (o `Cmd+Z`): llama `store.undo()`
  - `Ctrl+Shift+Z` (o `Cmd+Shift+Z`) y también `Ctrl+Y` (o `Cmd+Y`): llama `store.redo()`
  - `e.preventDefault()` para evitar comportamiento nativo del navegador
- Cleanup del listener en el return del effect

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/stores/useFormatoEditorStore.ts` | History/future stacks, undo/redo actions, pushHistory en mutaciones |
| `src/components/formatos/editor/EditorHeader.tsx` | Botones Deshacer/Rehacer |
| `src/pages/formatos/FormatoEditorPage.tsx` | Listener de atajos de teclado |

