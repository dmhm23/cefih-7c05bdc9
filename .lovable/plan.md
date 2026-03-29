

## Plan: Mejorar dimensiones del editor de formatos

### Problemas identificados

1. **Canvas demasiado estrecho**: `max-w-2xl` (672px) hace que el título y los bloques de evaluación se corten
2. **Paneles laterales rígidos**: Catálogo (220px) e Inspector (300px) fijos, sin posibilidad de ajuste
3. **Canvas no crece**: `min-h-[860px]` fijo, no se expande dinámicamente con el contenido

### Solución

Usar **paneles redimensionables** con `react-resizable-panels` (ya instalado en el proyecto como `src/components/ui/resizable.tsx`) para que el usuario ajuste el ancho de cada panel. Ampliar el canvas y eliminar la altura fija.

### Cambios

#### 1. `FormatoEditorPage.tsx` — Layout con ResizablePanelGroup

Reemplazar el `div.flex` que contiene los 3 paneles por un `ResizablePanelGroup` horizontal con 3 `ResizablePanel` y 2 `ResizableHandle`:

- Panel izquierdo (Catálogo): `defaultSize={15}`, `minSize={12}`, `maxSize={22}`
- Panel central (Canvas): `defaultSize={55}`, `minSize={40}`
- Panel derecho (Inspector): `defaultSize={30}`, `minSize={20}`, `maxSize={40}`

Los handles tendrán `withHandle` para el grip visual.

#### 2. `EditorCanvas.tsx` — Canvas más amplio y dinámico

- Cambiar `max-w-2xl` → `max-w-4xl` para aprovechar el espacio disponible
- Cambiar `min-h-[860px]` → `min-h-[600px]` como mínimo base, pero dejar que el contenido determine la altura real (el `div` ya crece naturalmente con los bloques, solo necesita un mínimo menor)
- Reducir padding lateral de `px-12` → `px-8` para ganar espacio de contenido

#### 3. `BlockCatalog.tsx` — Quitar ancho fijo

- Cambiar `w-[220px] shrink-0` → `w-full min-w-0` (el ancho lo controla el ResizablePanel)

#### 4. `BlockInspector.tsx` — Quitar ancho fijo

- Cambiar `w-[300px] shrink-0` → `w-full min-w-0` (el ancho lo controla el ResizablePanel)

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/pages/formatos/FormatoEditorPage.tsx` | ResizablePanelGroup con 3 paneles |
| `src/components/formatos/editor/EditorCanvas.tsx` | `max-w-4xl`, `min-h-[600px]`, `px-8` |
| `src/components/formatos/editor/BlockCatalog.tsx` | Quitar `w-[220px]` fijo |
| `src/components/formatos/editor/BlockInspector.tsx` | Quitar `w-[300px]` fijo |

