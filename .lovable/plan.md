
## Plan: Habilitar la vista previa de archivos ya cargados (sin Google Drive)

### Causa raíz

El sistema arrastra una convención obsoleta: el campo `urlDrive` en la interfaz `DocumentoRequerido` y en todo el front se llama así por una etapa previa donde se planeaba usar Google Drive. Hoy los archivos viven 100% en **Supabase Storage** (bucket `documentos-matricula`), pero la columna física en BD es `storage_path` y el front sigue esperando `urlDrive`.

En `matriculaService.getById` (línea 184) los documentos se mapean con `snakeToCamel`, que convierte mecánicamente `storage_path` → **`storagePath`**. Resultado: tras refrescar la página, `doc.urlDrive` siempre es `undefined`, y el botón "Ver" en `DocumentosCarga.tsx` queda permanentemente deshabilitado por la guarda `disabled={!doc.urlDrive && !hasBlob}`.

Verificado en BD para el estudiante 1110552380:

```
id            : cdba3bb8-7b2e-4e43-8f01-ed09534c353b
tipo          : cedula
estado        : cargado
storage_path  : 2026/e88d124e-…/1110552380/cdba3bb8-…_1776717330659.pdf  ✅ existe
archivo_nombre: 20260420092931245.pdf
```

El archivo está en Storage; solo el front no lo lee bajo el nombre correcto.

### Decisión arquitectónica

Eliminar la convención `urlDrive` del front y unificar todo bajo `storagePath`, alineado con la BD y con el resto del sistema (`personalService`, `cursos_mintrabajo_adjuntos`, `firmas_matricula`). Así desaparece la deuda semántica del nombre "Drive" y queda una única fuente de verdad: **Supabase Storage**.

### Cambios técnicos

**1. `src/types/matricula.ts` — renombrar campo en `DocumentoRequerido`**

```ts
// antes
urlDrive?: string;
// después
storagePath?: string | null;
```

**2. `src/services/matriculaService.ts` — limpiar mapeos legacy**

- `getById`: eliminar cualquier transformación inversa; el `snakeToCamel` ya entrega `storagePath` natural — basta con tiparlo.
- `updateDocumento` (líneas 292-296): quitar el mapeo `urlDrive` → `storage_path` (ya no aplica) y dejar `storagePath` directo.
- Cualquier referencia a `urlDrive` en este archivo se renombra a `storagePath`.

**3. `src/hooks/useMatriculas.ts` — renombrar usos**

- `useUploadDocumento`: el `update` final pasa `storagePath: storageKey` en vez de `urlDrive: storageKey`.
- Idem en cualquier otro `mutationFn` que toque documentos individuales.

**4. `src/components/matriculas/DocumentosCarga.tsx` — usar `storagePath` y habilitar el botón Ver**

- Reemplazar todas las lecturas de `doc.urlDrive` por `doc.storagePath`.
- Guarda del botón Ver:
  ```ts
  disabled={!doc.storagePath && !hasBlob}
  ```
- Función `openPreview(doc)`:
  ```ts
  if (previews[doc.id]) return openWith(previews[doc.id]);
  if (doc.storagePath) {
    const url = await driveService.getSignedUrl(doc.storagePath);
    return openWith(url);
  }
  ```
  (`driveService` mantiene su nombre de archivo por compatibilidad, pero internamente solo usa Supabase Storage — opcional renombrarlo a `storageService` en una iteración aparte para no inflar este cambio.)

**5. `src/pages/matriculas/MatriculaDetallePage.tsx` y `MatriculaDetailSheet.tsx`**

- En `handleDeleteDoc`: cambiar el campo `urlDrive: null` por `storagePath: null` dentro del payload de reset.
- Cualquier lectura `doc.urlDrive` → `doc.storagePath`.

**6. Compatibilidad con el flujo de carga ya migrado**

- `useUploadConsolidado` ya inserta directo en BD con `storage_path` — no se toca.
- `useDeleteConsolidado` igual — no se toca.
- El bucket y RLS no cambian.

### Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/types/matricula.ts` | Renombrar `urlDrive` → `storagePath` en `DocumentoRequerido` |
| `src/services/matriculaService.ts` | Eliminar mapeos legacy `urlDrive ↔ storage_path`; usar `storagePath` directo |
| `src/hooks/useMatriculas.ts` | `useUploadDocumento` persiste `storagePath` |
| `src/components/matriculas/DocumentosCarga.tsx` | Lecturas a `doc.storagePath`; habilitar botón "Ver" cuando exista; `openPreview` usa `getSignedUrl(doc.storagePath)` |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | `handleDeleteDoc` resetea `storagePath: null`; lecturas migradas |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Idem |

### Validación post-cambio

- `/matriculas/<id>` del estudiante 1110552380 → modo Individual → el documento `cedula` (`20260420092931245.pdf`) muestra el botón **Ver habilitado**. Click abre `ArchivoPreviewDialog` con la signed URL del PDF desde Supabase Storage.
- Cargar un nuevo documento individual → recargar la página → el botón "Ver" sigue habilitado (no depende del blob local en memoria).
- Cargar un consolidado → recargar → el banner "Consolidado activo" muestra "Ver" funcionando.
- Eliminar un documento → su botón "Ver" desaparece (vuelve a `pendiente` y se renderiza el `FileDropZone`).
- En BD: las columnas siguen siendo `storage_path` — no hay migración SQL.

### Sin impacto colateral

- No cambia esquema de BD ni enums.
- No afecta certificación, cartera, cursos ni portal estudiante (esos flujos no leen `urlDrive`).
- `personalService` ya usaba `storagePath` — queda alineado con esta convención.
- Cero referencias a Google Drive en el código tras el cambio.
