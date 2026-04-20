

## Plan: Carga real del PDF Consolidado en Requisitos Documentales

### Causa raíz

El modo **Consolidado** del componente `DocumentosCarga` está cableado a una prop opcional `onUploadConsolidado` que **ningún consumidor pasa hoy** (`MatriculaDetallePage` ni `MatriculaDetailSheet`). Resultado: al soltar el PDF, el `if (onUploadConsolidado)` falla silenciosamente, no se sube nada a Storage, no se actualiza ningún registro en `documentos_matricula`, y la "previsualización" sólo vive en memoria del componente. Adicionalmente, `driveService.uploadConsolidado` existe pero **no tiene hook** que lo invoque, y nunca se marcan los documentos individuales como cubiertos por el consolidado.

### Diseño de la solución (sin parches)

Convertir el flujo consolidado en un caso de primera clase con la misma garantía transaccional que el flujo individual:

**1. Nuevo hook `useUploadConsolidado` en `useMatriculas.ts`**
- Recibe `{ matriculaId, file, tiposIncluidos, metadata }`.
- Llama a `driveService.uploadConsolidado(...)` → obtiene `storagePath`.
- Por cada `tipo` en `tiposIncluidos`:
  - Busca el `documento_matricula` correspondiente.
  - Lo actualiza con: `estado='cargado'`, `storage_path=<path consolidado>`, `archivo_nombre=<file.name>`, `archivo_tamano=<file.size>`, `fecha_carga=hoy`.
- Invalida `['matricula', matriculaId]` y `['matriculas']`.
- Todos los documentos cubiertos comparten el mismo `storage_path` → la preview funciona en cualquiera de ellos abriendo el mismo PDF.

**2. Cableado en `MatriculaDetallePage` y `MatriculaDetailSheet`**
- Añadir `useUploadConsolidado()` en ambos.
- Implementar `handleUploadConsolidado(file, tipos)` análogo a `handleUploadDoc`, con su `metadata` (cursoId, persona, cédula).
- Pasar la prop `onUploadConsolidado={handleUploadConsolidado}` al `<DocumentosCarga>` en los dos lugares.
- Pasar `isUploading` que considere también `uploadConsolidado.isPending`.

**3. Validaciones en `DocumentosCarga` (sin tocar comportamiento individual)**
- Antes de invocar `onUploadConsolidado`: si `tiposSeleccionados.length === 0` y no hay pendientes a auto-incluir → mostrar toast "Selecciona al menos un requisito" y no subir.
- Tras éxito (vía `isUploading` cambia a `false` y los docs incluidos pasan a `cargado`): limpiar `tiposSeleccionados` y mantener la preview con el nombre del archivo subido.
- La `consolidadoPreview` local sigue funcionando para feedback inmediato durante el upload.

**4. Soporte de descarga/preview por documento individual**
- Como cada documento individual cubierto comparte el mismo `storage_path`, el botón "Ver" actual ya funcionará sin cambios: `getSignedUrl(storage_path)` devuelve el PDF consolidado.
- Verificar que `ArchivoPreviewDialog` abre correctamente el PDF (ya lo hace para individuales).

**5. Sin tocar BD ni enums**
- El enum `tipo_documento_matricula` ya incluye `consolidado` (verificado), no necesita migración.
- No se crea fila adicional de tipo `consolidado`: el PDF consolidado **cubre los tipos existentes** del nivel. Esto preserva la semántica de "requisitos del nivel" intacta.

### Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/hooks/useMatriculas.ts` | **Nuevo hook** `useUploadConsolidado` que sube el PDF y actualiza N documentos en lote |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Añadir `handleUploadConsolidado`; pasar `onUploadConsolidado` y combinar `isUploading` |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Idem que arriba para la versión sheet |
| `src/components/matriculas/DocumentosCarga.tsx` | Validación previa al upload (tipos seleccionados); limpiar selección tras éxito |

### Validación post-cambio

- Ir a `/matriculas/<id>` → Requisitos documentales → Consolidado → marcar 3 requisitos → soltar PDF.
- El PDF se sube a `documentos-matricula/{año}/{cursoId}/{cedula}/CONSOLIDADO_{ts}.pdf`.
- Los 3 documentos pasan a `cargado` con el mismo `storage_path`, `archivo_nombre` y `fecha_carga`.
- La preview muestra el archivo justo después de subir.
- Al cambiar a modo Individual, los 3 docs aparecen en verde con botón "Ver" que abre el mismo PDF consolidado.
- Recargar la página → los cambios persisten.
- Subir un consolidado distinto sobreescribe (`upsert: true` ya activo en `driveService.uploadConsolidado`).

### Sin impacto colateral

- El flujo individual queda exactamente como está.
- No se modifica `documentoService` ni `sincronizarDocumentos`.
- No hay migración de BD; el enum ya soporta `consolidado` aunque no lo usemos como fila.
- `driveService.uploadConsolidado` deja de ser código muerto.

