## Mejoras en Documentos Requeridos - Claridad, Vista Previa y Simulacion de Carga

### Problemas identificados

1. **Sin vista previa post-carga**: Cuando un documento se marca como "cargado" (con URL simulada de Drive), no hay forma de ver su estado final ni previsualizarlo. Solo aparece un enlace "Ver en Drive" que apunta a una URL ficticia.
2. **Modo consolidado saturado**: El checklist y el boton de carga estan visualmente apretados, sin separacion clara entre la lista de documentos y la zona de carga del PDF.
3. **Simulacion de carga opaca**: No se refleja visualmente el resultado de la carga (nombre del archivo, tamano, fecha). El usuario no sabe que paso despues de cargar.
4. **Sin limite de tamano de archivo**: No hay validacion de tamano maximo.

---

### Cambios propuestos

**Archivos a modificar:**

- `src/components/matriculas/DocumentosCarga.tsx` (principal)
- `src/types/matricula.ts` (agregar campos al tipo)

---

### 1. Ampliar el tipo `DocumentoRequerido`

Agregar campos opcionales para almacenar metadata del archivo cargado:

- `archivoNombre?: string` - Nombre original del archivo
- `archivoTamano?: number` - Tamano en bytes

Esto permite mostrar informacion del archivo tras la carga simulada.

---

### 2. Validacion de tamano maximo (10 MB)

Antes de llamar a `onUpload` o `onUploadConsolidado`, validar que el archivo no exceda 5 MB. Mostrar un toast o mensaje inline si se excede.

Constante: `const MAX_FILE_SIZE = 10 * 1024 * 1024` (10 MB).

---

### 3. Modo Individual - Estado post-carga visible

Para documentos con estado `cargado` o `verificado`:

- Mostrar una linea con el nombre del archivo y tamano (ej: "cedula_juan.pdf - 1.2 MB").
- Mantener el enlace "Ver en Drive".
- Agregar un boton pequeno "Ver" que abre la vista previa si el archivo fue cargado en la sesion actual (usando el blob URL almacenado en estado local).
- Permitir "Reemplazar" el archivo (mostrar boton en lugar de "Cargar").

---

### 4. Modo Consolidado - Separacion visual

- Dividir el contenido en dos bloques visuales claros dentro del borde:
  - **Bloque 1**: Checklist de documentos con su titulo "Documentos incluidos en el PDF".
  - **Separador visual**: Una linea `<Separator />` o espacio con borde superior.
  - **Bloque 2**: Zona de carga del PDF consolidado, con su propio borde/fondo sutil (`bg-muted/30 rounded-lg p-3`), conteniendo el input de carga y la vista previa.

---

### 5. Vista previa mejorada

Mantener la vista previa existente pero mejorarla:

- Almacenar en estado local un mapa de `documentoId -> { url, name, type }` para permitir ver previews de documentos individuales ya cargados en la sesion.
- En modo consolidado, la vista previa del PDF se muestra en el Bloque 2.
- Agregar indicador de tamano del archivo en la barra de preview.

---

### 6. Feedback de carga simulada

Agregar un estado transitorio `uploading` por documento:

- Mientras se sube (durante el `delay` del mock service), mostrar un spinner o indicador de progreso junto al documento.
- Al completarse, actualizar la fila mostrando nombre, tamano y estado "Cargado" con animacion sutil de transicion.

---

### 7. Pasar metadata del archivo al servicio

Modificar `useUploadDocumento` en `src/hooks/useMatriculas.ts` para incluir `archivoNombre` y `archivoTamano` en la llamada a `updateDocumento`, de modo que queden persistidos en el mock.

---

### Detalle tecnico

`**src/types/matricula.ts**`:

- Agregar `archivoNombre?: string` y `archivoTamano?: number` a la interfaz `DocumentoRequerido`.

`**src/components/matriculas/DocumentosCarga.tsx**`:

- Agregar constante `MAX_FILE_SIZE = 5 * 1024 * 1024`.
- Funcion helper `formatFileSize(bytes: number)` para mostrar tamano legible.
- Validacion de tamano en `handleFileChange` y `handleConsolidadoUpload`.
- Estado local `uploadingDocId` para mostrar spinner en el documento que se esta subiendo.
- Estado local `previews: Record<string, {url, name, type}>` para mapear previews por documento.
- En modo individual: mostrar info del archivo cargado (nombre + tamano) y boton "Ver" para documentos no pendientes.
- En modo consolidado: separar visualmente checklist y zona de carga con `Separator` y fondo diferenciado.
- Vista previa con indicador de tamano.

`**src/hooks/useMatriculas.ts**`:

- En `useUploadDocumento`, agregar `archivoNombre: file.name` y `archivoTamano: file.size` al payload de `updateDocumento`.