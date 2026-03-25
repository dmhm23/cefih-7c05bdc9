

## Plan: Simplificar UI de documentos adjuntos

### Problema
Cuando no hay archivos, se muestran dos recuadros con borde punteado: el `FileDropZone` y el mensaje "No hay documentos adjuntos". Ambos parecen zonas de carga, generando confusión.

### Solución
En `src/components/personal/AdjuntosPersonal.tsx`, cambiar el estado vacío de un recuadro con borde punteado a un simple texto informativo sin borde, para que quede claro que es solo un mensaje y no una segunda zona de carga.

### Cambio concreto

**`src/components/personal/AdjuntosPersonal.tsx`** (líneas 55-62):
- Eliminar el `div` con `border-2 border-dashed rounded-lg p-6` que simula visualmente otra dropzone
- Reemplazar por un texto simple con padding mínimo: `"Aún no hay documentos adjuntos"` en texto `text-xs text-muted-foreground`, sin borde ni icono grande
- Resultado: un único recuadro visible (el FileDropZone) + un mensaje discreto debajo cuando la lista está vacía

### Archivo modificado
- `src/components/personal/AdjuntosPersonal.tsx`

