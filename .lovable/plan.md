
Objetivo: hacer que la hoja blanca del editor tenga altura realmente dinámica y crezca conforme se agregan bloques, sin mantener una altura fija que da la sensación de “media carta”.

Diagnóstico actual

- El problema principal ya no es el `overflow` de los bloques: en el código actual `CanvasBlock`, `CanvasRow` y los previews complejos ya usan `overflow-visible`.
- La causa real ahora está en `src/components/formatos/editor/EditorCanvas.tsx`: la hoja sigue teniendo `min-h-[1056px] h-fit`.
- Eso significa que la altura visible de la hoja no depende de los bloques mientras el contenido no supere esos 1056px. En la práctica:
  - agregas bloques,
  - los bloques sí crecen,
  - pero la hoja no cambia visualmente hasta rebasar ese mínimo.
- Por eso da la impresión de que “no acompaña” el contenido: la hoja está anclada a una base fija demasiado dominante para el editor.

Qué corregir

1. Hacer que la altura de la hoja dependa del contenido
- En `EditorCanvas.tsx`, quitar la lógica fija de `min-h-[1056px]`.
- Dejar la hoja con altura natural (`h-auto` / `min-h-0`) para que el largo lo determinen los bloques renderizados.

2. Mantener una buena experiencia cuando el formato está vacío
- Si se quiere conservar la sensación visual de “documento” al iniciar, aplicar una altura base solo en estado vacío.
- Regla propuesta:
  - sin bloques: mostrar una hoja con alto de referencia,
  - con bloques: usar altura totalmente dinámica.

3. Separar “apariencia de hoja” de “altura real del contenido”
- El canvas debe tener:
  - contenedor externo con scroll,
  - hoja interna con ancho fijo visual,
  - contenido interno que define la altura.
- Así el scroll vive en el canvas, pero la hoja no queda artificialmente congelada.

4. Revisar bloques que compactan demasiado el contenido
- En `BlockPreview.tsx`, validar que evaluación y encuesta no usen layouts que aparenten menos altura de la real.
- No es el problema principal, pero conviene mantener:
  - `break-words`
  - `whitespace-pre-wrap`
  - `min-w-0`
  para que el bloque crezca hacia abajo y no “ahorre” altura empujando contenido horizontalmente.

Implementación propuesta

- `src/components/formatos/editor/EditorCanvas.tsx`
  - reemplazar `min-h-[1056px] h-fit` por una altura natural
  - condicionar la altura base solo cuando `items.length === 0`
  - mantener el scroll en el contenedor externo

- `src/components/formatos/editor/BlockPreview.tsx`
  - revisar especialmente previews de evaluación y encuesta para asegurar crecimiento vertical estable y sin compresión visual excesiva

Resultado esperado

- La hoja blanca crecerá inmediatamente conforme se agreguen bloques.
- Ya no se verá “media carta” por culpa de un mínimo fijo.
- El editor mantendrá el estilo visual actual, pero con un comportamiento más coherente con el contenido construido.

Criterio de validación

- Al agregar un bloque simple, la hoja debe aumentar su largo visible.
- Al agregar varias preguntas en evaluación o encuesta, la hoja debe seguir creciendo sin esperar a superar una altura fija inicial.
- El scroll debe seguir funcionando en el canvas, no dentro de la hoja.
