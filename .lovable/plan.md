

# 5 ajustes al editor de formatos y portal del estudiante

## 1. Bloque de 1 columna en el editor (`/gestion-formatos/nuevo`)

Actualmente solo existe `row2` (2 columnas). Se agregará un bloque `row1` que funciona como contenedor de una sola columna con borde visual, útil para agrupar un bloque en un recuadro diferenciado.

**Archivos:**
- `src/stores/useFormatoEditorStore.ts` — Nuevo tipo `Row1Block` (`{ id, type: 'row1', col: Bloque | null }`), función `createRow1()`, acción `addRow1()`.
- `src/components/formatos/editor/BlockCatalog.tsx` — Agregar entrada `{ type: 'row1', label: '1 columna', icon: Square, category: 'layout' }` en la paleta.
- `src/components/formatos/editor/CanvasRow.tsx` — Agregar caso para renderizar `row1` (una sola celda drop).
- `src/components/formatos/editor/EditorCanvas.tsx` — Manejar `row1` al hacer drop y al renderizar items.
- `src/components/formatos/FormatoPreviewDocument.tsx` — Caso `row1` en `renderBloque`.
- `src/components/portal/PortalFormatoRenderer.tsx` — Caso `row1` en `renderPortalBlock` y `classifyBlock`.
- `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` — Caso `row1`.

## 2. Firma sin carga de imagen en el portal

Eliminar las pestañas (Tabs) y la opción "Cargar imagen" del componente `PortalSignatureCapture.tsx`. Solo queda el canvas de dibujo con botones "Limpiar" y "Guardar Firma".

**Archivo:** `src/components/portal/PortalSignatureCapture.tsx` — Eliminar imports de `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `FileDropZone`, `ImageIcon`. Renderizar directamente el canvas sin tabs.

## 3. Íconos de secciones colapsables → check verde para datos prellenados

Reemplazar el ícono informativo (ℹ️) de las secciones `info` por un check verde (`CheckCircle2 text-green-600`), transmitiendo progreso cuando los datos ya están prellenados. Secciones de tipo `info` pasan de `status="info"` a `status="complete"` ya que siempre tienen datos resueltos.

**Archivos:**
- `src/components/portal/PortalFormatoRenderer.tsx` — En `getSectionStatus`, cambiar: si `kind === "info"` retornar `"complete"` en vez de `"info"`.
- `src/components/portal/PortalSectionCard.tsx` — Actualmente `status === "info"` no muestra ícono. No se necesita cambio aquí porque ahora será `"complete"` y ya muestra el check verde.

## 4. Colores del design system en el portal

Las secciones colapsables usan colores hardcodeados (`border-green-200`, `border-amber-200`, `text-green-600`, `text-amber-500`). Se migrarán a los tokens CSS del design system:
- Verde → `hsl(var(--success))` / `border-success/30`
- Ámbar → `hsl(var(--warning))` / `border-warning/30`

**Archivo:** `src/components/portal/PortalSectionCard.tsx` — Reemplazar:
- `border-green-200` → `border-[hsl(var(--success)/0.3)]`
- `border-amber-200` → `border-[hsl(var(--warning)/0.3)]`
- `text-green-600` en `CheckCircle2` → `text-[hsl(var(--success))]`
- `text-amber-500` en `AlertCircle` → `text-[hsl(var(--warning))]`

## 5. Bloque asistencia sin columnas de hora

El bloque `attendance_by_day` actualmente muestra 4 columnas: Fecha, Hora entrada, Hora salida, Firma. Se eliminarán las columnas de hora, dejando solo Fecha y Firma.

**Archivos:**
- `src/components/formatos/FormatoPreviewDocument.tsx` — Eliminar `<th>` y `<td>` de "Hora entrada" y "Hora salida" en el caso `attendance_by_day`.
- `src/components/formatos/editor/BlockPreview.tsx` — Si hay preview de la tabla, actualizar igualmente (actualmente solo muestra un badge, no requiere cambio).
- Datos mock `ATTENDANCE_DAYS` — Verificar si `entrada`/`salida` se usan en otro lugar; si no, se pueden dejar pero ignorarlos en la UI.

## Resumen de archivos afectados

| Archivo | Cambios |
|---|---|
| `useFormatoEditorStore.ts` | `Row1Block`, `addRow1` |
| `BlockCatalog.tsx` | Entrada row1 en paleta |
| `CanvasRow.tsx` | Render row1 |
| `EditorCanvas.tsx` | Drop y render row1 |
| `FormatoPreviewDocument.tsx` | row1 + asistencia sin horas |
| `DynamicFormatoDocument.tsx` | row1 |
| `PortalFormatoRenderer.tsx` | row1 + info→complete |
| `PortalSignatureCapture.tsx` | Eliminar tabs/carga imagen |
| `PortalSectionCard.tsx` | Tokens design system |

