
Objetivo: corregir de verdad el “papel” blanco del editor para que tenga una altura base coherente con una hoja carta y, a partir de ahí, crezca con el contenido real de los bloques.

Diagnóstico

1. El canvas sí tiene altura dinámica, pero parte de una base incorrecta
- En `src/components/formatos/editor/EditorCanvas.tsx`, la hoja usa `min-h-[600px] h-fit`.
- `600px` es visualmente “media carta” para el ancho actual (`max-w-4xl`), por eso la hoja se ve corta aunque técnicamente pueda crecer.
- Resultado: mientras el contenido no supere esos 600px, la hoja siempre parece demasiado baja.

2. El ajuste anterior no resolvió la causa completa
- En `src/components/formatos/editor/CanvasBlock.tsx` se cambió el contenedor externo a `overflow-visible`, pero el contenedor interno del contenido sigue con `overflow-hidden`:
  `className="pl-5 pr-14 min-w-0 overflow-hidden"`
- Eso todavía puede recortar previews altos o anchos antes de que su altura real llegue al contenedor blanco.

3. Los previews complejos están truncados a propósito
- En `src/components/formatos/editor/BlockPreview.tsx`, bloques como evaluación y encuesta usan:
  - `preguntas.slice(0, 3)`
  - `escalaPreguntas.slice(0, 3)`
  - `line-clamp-2`
  - varios `overflow-hidden`
- Entonces el canvas no está midiendo el contenido real del bloque, sino una versión resumida.
- Aunque el bloque tenga muchas preguntas, el alto renderizado sigue siendo pequeño; por eso la hoja no “acompaña” el largo real del formato.

Conclusión
- El problema no es solo “overflow” del bloque.
- Hay 3 causas combinadas:
  1) altura base de hoja demasiado baja,
  2) clipping interno aún activo,
  3) previews resumidos que no representan el contenido completo.

Plan de corrección

1. Corregir la base visual de la hoja en `EditorCanvas.tsx`
- Reemplazar la lógica `min-h-[600px] h-fit` por una base con proporción carta.
- Propuesta:
  - mantener `w-full max-w-4xl`
  - usar una relación `aspect-[8.5/11]` como altura base visual
  - permitir crecimiento natural si el contenido supera esa altura
- Efecto: la hoja dejará de verse como “media carta” incluso con pocos bloques.

2. Eliminar el clipping restante en el contenido de cada bloque
- En `CanvasBlock.tsx`, cambiar el contenedor interno del preview de `overflow-hidden` a `overflow-visible` o quitar esa restricción.
- Revisar el bloque interno de columnas en `CanvasRow.tsx` para asegurar que tampoco recorte contenido.

3. Hacer que los bloques complejos rendericen su altura real en el canvas
- En `BlockPreview.tsx`, para `evaluation_quiz` y `satisfaction_survey`:
  - quitar `slice(0, 3)` del preview del canvas
  - quitar `line-clamp` y `overflow-hidden` donde esté limitando la altura
  - permitir que preguntas, opciones y filas de encuesta se rendericen completas
- Así el alto del bloque reflejará el contenido real y la hoja podrá crecer correctamente.

4. Mantener legibilidad sin volver inmanejable el canvas
- Conservar wrapping (`break-words`, `whitespace-pre-wrap`, `min-w-0`) para textos largos.
- Si algún bloque queda demasiado extenso, usar espaciado y secciones internas, pero no truncamiento visual en el canvas.

Archivos a ajustar
- `src/components/formatos/editor/EditorCanvas.tsx`
- `src/components/formatos/editor/CanvasBlock.tsx`
- `src/components/formatos/editor/CanvasRow.tsx`
- `src/components/formatos/editor/BlockPreview.tsx`

Resultado esperado
- La hoja blanca tendrá una altura inicial coherente con tamaño carta.
- Cuando agregues más bloques, o un bloque tenga muchas preguntas, la hoja crecerá de forma visible y natural.
- El canvas dejará de mostrar una versión “resumida” que engaña la altura real del documento.
