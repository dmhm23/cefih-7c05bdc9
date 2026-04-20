## Plan: Consolidado como un único documento + Vista previa real para todos

### Causa raíz del modelo actual

Hoy el consolidado **clona** el mismo `storage_path` en N filas de `documentos_matricula`. Eso obliga a:

- Eliminar N registros para "borrar" un solo PDF.
- Mostrar UI con cascada ("solo este / todos") que es confusa.
- No hay vista previa real desde Storage (solo blob en memoria que se pierde al refrescar).

### Nuevo modelo (semánticamente correcto)

**Una sola fila `tipo='consolidado'**` en `documentos_matricula` representa el PDF consolidado. Esa fila guarda en sus columnas existentes la lista de requisitos que cubre (en `nombre`, formato `"Consolidado (cedula, arl, examen_medico)"`). Las filas individuales originales **permanecen `pendiente**` y se consideran "cubiertas" lógicamente cuando existe una fila consolidado activa que las nombra.

```text
ANTES (mal):                          AHORA (bien):
┌─ cedula      cargado  /AAA.pdf      ┌─ cedula      Cargado (Siempre y cuando el 
                                      usuario haya seleccionado en el consolidad)
├─ arl         cargado  /AAA.pdf      ├─ arl         Cargado (Siempre y cuando el 
                                      usuario haya seleccionado en el consolidad)
└─ examen_med  cargado  /AAA.pdf      ├─ examen_med  Cargado (Siempre y cuando el 
                                      usuario haya seleccionado en el consolidad)
                                      └─ consolidado cargado /AAA.pdf  ← cubre cedula+arl+examen_med
```

### Cambios técnicos

**1. `useUploadConsolidado` (refactor en `src/hooks/useMatriculas.ts`)**

- Subir el PDF a Storage (igual que hoy).
- Buscar fila existente `tipo='consolidado'` para esa matrícula:
  - Si existe → `update`: nuevo `storage_path`, `archivo_nombre`, `archivo_tamano`, `fecha_carga`, `nombre` recalculado con la nueva lista de tipos.
  - Si no existe → `insert` una nueva fila `tipo='consolidado'`, `estado='cargado'` con esos mismos campos.
- **Ya no actualiza** las filas individuales.
- Persistir la lista de tipos cubiertos en `nombre` con un patrón parseable: `"Consolidado: cedula|arl|examen_medico"` (delimitador `|` después del prefijo `Consolidado:` ).

**2. `useDeleteConsolidado` (refactor)**

- Recibe únicamente `{ matriculaId, consolidadoId, storagePath }`.
- Borra **una sola fila** (`delete` o reset según preferencia → preferimos `delete` físico de la fila tipo `consolidado` para no dejar registros vacíos, manteniendo intactos los pendientes individuales).
- Borra el blob de Storage (`driveService.deleteFile`).

**3. `DocumentosCarga.tsx` (refactor)**

- Detección del consolidado: buscar la fila `tipo='consolidado' && estado='cargado'`. Esa fila es la **única fuente de verdad** del consolidado.
- Parsear `nombre` para extraer `tiposCubiertos[]`.
- **Cómputo de progreso**: un requisito individual se cuenta como "completado" si:
  - Su propia fila está `cargado` (modo individual), **o**
  - Su `tipo` está en `tiposCubiertos[]` del consolidado activo.
- **Modo Consolidado**:
  - Cabecera "Consolidado activo": nombre archivo, N requisitos, botones **Ver** y **Eliminar**.
  - Checklist debajo: muestra cada requisito; los cubiertos por el consolidado se marcan visualmente como "Cubierto por consolidado" (sin checkbox accionable, sin botón de eliminar individual).
  - Solo un único punto de eliminación: el botón "Eliminar" de la cabecera del consolidado.
- **Modo Individual**: sigue funcionando igual para cargas/eliminaciones individuales. Si existe consolidado activo, los requisitos cubiertos se muestran en estado "Cubierto por consolidado" (no editables, sin acciones — para tocarlos hay que ir a modo Consolidado y eliminarlo primero).
- Eliminar el `AlertDialog` de cascada "Solo este / Todos" — ya no aplica.

**4. Vista previa real (Storage signed URL) — para individuales y consolidado**

- Crear un helper local `usePreviewArchivo(storagePath)` o una función `openPreview(doc)` que:
  - Si hay blob en memoria (`previews[docId]` o `consolidadoPreview`) → usarlo.
  - Si no → llamar `driveService.getSignedUrl(doc.urlDrive)` y usar la URL firmada.
- Reemplazar el panel inline actual por `**ArchivoPreviewDialog**` (ya existe en `src/components/cartera/ArchivoPreviewDialog.tsx`), que abre un modal con iframe para PDFs y `<img>` para imágenes. Esto unifica con el resto del sistema.
- El icono de "Ver" (👁) aparece en:
  - Cada fila cargada en modo Individual (junto al `MoreHorizontal` o reemplazándolo por un icono dedicado más visible).
  - Cabecera del consolidado en modo Consolidado.
- Botón "Ver" deshabilitado solo si no hay `urlDrive` ni blob.

**5. Limpiar handlers en parents**

- `MatriculaDetallePage.tsx` y `MatriculaDetailSheet.tsx`:
  - `handleDeleteConsolidado(consolidadoId, storagePath)` con nueva firma (un solo id).
  - `handleUploadConsolidado(file, tiposIncluidos)` — ya no recibe `documentosIds` (no hay filas a actualizar).

### Migración del estado existente

Para matrículas que ya tienen consolidado **viejo** (N filas con el mismo `storage_path`):

- Detectarlo en runtime en `DocumentosCarga` (igual que hoy con `consolidadoGroups`).
- Mostrar banner discreto "Migrar consolidado al nuevo formato" → un click ejecuta:
  - Crea la fila `tipo='consolidado'` con los datos del grupo.
  - Resetea las N filas individuales a `pendiente` (limpia `storage_path`, etc.).
  - **No** borra el blob.
- Alternativa más simple: una migración SQL one-shot que haga lo mismo automáticamente. **Preferimos la migración SQL** para no dejar deuda visible al usuario.

### Archivos tocados


| Archivo                                              | Cambio                                                                                                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/<nueva>.sql`                    | Migrar consolidados existentes: crear fila `tipo='consolidado'` por grupo y resetear las N filas duplicadas                                                                                 |
| `src/hooks/useMatriculas.ts`                         | `useUploadConsolidado`: insert/update **una sola** fila `tipo='consolidado'`. `useDeleteConsolidado`: borra una sola fila + blob                                                            |
| `src/components/matriculas/DocumentosCarga.tsx`      | Detección por `tipo='consolidado'`; parseo de tipos cubiertos desde `nombre`; cómputo de progreso unificado; eliminar UI de cascada; integrar `ArchivoPreviewDialog` para Vista previa real |
| `src/pages/matriculas/MatriculaDetallePage.tsx`      | Ajustar firmas de `handleUploadConsolidado` y `handleDeleteConsolidado`                                                                                                                     |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Idem                                                                                                                                                                                        |
| `src/services/documentoService.ts`                   | Asegurar que `crearDocumentosMatricula` y `sincronizarDocumentos` no creen ni toquen filas `tipo='consolidado'`                                                                             |


### Validación post-cambio

- Modo Consolidado → seleccionar 6 requisitos → soltar PDF → en BD aparece **una sola fila** nueva `tipo='consolidado'`, las 6 filas originales siguen `pendiente`. Progreso 6/6.
- Click "Ver" en la cabecera del consolidado → abre `ArchivoPreviewDialog` con el PDF firmado desde Storage.
- Click "Eliminar" en cabecera → confirmación → borra **una sola fila** + blob. Progreso 0/6, los 6 requisitos vuelven a estar disponibles.
- Modo Individual → cargar 1 doc → click "Ver" → abre `ArchivoPreviewDialog` con signed URL. Click "Eliminar" → reset de esa fila únicamente.
- Recargar la página → estado consistente con BD.
- Matrículas viejas (ya cargadas antes) → la migración SQL las normaliza al abrir.

### Sin impacto colateral

- No cambia el enum (`consolidado` ya existe).
- No afecta certificación, cartera, cursos ni portal.
- `documentoService.sincronizarDocumentos` sigue usando `tipos_requeridos` del nivel, que **no incluye** `consolidado` → la fila consolidado nunca se borra como "sobrante" porque el filtro adicional `archivoNombre` la protege.
- El conteo de "matrículas incompletas" del dashboard usa `estado='pendiente' AND opcional=false`. Con el nuevo modelo, las filas individuales cubiertas por consolidado seguirían `pendiente` en BD → habría que ajustar el cómputo del lado servidor o aceptar el desfase. **Decisión**: en una iteración posterior se revisará la RPC `get_dashboard_stats`; por ahora se asume que basta con la consistencia visual en la página de matrícula.