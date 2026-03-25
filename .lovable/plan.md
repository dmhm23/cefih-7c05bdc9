

## Diagnóstico: Por qué Chrome bloquea la vista previa de PDFs

### Causa raíz

La aplicación corre dentro del iframe de preview de Lovable (`id-preview--*.lovable.app`). Cuando se intenta mostrar un PDF dentro de un **iframe anidado** (iframe dentro de iframe), Chrome aplica restricciones de seguridad de sandboxing que bloquean la carga de `blob:` URLs en iframes anidados, mostrando el mensaje "This page has been blocked by Chrome".

El código actual en `AdjuntosPersonal.tsx` (línea 159) hace exactamente esto:
```html
<iframe src={blobUrls[adj.id]} ... />  <!-- iframe anidado → bloqueado -->
```

Adicionalmente, hay un bug en el código: las líneas 160-163 tienen una condición duplicada (`adj.tipo.startsWith("image/")`) que hace la segunda rama inalcanzable — aunque esto no afecta la funcionalidad actual.

### Solución propuesta

Reemplazar el `<iframe>` para PDFs por un `<object>` tag, que Chrome permite en contextos de sandboxing. Si el navegador no puede renderizar el objeto, se muestra un fallback con botón para abrir en nueva pestaña.

### Cambio — `src/components/personal/AdjuntosPersonal.tsx`

1. Reemplazar `<iframe src={blobUrls[adj.id]}>` por `<object data={blobUrls[adj.id]} type="application/pdf">` con un fallback textual que incluya un enlace para abrir en nueva pestaña
2. Eliminar la rama duplicada de imagen (líneas 162-163) que nunca se ejecuta
3. Mantener el botón "Abrir" existente que usa `window.open(blobUrl, "_blank")` como alternativa principal

### Archivo modificado
- `src/components/personal/AdjuntosPersonal.tsx` — solo la sección de renderizado del preview inline (líneas 158-169)

