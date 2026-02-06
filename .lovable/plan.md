
# Plan: Mejoras al DataTable y Panel Deslizante

## Resumen

Se implementaran 5 mejoras especificas: checkbox sutil con icono cuadrado, seleccion + apertura del panel al clic, columna documento con copia al hover, cierre automatico del panel al clic fuera de registros, y barra de acciones masivas sin desplazar la tabla.

---

## Cambios Detallados

### 1. Checkbox Sutil con Icono CiSquareCheck

**Archivo**: `src/components/ui/checkbox.tsx`

Se creara un icono de check cuadrado similar a `CiSquareCheck` (react-icons) pero usando Lucide para mantener consistencia. El checkbox tendra un estilo mas sutil:

| Antes | Despues |
|-------|---------|
| Borde `border-primary` (azul fuerte) | Borde `border-muted-foreground/30` (gris sutil) |
| Check con `Check` icon | Check con `Square` + check interno |
| Fondo azul al seleccionar | Fondo mas sutil |

```typescript
// Estilo actualizado
"border border-muted-foreground/40 data-[state=checked]:bg-muted data-[state=checked]:text-foreground"
```

Se usara el icono `CheckSquare` de Lucide que es visualmente similar a `CiSquareCheck`.

---

### 2. Clic en Fila = Seleccionar + Abrir Panel

**Archivo**: `src/components/shared/DataTable.tsx` y `src/pages/personas/PersonasPage.tsx`

Actualmente el clic en fila solo abre el panel. Se modificara para que:

1. Seleccione el registro (agregue a `selectedIds`)
2. Abra el panel deslizante

```typescript
// DataTable - nuevo callback
onRowClick?: (item: T, index: number) => void;

// PersonasPage - logica combinada
const handleRowClick = (persona: Persona, index: number) => {
  // Agregar a seleccion si no esta
  if (!selectedIds.includes(persona.id)) {
    setSelectedIds(prev => [...prev, persona.id]);
  }
  // Abrir panel
  setSelectedIndex(index);
};
```

---

### 3. Columna Documento con Copia al Hover

**Archivo**: `src/pages/personas/PersonasPage.tsx`

Se creara un componente `CopyableCell` que muestre un icono de copiar al hacer hover:

```text
Estado normal:
| 1234567890 |

Estado hover:
| 1234567890 [📋] |  <- icono aparece
```

```typescript
// Nuevo componente inline o en shared
function CopyableCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group/copy flex items-center gap-2">
      <span>{value}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover/copy:opacity-100"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </Button>
    </div>
  );
}
```

---

### 4. Panel: Cerrar al Clic Fuera de Registros

**Archivos**: `src/components/ui/sheet.tsx`, `src/components/shared/DetailSheet.tsx`, `src/pages/personas/PersonasPage.tsx`

El comportamiento deseado es:
- Clic en otra fila de la tabla = cambiar registro (panel sigue abierto)
- Clic en cualquier otra parte = cerrar panel

Para lograr esto:

1. El Sheet dejara de prevenir el cierre por defecto
2. Los clics en filas de la tabla se interceptaran para cambiar el registro
3. Se agregara una nueva prop `onOutsideClick` al Sheet

```typescript
// sheet.tsx - modificar SheetContent
interface SheetContentProps {
  // ...existing
  onOutsideClick?: () => void; // Callback cuando se hace clic fuera
  allowOutsideInteraction?: boolean; // Permitir interaccion sin cerrar
}

// PersonasPage - manejar clic en overlay
<Sheet 
  open={selectedIndex !== null}
  onOpenChange={(open) => {
    if (!open) setSelectedIndex(null);
  }}
>
```

La clave es que el overlay sea transparente pero clickeable. Al hacer clic:
- Si es en una fila → el evento del row click cambia el registro
- Si es fuera → el Sheet se cierra naturalmente

---

### 5. Barra de Acciones Masivas Sin Desplazar Tabla

**Propuesta**: Posicionar la barra de acciones de forma **flotante/sticky** en lugar de insertarla encima de la tabla.

**Opcion A - Barra flotante inferior (recomendada)**
```text
+--------------------------------------------------+
| Tabla de datos                                   |
| ...                                              |
| ...                                              |
+--------------------------------------------------+
                    ↓ Aparece flotando
+--------------------------------------------------+
| 3 seleccionados    [Eliminar] [Exportar]         |  <- Fixed bottom
+--------------------------------------------------+
```

**Opcion B - Barra superpuesta en el header**
```text
+--------------------------------------------------+
| 3 seleccionados [X]         [Eliminar] [Exportar]|  <- Reemplaza toolbar
+--------------------------------------------------+
| Tabla de datos                                   |
```

**Opcion C - Barra dentro del header de tabla**
```text
| [x] 3 seleccionados        [Eliminar] [Exportar] |  <- Primera fila
|--------------------------------------------------+
| Documento | Nombre    | Sector      | Telefono   |
```

**Implementacion recomendada (Opcion A)**:
```typescript
// BulkActionsBar con posicion fixed
<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 
                bg-background border shadow-lg rounded-lg px-4 py-2">
  {/* contenido */}
</div>
```

Esto evita cualquier desplazamiento de la tabla y es un patron comun en aplicaciones modernas.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/ui/checkbox.tsx` | Estilo sutil, icono CheckSquare |
| `src/components/shared/DataTable.tsx` | Callback con index, logica de seleccion |
| `src/components/shared/BulkActionsBar.tsx` | Posicion fixed flotante |
| `src/components/ui/sheet.tsx` | Remover preventCloseOnOutsideClick por defecto |
| `src/pages/personas/PersonasPage.tsx` | CopyableCell, logica combinada |
| `src/pages/matriculas/MatriculasPage.tsx` | Mismos ajustes |
| `src/pages/cursos/CursosPage.tsx` | Mismos ajustes |

---

## Componente CopyableCell

Se creara en `src/components/shared/CopyableCell.tsx`:

```typescript
interface CopyableCellProps {
  value: string;
  className?: string;
}

export function CopyableCell({ value, className }: CopyableCellProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={cn("group/copy flex items-center gap-1", className)}>
      <span>{value}</span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 p-1 rounded hover:bg-muted"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
```

---

## Flujo de Interaccion Final

```text
1. Usuario en /personas
2. Hace clic en fila
   → Registro se selecciona (checkbox marcado)
   → Panel se abre mostrando detalles
3. Hace clic en OTRA fila
   → Nuevo registro se selecciona
   → Panel muestra nuevo registro
4. Hace clic FUERA de la tabla
   → Panel se cierra
   → Seleccion se mantiene
5. Selecciona multiples con checkboxes
   → Barra flotante aparece en la parte inferior
   → Tabla NO se desplaza
6. Hover sobre columna Documento
   → Aparece icono de copiar
   → Clic copia al portapapeles
```

---

## Seccion Tecnica

### Modificacion del Checkbox

```typescript
// checkbox.tsx
import { CheckSquare } from "lucide-react";

const Checkbox = React.forwardRef<...>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-muted-foreground/40",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-muted data-[state=checked]:border-muted-foreground/60",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <CheckSquare className="h-3.5 w-3.5 text-foreground" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
```

### BulkActionsBar Flotante

```typescript
// BulkActionsBar.tsx
export function BulkActionsBar({ ... }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 
                    flex items-center gap-4 bg-background border shadow-lg 
                    rounded-full px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex gap-2">
        {actions.map(action => (...))}
      </div>
    </div>
  );
}
```

### Sheet sin Bloqueo pero con Cierre Automatico

```typescript
// DetailSheet.tsx - simplificar comportamiento
<SheetContent
  side="right"
  size={expanded ? "expanded" : "default"}
  hideCloseButton
  transparentOverlay  // Overlay transparente
  // SIN preventCloseOnOutsideClick - permite cerrar al clic fuera
  className="flex flex-col p-0"
>
```

La tabla intercepta los clics en filas antes de que lleguen al overlay, por lo que:
- Clic en fila = cambia registro (no cierra)
- Clic en overlay = cierra panel
