

## PARTE 3 — Inspector Profesional (Edicion Centralizada)

### Objetivo

Mover la edicion de propiedades de cada bloque al panel derecho. Cuando un bloque esta seleccionado, el panel derecho cambia de "Paleta de bloques" a "Inspector de propiedades". Cuando no hay seleccion, muestra la paleta.

---

### Situacion actual

- El panel derecho (`aside`, lineas 670-690) solo muestra la paleta de bloques disponibles.
- Los bloques en el canvas son tarjetas compactas sin edicion inline (Parte 2 completada).
- Existe `selectedBloqueId` y `updateBloque(index, bloque)` listos para usar.
- No hay forma de editar label, required, ni propiedades especificas de un bloque.

---

### Cambios detallados

#### 1. Crear componente `BloqueInspector`

**Archivo:** `src/components/formatos/BloqueInspector.tsx` (nuevo)

Componente que recibe el bloque seleccionado y un callback `onChange`. Renderiza las propiedades editables segun el tipo de bloque.

**Props:**

```typescript
interface BloqueInspectorProps {
  bloque: Bloque;
  onChange: (updated: Bloque) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}
```

**Estructura del inspector:**

Encabezado:
- Icono + nombre del tipo de bloque (usando `BLOQUE_TYPE_LABELS` y los iconos de `BLOCK_PALETTE`).
- Botones: Duplicar (Copy) y Eliminar (Trash2, destructive outline).

Seccion "Propiedades generales" (comunes a todos los bloques):
- **Label**: Input (altura 40px). Placeholder "Etiqueta del campo".
- **Obligatorio**: Switch/toggle con label "Campo obligatorio".

Seccion "Propiedades especificas" (varian segun `bloque.type`):

| Tipo | Propiedades |
|---|---|
| `heading` | Select de nivel (H1, H2, H3) |
| `paragraph` | Textarea amplia para `props.text` (min-h-[120px]) |
| `text` | Input de placeholder, Switch "Multilinea" |
| `number` | Input min, Input max |
| `radio` | Lista editable de opciones: cada una con Input label + Input value + boton eliminar. Boton "Agregar opcion" al final |
| `select` | Identico a radio (lista de opciones editables) |
| `auto_field` | Select agrupado por categorias (reutilizar el patron de `AUTO_FIELD_CATALOG` y `AUTO_FIELD_CATEGORIES`). Mostrar badge "Auto" y texto "Este campo se llena automaticamente desde el sistema" |
| `signature_aprendiz` | Texto informativo: "Reutiliza la firma capturada en Informacion del Aprendiz. No es editable manualmente." |
| `signature_entrenador_auto` | Texto: "Firma tomada automaticamente desde Gestion de Personal (entrenador del curso)." |
| `signature_supervisor_auto` | Texto: "Firma tomada automaticamente desde Gestion de Personal (supervisor del curso)." |
| `checkbox` | Solo propiedades generales (label + obligatorio) |
| `date` | Solo propiedades generales |
| `section_title` | Solo label |
| Bloques complejos (`health_consent`, `evaluation_quiz`, etc.) | Texto informativo: "Este bloque complejo se configura con su componente especializado." |

Cada cambio invoca `onChange` con el bloque actualizado, lo que dispara `updateBloque` + `markDirty` en el padre.

#### 2. Lista editable de opciones (sub-componente)

Dentro de `BloqueInspector`, para bloques `radio` y `select`:

- Cada opcion se muestra como una fila con dos inputs: "Etiqueta" y "Valor".
- Boton de eliminar opcion (icono X) a la derecha.
- Boton "Agregar opcion" al final con icono Plus.
- Al agregar, crear con value `opcion_N` y label `Opcion N` (autoincremental).
- Minimo 1 opcion (no se puede eliminar la ultima).

#### 3. Alternar panel derecho entre Paleta e Inspector

**Archivo:** `src/pages/formatos/FormatoEditorPage.tsx`

El `aside` (lineas 670-690) cambia su contenido segun `selectedBloqueId`:

- Si `selectedBloqueId === null`: mostrar la paleta de bloques (contenido actual).
- Si `selectedBloqueId !== null`: mostrar `<BloqueInspector>` con el bloque correspondiente.

Logica:

```typescript
const selectedBloque = selectedBloqueId 
  ? bloques.find(b => b.id === selectedBloqueId) 
  : null;
const selectedIndex = selectedBloqueId 
  ? bloques.findIndex(b => b.id === selectedBloqueId) 
  : -1;
```

En el aside:

```
{selectedBloque ? (
  <BloqueInspector
    bloque={selectedBloque}
    onChange={(updated) => updateBloque(selectedIndex, updated)}
    onDelete={() => { deleteBloque(selectedIndex); setSelectedBloqueId(null); }}
    onDuplicate={() => duplicateBloque(selectedIndex)}
  />
) : (
  <Card>... paleta actual ...</Card>
)}
```

#### 4. Boton "Volver a la paleta" en el inspector

En la parte superior del inspector, agregar un boton discreto para deseleccionar y volver a la paleta:

```
<Button variant="ghost" size="sm" onClick={() => setSelectedBloqueId(null)}>
  ← Paleta
</Button>
```

#### 5. Exportar constantes necesarias

Mover `BLOQUE_TYPE_LABELS`, `BLOCK_PALETTE` y `COMPLEX_TYPES` a un archivo compartido o exportarlos desde `FormatoEditorPage.tsx` para que `BloqueInspector` pueda usarlos. Opcion recomendada: crear `src/data/bloqueConstants.ts` con estas constantes.

---

### Resumen de archivos

| Archivo | Cambio |
|---|---|
| `src/data/bloqueConstants.ts` | Nuevo: exportar `BLOQUE_TYPE_LABELS`, `BLOCK_PALETTE`, `COMPLEX_TYPES` |
| `src/components/formatos/BloqueInspector.tsx` | Nuevo: componente inspector con propiedades editables por tipo |
| `src/pages/formatos/FormatoEditorPage.tsx` | Importar constantes desde `bloqueConstants.ts`, alternar aside entre paleta e inspector segun seleccion, pasar props al inspector |

### Lo que NO cambia

- Layout de header sticky y canvas (Parte 1)
- Tarjetas compactas de bloques (Parte 2)
- Preview dialog
- Logica de guardado y dirty state
- Paleta de bloques (solo se oculta cuando hay seleccion)

