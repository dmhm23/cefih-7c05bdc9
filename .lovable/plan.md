## Plan: Reset correcto al eliminar consolidado + UX completa de "documento cargado"

### Causas raíz (3 problemas distintos)

**Problema 1 — Eliminar no resetea el documento en BD:**
En `handleDeleteDoc` (líneas 504-521 de `MatriculaDetallePage.tsx` e idéntico en `MatriculaDetailSheet.tsx`) se envían los campos a limpiar como `undefined`. Al pasar por `camelToSnake` y luego por el `.update()` de Supabase, las propiedades con valor `undefined` **se eliminan del payload JSON** — Supabase nunca recibe la instrucción de limpiar `storage_path`, `archivo_nombre`, `archivo_tamano`, `fecha_carga`. Resultado: el `estado` sí pasa a `pendiente`, pero los demás campos quedan intactos → al recargar, la fila aparece como "pendiente" pero con archivo, y como el contador usa `estado !== 'pendiente'` el progreso baja correctamente, pero el usuario ve inconsistencias.

**Problema 2 — En modo Consolidado, eliminar uno solo deja huérfanos a los demás:**
El consolidado marca N documentos con el **mismo `storage_path**`. Si el usuario elimina uno, los otros N-1 siguen apuntando al mismo PDF que ya nadie referencia visualmente. Pero el caso reportado es peor: el usuario está en modo consolidado, no ve botones de eliminar individuales (los checkboxes del consolidado no muestran acciones), entonces "elimina" desde otra parte y los contadores no se refrescan porque el `consolidadoPreview` local **persiste en estado de React** aunque la BD haya cambiado.

**Problema 3 — Faltan acciones visibles en modo Consolidado tras la carga:**  
El bloque "Requisitos incluidos en el PDF" (líneas 348-373) sólo renderiza un checkbox + badge cuando el documento está cargado. **No hay vista del archivo cargado, botón de vista previa, ni botón de eliminar, ni confirmación**. Toda la UX de gestión post-carga vive sólo en el modo Individual (líneas 311-334). Solo existe vista previa de inmediato.

### Solución propuesta

**1. Persistir correctamente la limpieza en BD**

En `handleDeleteDoc` (en ambos archivos) cambiar `undefined` por `null`. El `camelToSnake` preserva `null` y Supabase lo persiste como `NULL` en la columna:

```ts
data: {
  estado: 'pendiente',
  fechaCarga: null,
  urlDrive: null,
  archivoNombre: null,
  archivoTamano: null,
} as any
```

**2. Eliminación en cascada del consolidado (semánticamente correcta)**

Cuando un documento eliminado tiene `storage_path` y existen **otros documentos de la misma matrícula con el mismo `storage_path**`, ofrecer dos rutas:

- **Si el usuario elimina desde modo Individual:** confirmar con `ConfirmDialog` que dice *"Este archivo cubre N requisitos. ¿Eliminar de todos o solo de este?"* — dos botones: **"Solo este"** (limpia 1 fila) o **"Todos"** (limpia las N filas y borra el blob de Storage).
- **Si el usuario elimina desde modo Consolidado:** acción única "Eliminar consolidado" que limpia las N filas + borra el blob.

Nuevo hook `useDeleteConsolidado(matriculaId, storagePath)` en `useMatriculas.ts`:

1. Buscar todos los documentos de la matrícula con ese `storage_path`.
2. Hacer `update` masivo seteando los 5 campos a `null` / `'pendiente'`.
3. Llamar a `driveService.deleteFile(storagePath)` para limpiar Storage.
4. Invalidar queries.

**3. UX completa en modo Consolidado tras la carga**

Refactorizar el bloque "Requisitos incluidos en el PDF" para que cada fila cargada muestre:

- Nombre del documento + badge "Cargado".
- Nombre de archivo + tamaño (mismo `renderFileInfo`).
- Acciones a la derecha (mismo `DropdownMenu` del modo individual): **Vista previa**, **Volver a cargar** (re-sube y cubre los mismos tipos), **Eliminar** (con `ConfirmDialog` "¿Deseas eliminar el consolidado? Se quitará de los N requisitos cubiertos").

Cuando todos los documentos del consolidado están cargados con el mismo `storage_path`, mostrar en cabecera del bloque un panel resumen: *"Consolidado activo: `nombre_archivo.pdf` (N requisitos cubiertos)"* + acciones globales de Vista previa y Eliminar.

**4. Limpiar `consolidadoPreview` y `previews` locales tras eliminar**

`DocumentosCarga` mantiene `consolidadoPreview` en estado local. Cuando los documentos eliminados pasan a `pendiente`, debe sincronizarse:

- Detectar vía `useEffect` que ya no existe ningún documento `cargado` con archivo del consolidado actual → `setConsolidadoPreview(null)`.
- Hacer lo mismo con `previews[docId]` cuando un doc individual pasa a `pendiente`.

**5. ConfirmDialog estándar**

Usar `ConfirmDialog` ya existente en `src/components/shared/ConfirmDialog.tsx` con `variant="destructive"` para todos los borrados.

### Archivos tocados


| Archivo                                              | Cambio                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/matriculas/MatriculaDetallePage.tsx`      | `handleDeleteDoc`: `undefined` → `null`; añadir `handleDeleteConsolidado`; pasar prop `onDeleteConsolidado`                                                                                                                  |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Idem                                                                                                                                                                                                                         |
| `src/hooks/useMatriculas.ts`                         | Nuevo `useDeleteConsolidado` que actualiza N docs + borra blob de Storage                                                                                                                                                    |
| `src/components/matriculas/DocumentosCarga.tsx`      | Acciones (preview/recargar/eliminar) en modo consolidado por requisito y a nivel global; `useEffect` para sincronizar `consolidadoPreview` y `previews` cuando cambia el estado de los docs; `ConfirmDialog` antes de borrar |


### Validación post-cambio

- Modo Consolidado → cargar PDF que cubre 6 requisitos → ver "Consolidado activo: archivo.pdf (6 requisitos)" con acciones Vista previa / Eliminar.
- Click en Eliminar → modal *"¿Deseas eliminar el consolidado?"* → confirmar → los 6 requisitos vuelven a `pendiente`, contador 0/6, barra al 0%, checkboxes habilitados, blob borrado de Storage.
- Modo Individual → eliminar un doc cubierto por consolidado → modal con dos botones "Solo este" / "Todos".
- Recargar la página tras eliminar → la BD refleja el reset correctamente (no quedan campos huérfanos).
- Cargar un solo doc individual → eliminar desde el `DropdownMenu` → modal de confirmación → reset visual + BD.

### Sin impacto colateral

- El flujo de carga (individual y consolidado) que ya funciona no se toca.
- No requiere migración SQL ni cambios de enum.
- `driveService.deleteFile` ya existe y está sin uso → ahora se invoca.
- El `useUploadConsolidado` se mantiene tal cual.