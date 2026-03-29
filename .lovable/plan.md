## Plan: Refactorización del Editor de Formatos — Constructor Visual de 3 Paneles

### Objetivo

Reemplazar el editor actual (`FormatoEditorPage.tsx`, 903 líneas monolíticas con motor dual bloques/HTML) por un constructor visual de 3 paneles inspirado en el prototipo proporcionado, unificando ambos motores en uno solo. Los 4 formatos legacy se migran a este nuevo formato editable, conservando todas sus capacidades (health_consent, evaluation_quiz, etc.).

### Arquitectura de 3 Paneles

```text
┌──────────────────────────────────────────────────────────┐
│  Header: breadcrumb · nombre · badges · acciones         │
├──────────┬─────────────────────────────┬─────────────────┤
│ CATÁLOGO │        LIENZO (Canvas)      │   PROPIEDADES   │
│ 220px    │       flex-1                │   300px         │
│          │                             │                 │
│ ─ Layout │  ┌───────────────────────┐  │ Propiedades del │
│   2 col  │  │  Título del documento │  │ bloque selec.   │
│          │  │                       │  │                 │
│ ─ Campos │  │  [Bloque 1]           │  │ · Etiqueta      │
│   Texto  │  │  [Bloque 2]           │  │ · Requerido     │
│   Texto  │  │  [Row 2-col]          │  │ · Props espec.  │
│  largo   │ 
│  Parrafo │  │  [Bloque N]           │  │                 │
│ Dropdown │  │                       │  │ ─────────────── │
│   Select │  └───────────────────────┘  │ Tokens          │
│   Check  │                             │ (click inserta) │
│   Radio  │                             │                 │
│          │                             │ ─────────────── │
│ ─ Espec. │                             │ Encabezado      │
│   Firma  │                             │ institucional   │
│   Salud  │                             │                 │
│   Quiz   │                             │                 │
│   Archivo│                             │                 │
│          │                             │                 │
│ ─ Tokens │                             │                 │
│  (lista) │                             │                 │
└──────────┴─────────────────────────────┴─────────────────┘
```

### Cambio conceptual clave

**Antes**: Dos motores (`bloques` vs `plantilla_html`) con UIs completamente distintas.
**Después**: Un único constructor visual donde cada bloque se renderiza como preview en el lienzo (similar al prototipo), con soporte para filas de 2 columnas. Se elimina el motor dual; todos los formatos usan el mismo sistema de bloques mejorado.

Los tokens (`{{persona.nombreCompleto}}`) se integran como un tipo de bloque especial (`auto_field`) que ya existe, y también pueden insertarse en bloques de texto/párrafo desde el panel de tokens.

### Nuevos tipos de bloque (del prototipo)

Se agregan al catálogo existente:

- `email` — Campo de correo electrónico
- `textarea` — Párrafo editable (diferente del `paragraph` estático)
- `file` — Adjuntar documento (con `accept` configurable)
- `divider` — Separador horizontal
- `row2` — Contenedor de 2 columnas (layout, no campo)

### Estructura de archivos

```text
src/
├── stores/
│   └── useFormatoEditorStore.ts          ← Zustand: estado global del editor
│
├── schemas/
│   └── formatoSchema.ts                  ← Zod: validación del JSON del formato
│
├── pages/formatos/
│   └── FormatoEditorPage.tsx             ← REESCRIBIR: orquestador delgado de 3 paneles
│
├── components/formatos/editor/
│   ├── EditorHeader.tsx                  ← Header con breadcrumb, nombre, acciones
│   ├── BlockCatalog.tsx                  ← Panel izquierdo: bloques + layout + tokens
│   ├── EditorCanvas.tsx                  ← Panel central: lienzo con DnD
│   ├── CanvasBlock.tsx                   ← Bloque individual en el canvas
│   ├── CanvasRow.tsx                     ← Fila de 2 columnas en el canvas
│   ├── CanvasDropZone.tsx                ← Zona vacía de drop
│   ├── BlockPreview.tsx                  ← Renderizado visual de cada tipo de bloque
│   ├── BlockInspector.tsx                ← Panel derecho: props + tokens + encabezado
│   ├── InspectorFields.tsx              ← Campos por tipo de bloque
│   ├── TokenPanel.tsx                   ← Sección de tokens en inspector (reutiliza TokenLibrary)
│   └── FormatoConfigSheet.tsx           ← Sheet/drawer para config general (nombre, código, scope, firmas)
│
├── components/formatos/
│   ├── EncabezadoConfigCard.tsx          ← SIN CAMBIOS
│   ├── TokenLibrary.tsx                  ← SIN CAMBIOS (reutilizado)
│   ├── FormatoPreviewDialog.tsx          ← ACTUALIZAR: ya no hay motor dual
│   ├── FormatoPreviewDocument.tsx        ← ACTUALIZAR: soportar nuevos tipos
│   ├── VersionHistoryDialog.tsx          ← SIN CAMBIOS
│   └── PlantillaBasePicker.tsx           ← ELIMINAR (ya no hay motor HTML separado)
│   └── TemplateEditor.tsx               ← ELIMINAR (TipTap ya no se usa)
│   └── TemplatePreviewDialog.tsx         ← ELIMINAR
│   └── BloqueInspector.tsx              ← SE ABSORBE en BlockInspector.tsx
```

### Detalle de componentes principales

#### 1. `useFormatoEditorStore.ts` (Zustand)

Estado centralizado que reemplaza los ~25 `useState` del editor actual:

- `items: EditorBlock[]` — lista plana de bloques (incluye `row2` con `cols`)
- `selectedId: string | null`
- `docTitle: string`
- `formatoConfig: { nombre, codigo, version, categoria, scope, tipoCursoKeys, firmas, encabezado, etc. }`
- `isDirty: boolean`
- Acciones: `addBlock`, `removeBlock`, `updateBlock`, `reorderBlock`, `insertIntoCol`, `removeFromCol`, `setSelected`, `setConfig`, `loadFormato`, `reset`

#### 2. `formatoSchema.ts` (Zod)

Validación del JSON completo del formato antes de guardar:

- Valida que bloques tengan `id`, `type`, `label`
- Valida props específicas por tipo (radio debe tener opciones, auto_field debe tener key)
- Valida que `row2` tenga exactamente 2 cols
- Valida config general (nombre requerido, código formato válido)

#### 3. `BlockCatalog.tsx` (Panel Izquierdo)

- Sección "Layout": botón de 2 columnas (draggable)
- Sección "Campos": todos los tipos de bloque en grid 2×N (draggable)
- Sección "Especiales": firma, salud, quiz, encuesta, archivo
- Sección "Tokens": lista clickeable que inserta en bloque seleccionado
- Usa `@dnd-kit` draggable (no HTML5 nativo como el prototipo)

#### 4. `EditorCanvas.tsx` (Panel Central)

- Título del documento editable inline
- `SortableContext` de @dnd-kit con `verticalListSortingStrategy`
- Drop zones entre bloques (línea indicadora azul)
- Renderiza `CanvasBlock` o `CanvasRow` según tipo
- Click en bloque → selección → inspector muestra props

#### 5. `CanvasBlock.tsx` / `BlockPreview.tsx`

- Wrapper sortable con grip handle, botón eliminar on hover
- `BlockPreview` renderiza la preview visual de cada tipo (inputs deshabilitados, texto estático, firma placeholder, etc.) — tomado directamente del `FieldPreview` del prototipo pero con Shadcn UI styling

#### 6. `CanvasRow.tsx`

- Layout de 2 columnas con drop zones independientes
- Cada columna acepta un bloque del catálogo
- Badge "2 col" en esquina superior

#### 7. `BlockInspector.tsx` (Panel Derecho)

Contextual según selección:

- **Sin selección**: Muestra `EncabezadoConfigCard` + resumen de config
- **Bloque seleccionado**: Tipo, etiqueta, requerido, props específicas (absorbe lógica de `BloqueInspector.tsx` actual + props nuevas del prototipo como `placeholder`, `accept`)
- Sección de tokens siempre visible abajo (para insertar en bloque seleccionado)
- Botón "Configuración general" abre `FormatoConfigSheet`

#### 8. `FormatoConfigSheet.tsx`

Sheet lateral que agrupa toda la configuración que antes ocupaba un Card en el canvas:

- Nombre, descripción, código, versión, categoría
- Alcance de asignación (tipo_curso / nivel_formacion)
- Visibilidad (matrícula / curso)
- Firmas requeridas
- Estado (activo / borrador)

Esto libera el canvas para ser 100% zona de construcción visual.

### Migración de formatos legacy

Los 4 formatos legacy (`motorRender: 'bloques'`) ya usan la estructura `Bloque[]` que se mantiene. La migración consiste en:

1. **Agregar nuevos tipos al catálogo**: `email`, `textarea`, `file`, `divider`, `row2`
2. **Actualizar `TipoBloque**` en types para incluir nuevos tipos
3. **Actualizar `bloqueConstants.ts**` con los nuevos tipos e íconos
4. **Eliminar `legacyComponentId**` — ya no se necesita discriminar motor; todos los formatos son editables con el constructor
5. **Eliminar `motorRender**` y `htmlTemplate`/`cssTemplate` del tipo — un solo motor
6. **Actualizar `FormatoPreviewDocument**` para renderizar los nuevos tipos (email, textarea, file, divider, row2)

Los bloques complejos existentes (`health_consent`, `evaluation_quiz`, `satisfaction_survey`, `data_authorization`) se mantienen como están — su inspector muestra "componente especializado" y su preview muestra el badge.

### Dependencias nuevas

- `zustand` — ya mencionada como permitida
- `@dnd-kit/core`, `@dnd-kit/sortable` — ya instalados en el proyecto

### Dependencias a eliminar

- `@tiptap/react`, `@tiptap/starter-kit`, extensiones TipTap — ya no se necesitan

### Resumen de archivos


| Archivo                                                 | Acción                                                 |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `src/stores/useFormatoEditorStore.ts`                   | CREAR                                                  |
| `src/schemas/formatoSchema.ts`                          | CREAR                                                  |
| `src/components/formatos/editor/EditorHeader.tsx`       | CREAR                                                  |
| `src/components/formatos/editor/BlockCatalog.tsx`       | CREAR                                                  |
| `src/components/formatos/editor/EditorCanvas.tsx`       | CREAR                                                  |
| `src/components/formatos/editor/CanvasBlock.tsx`        | CREAR                                                  |
| `src/components/formatos/editor/CanvasRow.tsx`          | CREAR                                                  |
| `src/components/formatos/editor/CanvasDropZone.tsx`     | CREAR                                                  |
| `src/components/formatos/editor/BlockPreview.tsx`       | CREAR                                                  |
| `src/components/formatos/editor/BlockInspector.tsx`     | CREAR                                                  |
| `src/components/formatos/editor/InspectorFields.tsx`    | CREAR                                                  |
| `src/components/formatos/editor/TokenPanel.tsx`         | CREAR                                                  |
| `src/components/formatos/editor/FormatoConfigSheet.tsx` | CREAR                                                  |
| `src/pages/formatos/FormatoEditorPage.tsx`              | REESCRIBIR (903→~120 líneas)                           |
| `src/types/formatoFormacion.ts`                         | ACTUALIZAR (nuevos tipos, eliminar motorRender)        |
| `src/data/bloqueConstants.ts`                           | ACTUALIZAR (nuevos tipos + íconos)                     |
| `src/components/formatos/FormatoPreviewDocument.tsx`    | ACTUALIZAR (nuevos tipos)                              |
| `src/components/formatos/FormatoPreviewDialog.tsx`      | SIMPLIFICAR (eliminar delegación por motor)            |
| `src/services/formatoFormacionService.ts`               | ACTUALIZAR (eliminar refs a motorRender, migrar mocks) |
| `src/hooks/useFormatosFormacion.ts`                     | LIMPIAR                                                |
| `src/components/formatos/TemplateEditor.tsx`            | ELIMINAR                                               |
| `src/components/formatos/TemplatePreviewDialog.tsx`     | ELIMINAR                                               |
| `src/components/formatos/PlantillaBasePicker.tsx`       | ELIMINAR                                               |
| `src/components/formatos/BloqueInspector.tsx`           | ELIMINAR (absorbido)                                   |


### Lo que NO cambia

- `TokenLibrary.tsx` — se reutiliza en el panel derecho
- `EncabezadoConfigCard.tsx` — se reutiliza en el inspector
- `VersionHistoryDialog.tsx` — se mantiene
- `tokenSources.ts` — se mantiene como fuente de tokens
- `autoFieldCatalog.ts` — se mantiene
- `resolveAutoField.ts` — se mantiene
- `DynamicFormatoDocument.tsx` y componentes de matrículas — se mantienen
- Los 4 componentes legacy de renderizado en matrículas — se mantienen (renderizado en portal estudiante)

### Orden de implementación sugerido

1. Crear store Zustand + schema Zod
2. Actualizar tipos y constantes (nuevos bloques)
3. Crear componentes del editor (catálogo → canvas → inspector)
4. Reescribir `FormatoEditorPage.tsx` como orquestador
5. Actualizar preview y service
6. Eliminar archivos obsoletos
7. Limpiar dependencias TipTap