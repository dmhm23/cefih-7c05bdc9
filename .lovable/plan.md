

## Diagnóstico: Por qué hojaDinamica se detiene en 523px

### Causa raíz

El contenedor externo de `EditorCanvas` (línea 70) es un **flex column** con `h-full`:

```text
div.outer  →  h-full flex flex-col overflow-y-auto
  └─ div#hojaDinamica  →  h-auto (flex child)
```

Por defecto, los hijos de un flex container tienen `flex-shrink: 1`. Esto significa que cuando el contenido de `hojaDinamica` supera la altura del padre, **el navegador lo encoge para que quepa** en lugar de dejarlo crecer y activar el scroll.

Los números lo confirman: 523px (content) + 40px (py-10) + 80px (pb-20) = **643px**, que coincide exactamente con la altura disponible del `ResizablePanel`. Una vez que hojaDinamica alcanza el tope del panel, flex-shrink la comprime y los bloques se desbordan visualmente.

### Corrección

**Archivo**: `src/components/formatos/editor/EditorCanvas.tsx`

Agregar `shrink-0` (equivalente a `flex-shrink: 0`) al div `hojaDinamica`. Esto le indica al flex container que no comprima la hoja, permitiéndole crecer más allá del padre y activar el `overflow-y-auto` del contenedor externo.

Cambio en línea 75: agregar `shrink-0` a las clases de hojaDinamica.

### Resultado esperado

- hojaDinamica crecerá sin límite conforme se agreguen bloques
- El scroll vertical del contenedor externo se activará naturalmente
- El log mostrará alturas incrementales sin techo artificial

