## Plan: Fase 5 — Editor SVG Controlado

### Resumen

Crear un editor controlado de plantillas SVG en `/certificacion/plantillas/:id/editar` que permite editar elementos `<text>` (contenido, fuente, color, posición) y togglear visibilidad de `<g>`, insertar placeholders `{{TOKEN}}`, probar con matrícula real, y versionar cada guardado. Crear una plantilla SVG con la metodologia **Service Layer Mocking** como plnatillas cargada para poder probar el módulo desde la UI

---

### Arquitectura

```text
┌─────────────────────────────────────────────────────┐
│  Header sticky (breadcrumb, nombre, guardar, probar)│
├──────────────────────┬──────────────────────────────┤
│                      │  Panel derecho (30%)         │
│  Canvas SVG (70%)    │  ┌─ Elementos editables      │
│  - Render SVG        │  ├─ Propiedades del nodo     │
│  - Click para        │  │  (text/font/color/pos)    │
│    seleccionar       │  ├─ Selector de placeholders  │
│  - Drag para mover   │  │  (categorías + tokens)    │
│    nodos <text>      │  └─ Historial de versiones   │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
```

Sigue el mismo patrón de layout del FormatoEditorPage: sin MainLayout, header sticky, ResizablePanelGroup horizontal.

---

### Archivos nuevos

#### 1. `src/pages/certificacion/PlantillaEditorPage.tsx`

Página principal del editor. Layout: header sticky + ResizablePanelGroup (canvas 70% | panel 30%).

**Estado principal:**

- `svgContent: string` — SVG raw actual
- `editableNodes: SvgEditableNode[]` — lista parseada de nodos editables (`<text>` con id, `<g>` con id)
- `selectedNodeId: string | null`
- `isDirty: boolean`
- `plantilla` cargada via `usePlantilla(id)`

**Lógica de parseo SVG:**

- Al cargar, parsear `svgRaw` con `DOMParser` para extraer nodos `<text>` y `<g>` que tengan `id`.
- Construir lista de `SvgEditableNode` con: id, tipo (`text`|`group`), contenido, atributos (fontSize, fontWeight, fill, x, y, textAnchor), visible.

**Canvas:**

- Renderizar SVG con `dangerouslySetInnerHTML` dentro de un contenedor con fondo gris claro.
- Click en elementos: detectar nodo por id, seleccionar.
- Para `<text>`: drag para reposicionar (actualizar x/y con mouse events nativos, sin dnd-kit — es posicionamiento absoluto sobre SVG).

**Guardar:**

- Serializar el SVG modificado (aplicar cambios de atributos al DOM parseado, luego `XMLSerializer`).
- Llamar `useUpdatePlantilla` con el nuevo `svgRaw` → el servicio ya incrementa versión y guarda historial.

#### 2. `src/components/certificacion/SvgNodeInspector.tsx`

Panel de propiedades del nodo seleccionado.

**Para `<text>`:**

- Input: contenido de texto (permite `{{TOKEN}}`)
- Input: `font-size` (numérico)
- Select: `font-weight` (normal, bold, 600, 700)
- Input color: `fill` (color picker nativo)
- Select: `text-anchor` (start, middle, end)
- Inputs: x, y (posición numérica)

**Para `<g>`:**

- Switch: visibilidad (toggle `display: none`)

Cada cambio actualiza `editableNodes` → marca `isDirty`.

#### 3. `src/components/certificacion/PlaceholderSelector.tsx`

Panel con categorías colapsables (Accordion) que lista tokens disponibles.

**Categorías** (derivadas de `construirDiccionarioTokens`):

- Persona: nombreCompleto, nombres, apellidos, tipoDocumento, numeroDocumento
- Curso: numeroCurso, tipoFormacion, fechaInicio, fechaFin, duracionDias, horasTotales
- Personal: entrenadorNombre, supervisorNombre
- Empresa: empresaNombre, empresaNit, empresaCargo
- Certificado: codigoCertificado, fechaGeneracion

Click en token → inserta `{{token}}` en el contenido del nodo `<text>` seleccionado.

#### 4. `src/components/certificacion/PlantillaTestDialog.tsx`

Dialog para probar la plantilla con datos reales.

- Combobox para seleccionar matrícula (usa `useMatriculas`)
- Al seleccionar: construir diccionario de tokens con `construirDiccionarioTokens`, reemplazar con `reemplazarTokens`
- Mostrar SVG resultante en preview
- Listar tokens no resueltos (los que quedaron como `{{...}}`) con badge de warning
- Validación: si hay tokens obligatorios sin resolver, mostrar alerta

#### 5. `src/components/certificacion/PlantillaVersionHistory.tsx`

Lista colapsable del historial de versiones de la plantilla (`plantilla.historial`).

- Muestra versión, fecha, modificadoPor
- Botón "Restaurar" para rollback → carga svgRaw de esa versión como contenido actual

---

### Archivos modificados

#### 6. `src/types/certificado.ts`

Agregar tipo auxiliar:

```ts
export interface SvgEditableNode {
  id: string;
  type: 'text' | 'group';
  content?: string;
  attrs: Record<string, string>;
  visible: boolean;
}
```

#### 7. `src/App.tsx`

Agregar ruta (sin MainLayout, como FormatoEditorPage):

```
<Route path="/certificacion/plantillas/:id/editar" element={<PlantillaEditorPage />} />
```

#### 8. `src/pages/certificacion/PlantillasPage.tsx`

- Habilitar botón "Nueva Plantilla" (o al menos navegación)
- Agregar acción "Editar" en cada fila de plantilla → navega a `/certificacion/plantillas/:id/editar`

#### 9. `src/data/mockCertificados.ts`

Agregar una plantilla mock con SVG de ejemplo que contenga `<text id="...">` y `<g id="...">` para probar el editor.

#### 10. `src/services/plantillaService.ts`

Agregar método `rollback(id, version)` que restaura svgRaw desde historial y crea nueva entrada en historial.

#### 11. `src/hooks/usePlantillas.ts`

Agregar `useRollbackPlantilla` mutation.

---

### Restricciones de edición (seguridad)

- Solo nodos con `id` son editables (el parseo ignora nodos sin id)
- No se permite crear nuevos elementos SVG
- No se permite editar `<path>`, `<rect>`, `<circle>`, etc.
- El editor no modifica la estructura del SVG, solo atributos de nodos existentes