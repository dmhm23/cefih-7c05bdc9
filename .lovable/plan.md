

## PARTE 2 — Transformacion de Bloques a Tarjetas Compactas

### Objetivo

Convertir cada bloque del canvas de un editor inline (con inputs, textareas y selects abiertos) a una tarjeta compacta estructural que solo muestra informacion resumida. El canvas deja de ser editable inline y pasa a ser una vista de estructura.

---

### Situacion actual

El componente `BloqueItem` (lineas 115-219) renderiza cada bloque como un editor inline completo:
- Input abierto para el label
- Textarea para parrafos
- Select desplegable para auto_field
- Checkbox de obligatorio
- Botones de accion siempre presentes (move up/down, duplicate, delete)

Esto hace que el canvas se perciba como formulario largo, no como builder.

---

### Cambios detallados

#### 1. Agregar estado de seleccion al editor principal

**Archivo:** `src/pages/formatos/FormatoEditorPage.tsx`

Agregar un state para rastrear el bloque seleccionado:

```typescript
const [selectedBloqueId, setSelectedBloqueId] = useState<string | null>(null);
```

Al hacer click en un bloque, se selecciona. Click fuera o en area vacia del canvas deselecciona.

#### 2. Redisenar BloqueItem como tarjeta compacta

**Archivo:** `src/pages/formatos/FormatoEditorPage.tsx` (componente `BloqueItem`)

Reemplazar completamente el render del BloqueItem. La nueva tarjeta tiene:

**Contenedor:**
- `border rounded-[10px] p-4 cursor-pointer transition-all duration-150`
- Margen vertical 12px entre bloques
- Sin inputs, textareas ni selects visibles

**Estructura interna en una sola fila:**

```
[Drag Handle 16px] [Info central] [Chips + Acciones hover]
```

- **Drag handle**: Icono GripVertical (16px), siempre visible, color gris claro
- **Info central**:
  - Label principal (14px semibold). Si vacio, mostrar placeholder en italica gris ("Sin etiqueta")
  - Subtexto: tipo de bloque (12px gris), usando `BLOQUE_TYPE_LABELS`
  - Para `auto_field`: mostrar tambien el campo seleccionado como subtexto adicional
  - Para `paragraph`: mostrar los primeros 60 caracteres del texto como subtexto
- **Chips** (siempre visibles si aplican):
  - Badge "Auto" (azul claro) si es `auto_field`
  - Badge "Obligatorio" (ambar) si `required === true`
  - Badge "Complejo" (gris) si es bloque complejo
- **Acciones** (visibles solo en hover):
  - Boton Duplicar (icono Copy)
  - Boton Eliminar (icono Trash2, color destructive)

**Se eliminan del bloque:**
- Input de label
- Textarea de parrafo
- Select de auto_field
- Checkbox de obligatorio
- Botones de mover arriba/abajo (el reordenamiento se hara por drag en parte 4; por ahora se mantienen como acciones hover discretas)

#### 3. Estados visuales de la tarjeta

La interfaz de `BloqueItem` cambia para recibir `isSelected` y `onSelect`:

```typescript
interface BloqueItemProps {
  bloque: Bloque;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}
```

Estados CSS:
- **Normal**: `bg-white border-gray-200`
- **Hover**: `bg-[#F3F4F6] border-gray-300`, mostrar acciones, cursor pointer
- **Seleccionado**: `border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20`

Se aplican con clases condicionales basadas en `isSelected` y group-hover.

#### 4. Click en area vacia deselecciona

En el contenedor del canvas (div `max-w-[900px]`), agregar un `onClick` que deselecciona:

```typescript
onClick={(e) => {
  if (e.target === e.currentTarget) setSelectedBloqueId(null);
}}
```

Cada BloqueItem llama `onSelect` con `e.stopPropagation()` para evitar deseleccion.

#### 5. Eliminar la Card wrapper del constructor de bloques

Actualmente los bloques estan dentro de una `<Card>` con titulo "Constructor de Bloques". Para darle mas espacio y sensacion de builder, los bloques se renderizan directamente en el canvas (sin Card wrapper), separados de las Cards de configuracion y firmas por un `<Separator>` o espacio visual.

Se mantiene un titulo discreto "Bloques ({count})" como texto simple, no como Card.

---

### Resumen de cambios

| Archivo | Cambio |
|---|---|
| `src/pages/formatos/FormatoEditorPage.tsx` | Agregar `selectedBloqueId` state, redisenar `BloqueItem` como tarjeta compacta, agregar estados visuales, click-to-select, click-fuera-deselecciona, remover Card wrapper de bloques |

### Lo que NO cambia

- Logica de bloques (crear, editar, duplicar, eliminar, mover) — las funciones siguen existiendo, solo cambia donde se invocan
- Paleta de bloques en panel derecho
- Cards de Configuracion General y Firmas
- Preview dialog
- Header sticky
- Logica de guardado y dirty state

### Nota sobre edicion

Al convertir los bloques a tarjetas compactas, la edicion inline se elimina. En esta parte, las propiedades de los bloques (label, required, props) **no se pueden editar visualmente**. La edicion se restaurara en la Parte 3 (Inspector) que usara el panel derecho para mostrar las propiedades del bloque seleccionado. Los bloques existentes mantienen sus datos — solo cambia la representacion visual.

