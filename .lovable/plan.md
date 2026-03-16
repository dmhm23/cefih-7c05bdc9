

## Plan: Tres correcciones globales

### 1. Label "Tipo" → "Tipo de Vinculación" en vistas de detalle

El formulario de creación ya dice "Tipo de Vinculación", pero las vistas de detalle usan `label="Tipo"`:

- **`src/components/matriculas/MatriculaDetailSheet.tsx`** (línea 436): Cambiar `label="Tipo"` → `label="Tipo de Vinculación"`
- **`src/pages/matriculas/MatriculaDetallePage.tsx`** (línea 470): Cambiar `label="Tipo"` → `label="Tipo de Vinculación"`

Además, las condiciones que muestran campos de empresa deben incluir `'arl'` (actualmente solo chequean `'empresa'` e `'independiente'`):
- **MatriculaDetailSheet.tsx**: líneas ~512, ~532, ~598 — agregar `|| getValue("tipoVinculacion") === 'arl'` donde corresponda (mismos campos que empresa).
- **MatriculaDetallePage.tsx**: líneas ~500, ~519, ~596 — igual.

---

### 2. Reemplazar placeholder "Sin valor" por textos contextuales

**`src/components/shared/EditableField.tsx`**:
- Cambiar el default de `placeholder` de `"Sin valor"` a uno dinámico según `type`:
  - `type === "select"` → `"Seleccionar"`
  - `type === "date"` → `"Sin fecha"`
  - `type === "text"` → `"—"` (guion largo, limpio y neutro)

Implementación: en vez de un solo default en los props, calcular el placeholder efectivo dentro del componente:

```typescript
const effectivePlaceholder = placeholder !== undefined
  ? placeholder  // si se pasó explícitamente, respetar
  : type === "select" ? "Seleccionar"
  : type === "date" ? "Sin fecha"
  : "—";
```

Ajustar la interfaz para que `placeholder` sea `string | undefined` con default `undefined` y usar `effectivePlaceholder` en todos los renders internos.

---

### 3. Scroll vertical contenido dentro de la tabla (estilo infinite scroll)

El objetivo es que al haber muchos registros, el scroll vertical quede **dentro del contenedor de la tabla**, no en toda la ventana. El header de la página (título, buscador, filtros) permanece fijo.

**Enfoque**: Hacer que `DataTable` ocupe el espacio restante del viewport usando `flex-1` y `overflow-y-auto` en el contenedor de la tabla, mientras el wrapper de la tabla ocupa todo el alto disponible.

**Cambios en `src/components/shared/DataTable.tsx`**:
- Cambiar el div raíz de `space-y-2` a `flex flex-col min-h-0 w-full` con prop `className` opcional para que las páginas puedan pasarle `flex-1`.
- El div `rounded-lg border overflow-hidden` pasa a `flex-1 min-h-0 overflow-hidden`.
- El div interno `overflow-x-auto` pasa a `overflow-auto h-full` (scroll en ambos ejes dentro de la tabla).
- El `TableHeader` se hace sticky: agregar `sticky top-0 z-10 bg-background` al `<TableRow>` del header.

**Cambios en las 6 páginas que usan DataTable** (MatriculasPage, PersonasPage, NivelesPage, FormatosPage, GestionPersonalPage, CarteraPage):
- Envolver el contenido de la página en un layout flex vertical que ocupe todo el alto disponible (`flex flex-col h-full`).
- La sección de toolbar/filtros es `shrink-0`.
- El `DataTable` recibe una clase para ser `flex-1 min-h-0`.

Añadir prop `containerClassName` a DataTable para permitir a cada página controlar el layout externo.

**Cambio en `src/components/ui/table.tsx`**:
- El `TableHeader` `<thead>` necesita `sticky top-0 z-10` para que el header quede fijo al hacer scroll dentro de la tabla.
- Ajustar el background del `<tr>` dentro del header para que no sea transparente (ya tiene `bg-muted/40` en DataTable, pero necesita ser opaco para el sticky).

---

### Resumen de archivos a editar

| Archivo | Cambio |
|---|---|
| `EditableField.tsx` | Placeholder dinámico por tipo de campo |
| `MatriculaDetailSheet.tsx` | Label "Tipo de Vinculación" + condiciones ARL |
| `MatriculaDetallePage.tsx` | Label "Tipo de Vinculación" + condiciones ARL |
| `DataTable.tsx` | Layout flex, scroll interno, header sticky, prop containerClassName |
| `table.tsx` | Sticky thead |
| `MatriculasPage.tsx` | Layout flex h-full |
| `PersonasPage.tsx` | Layout flex h-full |
| `NivelesPage.tsx` | Layout flex h-full |
| `FormatosPage.tsx` | Layout flex h-full |
| `GestionPersonalPage.tsx` | Layout flex h-full |
| `CarteraPage.tsx` | Layout flex h-full |

