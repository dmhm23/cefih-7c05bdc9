

## Plan: Corregir scroll del canvas y desbordamiento de texto en el inspector

### Problema 1 — Sin scroll vertical en el canvas

El `EditorCanvas` tiene `overflow-y-auto` en su div externo, pero el `ResizablePanel` padre tiene `overflow-hidden` implícito. El contenido del canvas no puede hacer scroll porque el panel no permite que el overflow se propague.

**Solución**: Agregar `overflow-hidden` al `ResizablePanel` del canvas no es el problema — el issue es que el componente `ResizablePanel` de Radix no propaga overflow. Se debe añadir una clase `overflow-hidden` explícita al panel y asegurar que el div interno del `EditorCanvas` tenga `h-full overflow-y-auto`.

**Archivo**: `src/components/formatos/editor/EditorCanvas.tsx`
- Cambiar el div raíz de `className="flex-1 overflow-y-auto ..."` a `className="h-full overflow-y-auto ..."` para que tome el alto completo del panel y permita scroll.

### Problema 2 — Texto largo sin salto de línea en el inspector

En el `QuestionEditor` (dentro de `InspectorFields.tsx`), el texto de la pregunta en el encabezado colapsable usa `truncate` (línea 352), lo cual es correcto para el header. Pero el problema real es que el `ScrollArea` del `BlockInspector` no permite word-wrap adecuado porque el viewport de Radix ScrollArea no tiene `min-width: 0` ni `overflow-wrap: break-word`.

**Solución**:
1. En `BlockInspector.tsx`: agregar `className="[&>div]:!overflow-x-hidden"` o `overflow-x-hidden` al contenedor interno del ScrollArea para forzar el contenido a respetar el ancho.
2. En el `InspectorFields.tsx`, cambiar el `Input` de texto de pregunta (línea 366-370) por un `Textarea` para que las preguntas largas tengan salto de línea automático y sean más legibles.
3. Agregar `break-words` al contenedor `p-4` del inspector.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/formatos/editor/EditorCanvas.tsx` | `flex-1` → `h-full` en div raíz |
| `src/components/formatos/editor/BlockInspector.tsx` | Agregar `overflow-x-hidden` y `break-words` al contenido |
| `src/components/formatos/editor/InspectorFields.tsx` | Cambiar `Input` → `Textarea` para texto de pregunta en `QuestionEditor` |

