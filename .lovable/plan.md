

## Plan: Simplificar el Editor de Plantillas — Mapeo de Etiquetas SVG a Campos

### Problema

El editor actual (PlantillaEditorPage) es un editor visual SVG completo con drag, inspector de propiedades, colores, fuentes, etc. El usuario solo necesita:

1. **Cargar un SVG**
2. **Detectar automáticamente las etiquetas** (elementos `<text>` con `id`)
3. **Vincular cada etiqueta a un campo de la base de datos** (token del diccionario)
4. **Editar las vinculaciones** para corregir errores

### Enfoque

Reemplazar el editor visual complejo por una vista simple de **mapeo de etiquetas**. No más canvas interactivo, no más drag, no más inspector de propiedades de fuente/color.

---

### Cambios

#### 1. `src/pages/certificacion/PlantillaEditorPage.tsx` — Reescribir

Reemplazar completamente el editor visual por una vista con dos secciones:

**Header**: Breadcrumb + nombre plantilla + botón Guardar

**Cuerpo** (dos columnas con ResizablePanelGroup):
- **Izquierda (60%)**: Preview estático del SVG (solo lectura, `dangerouslySetInnerHTML`)
- **Derecha (40%)**: Tabla de mapeo de etiquetas

**Tabla de mapeo**:
- Parsear el SVG con `DOMParser`, extraer todos los `<text id="...">` 
- Mostrar tabla con columnas: **ID del elemento** | **Contenido actual** | **Campo vinculado** (Select/Combobox)
- El Select muestra los tokens disponibles del catálogo (`PLACEHOLDER_CATEGORIES` de PlaceholderSelector) agrupados por categoría
- Si el contenido ya contiene `{{token}}`, auto-detectar y pre-seleccionar el campo
- Permitir seleccionar "Texto fijo" (no vinculado) o un campo del catálogo
- Input editable para el contenido del texto (para corregir errores o escribir texto fijo)
- Al vincular un campo: el contenido se reemplaza por `{{token}}`

**Lógica de guardado**: Igual que ahora — serializar SVG modificado y llamar `useUpdatePlantilla`.

#### 2. `src/pages/certificacion/PlantillasPage.tsx` — Modificar

- Habilitar el botón "Nueva Plantilla": abrir un dialog/modal para subir un archivo SVG (input type="file" accept=".svg"), asignar nombre, y crear la plantilla
- Al crear, navegar al editor de mapeo

#### 3. Eliminar componentes innecesarios

Los siguientes componentes del editor visual ya no se necesitan y se pueden eliminar:
- `src/components/certificacion/SvgNodeInspector.tsx`
- `src/components/certificacion/PlaceholderSelector.tsx` (la lógica de categorías se integra directo en la tabla de mapeo)

Se conservan:
- `PlantillaTestDialog.tsx` (probar con datos reales sigue siendo útil)
- `PlantillaVersionHistory.tsx` (el versionado sigue siendo necesario)

#### 4. `src/types/certificado.ts` — Agregar tipo de mapeo

```ts
export interface PlantillaTagMapping {
  elementId: string;       // id del <text> en el SVG
  currentContent: string;  // contenido actual del texto
  mappedToken: string | null; // token vinculado o null si es texto fijo
}
```

### Resumen de archivos

| Archivo | Acción |
|---------|--------|
| `PlantillaEditorPage.tsx` | Reescribir (mapeo simple) |
| `PlantillasPage.tsx` | Modificar (botón subir SVG) |
| `SvgNodeInspector.tsx` | Eliminar |
| `PlaceholderSelector.tsx` | Eliminar |
| `certificado.ts` | Agregar `PlantillaTagMapping` |

