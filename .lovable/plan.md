

# Plan: Corregir vista previa y descarga de adjuntos en Gestión de Personal

## Problema raíz

Cuando se carga un adjunto en Gestión de Personal y se guarda el perfil, al volver a abrir el perfil los adjuntos aparecen **sin URL de descarga ni vista previa**. Esto ocurre porque `personalService.getById()` carga los adjuntos con `mapAdjuntoRow()` que **no genera signed URLs** desde Supabase Storage. El campo `dataUrl` queda `undefined`, lo que:

1. Oculta el botón de "Vista previa" (Eye) — condición `adj.dataUrl &&` en línea 102
2. Deshabilita el botón de "Descargar" — condición `disabled={!adj.dataUrl}` en línea 119
3. El usuario solo ve el FileDropZone y al hacer clic ahí se abre el selector de archivos (parece un error de carga)

## Solución

### Paso 1: Generar signed URLs para cada adjunto en `personalService.ts`

En `getById()`, después de cargar los adjuntos, iterar sobre cada uno y generar una signed URL desde el bucket `adjuntos-personal` usando el `storage_path` guardado en la tabla `personal_adjuntos`.

Actualizar `mapAdjuntoRow` para incluir `storagePath` y luego en `getById` asignar `dataUrl` con la signed URL.

### Paso 2: Actualizar `AdjuntosPersonal.tsx` para usar signed URLs directamente

El componente actualmente convierte `dataUrl` (base64) a blob URLs con `dataUrlToBlobUrl()`. Con signed URLs (que son URLs HTTP normales), ya no necesita esa conversión. Ajustar para detectar si `dataUrl` es una URL HTTP (signed) y usarla directamente, sin pasar por `dataUrlToBlobUrl`.

### Paso 3: Verificar el mismo patrón en otros módulos

Revisar `DocumentosCarga.tsx` (matrícula) y cualquier otro componente que use `ArchivoPreviewDialog` o patrones similares de carga+preview, para asegurar que no tengan el mismo problema.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/services/personalService.ts` | Generar signed URLs para adjuntos en `getById` |
| `src/types/personal.ts` | Agregar campo opcional `storagePath` a `AdjuntoPersonal` |
| `src/components/personal/AdjuntosPersonal.tsx` | Soportar signed URLs (HTTP) además de data URLs (base64) |

**Total: 3 archivos editados, 0 migraciones**

