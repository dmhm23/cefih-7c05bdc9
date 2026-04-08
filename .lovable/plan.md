

# Plan: Corregir carga de adjuntos en Gestión de Personal

## Problemas identificados

### 1. Solo permite un archivo a la vez
`FileDropZone` toma solo `files?.[0]` en `handleDrop` (línea 96) y `handleInputChange` (línea 101). El `<input>` no tiene atributo `multiple`. `AdjuntosPersonal` usa `onFile` (singular) que solo acepta un `File`.

### 2. Toast antes de que aparezca el archivo
En `PersonalDetallePage`, `handleUploadAdjunto` muestra el toast inmediatamente al resolver `addAdjunto.mutateAsync`, pero la invalidación del query y refetch es asíncrona, así que el archivo aparece después del mensaje.

### 3. Nombres con espacios/paréntesis rechazan la carga
En `personalService.addAdjunto` (línea 213), el path es `personal/${personalId}/${Date.now()}_${file.name}`. Si el nombre tiene espacios o paréntesis (ej. "Documento sin título (6).pdf"), Supabase Storage puede rechazar la subida.

## Solución

### Archivo: `src/components/shared/FileDropZone.tsx`
- Agregar prop `multiple?: boolean`
- Agregar prop `onFiles?: (files: File[]) => void` para carga múltiple
- En `handleDrop`: iterar sobre todos los archivos del `dataTransfer`, no solo el primero
- En `handleInputChange`: iterar sobre todos los archivos seleccionados
- Agregar atributo `multiple` al `<input>` cuando `multiple` sea true
- Mantener compatibilidad con `onFile` (singular) existente

### Archivo: `src/components/personal/AdjuntosPersonal.tsx`
- Cambiar `onUpload: (file: File) => void` a `onUpload: (file: File) => void | Promise<void>`
- Usar `onFiles` del FileDropZone para pasar múltiples archivos
- Llamar `onUpload` para cada archivo en secuencia o emitir todos

### Archivo: `src/services/personalService.ts`
- En `addAdjunto` (línea 213): sanitizar el nombre del archivo reemplazando espacios y caracteres especiales antes de construir el path de storage
- Mantener el nombre original en la columna `nombre` de la BD para que el usuario vea el nombre real

### Archivo: `src/pages/personal/PersonalDetallePage.tsx`
- En `handleUploadAdjunto`: mover el toast después de que `invalidateQueries` resuelva, o usar `await queryClient.invalidateQueries()` + `await queryClient.refetchQueries()` antes de mostrar el toast
- Soportar carga múltiple: recibir array de archivos, subirlos con `Promise.all`, y mostrar un solo toast al final

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/FileDropZone.tsx` | Agregar props `multiple` y `onFiles`, procesar todos los archivos |
| `src/components/personal/AdjuntosPersonal.tsx` | Usar `onFiles` para pasar múltiples archivos |
| `src/services/personalService.ts` | Sanitizar nombre de archivo en el path de storage |
| `src/pages/personal/PersonalDetallePage.tsx` | Soportar carga múltiple + toast después del refetch |

**Total: 4 archivos editados, 0 migraciones**

