

## Plan: Encabezado editable en el canvas (hojaDinamica)

### Problema actual

El encabezado institucional se configura mediante un Card con switches on/off en el inspector (`EncabezadoConfigCard`). No se ve en el canvas, no permite editar textos, cambiar el logo, ni modificar la estructura de celdas. Es un enfoque de configuración indirecta que no da control visual real.

### Solución propuesta

Convertir el encabezado en un **bloque especial `document_header`** que se renderiza directamente en hojaDinamica como primer elemento, con celdas editables inline. Cuando el usuario lo selecciona, el inspector muestra propiedades granulares (logo, textos, celdas, bordes).

### Nuevo tipo de bloque: `document_header`

```text
┌──────────────┬─────────────────────┬─────────────────────┐
│              │  NOMBRE DOCUMENTO   │  EMPRESA            │
│    LOGO      │─────────┬───────────│  SGI                │
│              │ Código  │ Versión   │  Subsistema         │
│              │         │           │  Creación │ Edición │
└──────────────┴─────────┴───────────┴──────────┴──────────┘
```

Cada celda de texto es editable directamente en el canvas (contentEditable o inputs inline). El logo se puede cambiar haciendo clic (file picker). La estructura replica `DocumentHeader.tsx` pero con edición en vivo.

### Cambios por archivo

**1. `src/types/formatoFormacion.ts`**
- Agregar `'document_header'` al tipo `TipoBloque`
- Nueva interfaz `BloqueDocumentHeader`:
  ```
  props: {
    logoUrl?: string;          // URL o data-uri del logo
    empresaNombre: string;
    sistemaGestion: string;
    subsistema: string;
    fechaCreacion: string;
    fechaEdicion: string;
    mostrarCodigo: boolean;
    mostrarVersion: boolean;
    mostrarFechas: boolean;
    borderColor: string;       // ej. '#9ca3af'
  }
  ```
- Agregar `BloqueDocumentHeader` al union type `Bloque`

**2. `src/data/bloqueConstants.ts`**
- Agregar `document_header` a `BLOQUE_TYPE_LABELS`, `BLOQUE_ICONS` (icono `LayoutGrid` o `Table2`) y `BLOCK_PALETTE` (al inicio, sección "Estructura")

**3. `src/stores/useFormatoEditorStore.ts`**
- Agregar defaults para `document_header` en `BLOCK_DEFAULTS` con los valores actuales de `DocumentHeader` (empresa, SGI, subsistema, fechas, logo por defecto)

**4. `src/components/formatos/editor/BlockPreview.tsx`**
- Nuevo componente `DocumentHeaderPreview` que renderiza la tabla de 3 columnas con grid CSS, replicando el layout de `DocumentHeader.tsx` pero con los textos sacados de `block.props`
- Cada celda muestra el texto del prop correspondiente
- El logo muestra la imagen de `logoUrl` o un placeholder
- El bloque se renderiza a ancho completo sin padding extra

**5. `src/components/formatos/editor/InspectorFields.tsx`**
- Nuevo case `'document_header'` con campos editables:
  - Input para `empresaNombre`
  - Input para `sistemaGestion`
  - Input para `subsistema`
  - Inputs para `fechaCreacion` y `fechaEdicion`
  - Botón para subir/cambiar logo (file input que convierte a data-uri)
  - Input de color para `borderColor`
  - Switches para `mostrarCodigo`, `mostrarVersion`, `mostrarFechas`

**6. `src/components/formatos/editor/BlockCatalog.tsx`**
- Asegurarse de que `document_header` aparezca en la sección de bloques disponibles

**7. `src/components/formatos/editor/EditorCanvas.tsx`**
- Cuando `config.usaEncabezadoInstitucional` está activo Y existe un bloque `document_header` en los items, renderizarlo como primer bloque (ya lo hace automáticamente por su posición en el array)
- Sin cambios estructurales necesarios: el bloque se arrastra y se posiciona como cualquier otro

**8. `src/components/formatos/EncabezadoConfigCard.tsx`**
- Simplificar: cambiar los switches individuales por un mensaje que indique "El encabezado se edita directamente en el canvas"
- Mantener el switch principal de habilitar/deshabilitar para retrocompatibilidad
- Agregar botón "Insertar encabezado" que crea un bloque `document_header` al inicio del canvas si no existe

**9. `src/components/formatos/FormatoPreviewDocument.tsx`**
- En la vista previa, cuando encuentre un bloque `document_header`, renderizar el `DocumentHeader` existente alimentado con los props del bloque en lugar del `DocumentHeader` hardcodeado

### Lo que NO cambia
- `DocumentHeader.tsx` — se mantiene como componente de renderizado para PDF/portal
- La estructura de persistencia — el encabezado se guarda como un bloque más en el array `bloques`
- Los formatos existentes que usen `usaEncabezadoInstitucional: true` seguirán funcionando (retrocompatibilidad en preview)

### Resultado esperado
- El encabezado aparece visualmente en hojaDinamica como una tabla editable
- Se pueden modificar textos, logo y visibilidad de celdas desde el inspector
- El usuario tiene control total sobre el contenido del encabezado sin salir del canvas

