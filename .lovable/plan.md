

## Plan: Vista previa inline de archivos adjuntos en FileDropZone

### Problema
Cuando se adjunta un archivo en los modales de factura o pago, solo se muestra el nombre del archivo. Para visualizarlo hay que abrirlo en otra ventana.

### Solución
Modificar `FileDropZone` para que, cuando hay un archivo seleccionado, muestre una vista previa visual del documento directamente en el componente:
- **Imágenes** (PNG, JPG): etiqueta `<img>` con el blob URL
- **PDF**: `<iframe>` con el blob URL
- Otros: mensaje de "sin vista previa disponible"

### Cambio: `src/components/shared/FileDropZone.tsx`

Reemplazar el bloque actual de "archivo seleccionado" (líneas 107-125) que solo muestra nombre + tamaño + botón X, por un bloque que:

1. Genera un `URL.createObjectURL(file)` via `useMemo` para obtener la URL de previsualización
2. Detecta el tipo de archivo (imagen vs PDF) usando `file.type`
3. Muestra una barra compacta superior con: icono + nombre truncado + tamaño + botón X (como ahora pero más compacto)
4. Debajo muestra el preview:
   - Imagen: `<img src={blobUrl} className="max-h-40 object-contain" />`
   - PDF: `<iframe src={blobUrl} className="w-full h-40" />`
   - Otro: texto informativo
5. Limpia el object URL con `useEffect` cleanup para evitar memory leaks
6. Mantiene las restricciones de `min-w-0`, `overflow-hidden` para no desbordar el modal

### Resultado visual esperado
```text
┌──────────────────────────────────┐
│ 📄 archivo_soporte…pdf  120KB  ✕ │  ← barra compacta
│ ┌──────────────────────────────┐ │
│ │                              │ │
│ │    [vista previa inline]     │ │  ← preview ~160px alto
│ │                              │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
```

Un solo archivo modificado. El cambio aplica automáticamente en todos los modales que usan `FileDropZone`.

