
## Cambios en el modulo Niveles de Formacion

### Resumen

1. Eliminar los campos `consecutivo` y `tipoCertificacion` de toda la UI y del modelo de datos.
2. Agregar la funcionalidad de documentos personalizados con un boton "+ Anadir documento" y un modal.
3. Permitir agregar campos adicionales en la seccion "Informacion general" del formulario.

---

### 1. Eliminar campos `consecutivo` y `tipoCertificacion`

**Archivos afectados:**

- **`src/types/nivelFormacion.ts`**: Eliminar `tipoCertificacion` y `consecutivo` de la interfaz `NivelFormacion` y de `NivelFormacionFormData`.
- **`src/data/mockData.ts`**: Eliminar las propiedades `consecutivo` y `tipoCertificacion` de los 4 niveles precargados.
- **`src/services/nivelFormacionService.ts`**: Eliminar la validacion de consecutivo unico en `create()` y `update()`. Eliminar busqueda por consecutivo en `search()`.
- **`src/pages/niveles/NivelesPage.tsx`**:
  - Eliminar columna `tipoCertificacion` de `DEFAULT_COLUMNS` y de `columns`.
  - Eliminar referencia a `consecutivo` en el filtro de busqueda y en el placeholder.
- **`src/pages/niveles/NivelFormPage.tsx`**:
  - Eliminar los campos `consecutivo` y `tipoCertificacion` del schema zod, de `defaultValues`, del `useEffect` de carga, del `onSubmit` payload, y del JSX del formulario.
- **`src/pages/niveles/NivelDetallePage.tsx`**:
  - Eliminar la linea "Consecutivo: ..." del subtitulo.
  - Eliminar las celdas de "Consecutivo" y "Tipo de Certificacion" de la card de informacion general.
- **`src/services/documentoService.ts`**: Eliminar la busqueda por `consecutivo` en el `find()` de `getDocumentosRequeridos()`.

---

### 2. Documentos personalizados (+ Anadir documento)

Actualmente `documentosRequeridos` es un array de `DocumentoReqKey` (union de strings fijos). Para soportar documentos personalizados, se cambiara a `string[]` y se mantendra el catalogo predefinido como referencia visual.

**`src/types/nivelFormacion.ts`**:
- Cambiar `documentosRequeridos: DocumentoReqKey[]` a `documentosRequeridos: string[]` en la interfaz.
- Mantener `CATALOGO_DOCUMENTOS` como catalogo base predefinido.

**`src/pages/niveles/NivelFormPage.tsx`**:
- En la seccion "Requisitos Documentales", despues de la lista del catalogo, mostrar los documentos personalizados que se hayan agregado (con switch activo y boton para eliminar).
- Agregar un boton `+ Anadir documento` que abre un Dialog/modal.
- El modal contendra un campo de texto para ingresar el nombre del documento y un boton "Agregar".
- Al agregar, se anade el nombre (como key tipo slug, ej: `custom_nombre_documento`) al array `documentosRequeridos` y se muestra en la lista con su switch.
- Se usara un estado local `customDocumentos` (array de `{ key: string; label: string }`) para trackear los documentos personalizados agregados en la sesion, que se fusionaran con `CATALOGO_DOCUMENTOS` para renderizar la lista completa.

**`src/pages/niveles/NivelDetallePage.tsx`**:
- La funcion `getDocLabel()` ya hace fallback a mostrar la key si no la encuentra en el catalogo. Se ajustara para mostrar el nombre legible de documentos personalizados (se guardara el label directamente como key en `documentosRequeridos`).

**Enfoque simplificado para keys personalizadas**: Los documentos personalizados se guardaran directamente con su nombre legible como key (ej: `"Certificado de Bomberos"`), ya que no necesitan un key tecnico. El catalogo predefinido sigue usando keys tecnicas (`cedula`, `arl`, etc.).

---

### 3. Campos adicionales en "Informacion general"

Se agregara la posibilidad de anadir campos personalizados de texto en la seccion "Informacion general" del formulario.

**`src/types/nivelFormacion.ts`**:
- Agregar `camposAdicionales?: { nombre: string; valor: string }[]` a la interfaz `NivelFormacion`.

**`src/pages/niveles/NivelFormPage.tsx`**:
- Agregar al schema zod: `camposAdicionales: z.array(z.object({ nombre: z.string(), valor: z.string() })).optional()`.
- Debajo de los campos de duracion, mostrar los campos adicionales existentes (cada uno con label editable y valor editable, mas un boton para eliminar).
- Boton `+ Anadir campo` que agrega una nueva fila con inputs para nombre y valor.

**`src/pages/niveles/NivelDetallePage.tsx`**:
- En la card de informacion general, renderizar los campos adicionales debajo de la duracion.

---

### Archivos a modificar (resumen)

| Archivo | Cambios |
|---|---|
| `src/types/nivelFormacion.ts` | Eliminar `consecutivo` y `tipoCertificacion`, agregar `camposAdicionales`, cambiar tipo de `documentosRequeridos` a `string[]` |
| `src/data/mockData.ts` | Eliminar `consecutivo` y `tipoCertificacion` de los mock |
| `src/services/nivelFormacionService.ts` | Eliminar validacion de consecutivo |
| `src/services/documentoService.ts` | Eliminar busqueda por consecutivo |
| `src/pages/niveles/NivelesPage.tsx` | Eliminar columna tipoCertificacion, eliminar ref a consecutivo en busqueda |
| `src/pages/niveles/NivelFormPage.tsx` | Eliminar campos, agregar campos adicionales dinamicos, agregar modal de documento personalizado |
| `src/pages/niveles/NivelDetallePage.tsx` | Eliminar campos, mostrar campos adicionales y documentos personalizados |
