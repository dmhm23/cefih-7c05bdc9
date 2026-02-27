

## Plan: Auto-guardar firma al enviar documento

### Enfoque

Eliminar el botón "Guardar Firma" de `FirmaCaptura` y capturar automáticamente la firma cada vez que el usuario termine un trazo (`onEnd`). Así, cuando el usuario presione "Enviar documento", la firma ya estará lista sin pasos intermedios.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/matriculas/FirmaCaptura.tsx` | Agregar callback `onEnd` en `SignatureCanvas` que llame `onGuardar(base64)` automáticamente al terminar cada trazo. Eliminar el botón "Guardar Firma". Eliminar el estado intermedio "Firma capturada" (el canvas sigue visible). Mantener solo el botón "Limpiar" (que además llame `onGuardar("")` o un `onLimpiar` para resetear). |
| `src/pages/estudiante/InfoAprendizPage.tsx` | Ajustar `puedeEnviar`: validar que `firmaBase64` tenga contenido y `autorizacion === 'acepto'`. Al limpiar la firma, resetear `firmaBase64` a `null`. Sin más cambios. |

### Detalle del flujo resultante

1. Estudiante dibuja en el canvas → `onEnd` extrae base64 y lo pasa al padre vía `onGuardar`.
2. Estudiante presiona "Limpiar" → se limpia canvas y se resetea firma en el padre.
3. Estudiante presiona "Enviar documento" → la firma ya está en `firmaBase64`, se envía todo junto.

