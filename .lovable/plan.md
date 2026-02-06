

# Plan: Corregir Interacción Tabla-Panel Deslizante

## Resumen

El problema actual es que el overlay del Sheet captura los clics antes de que lleguen a las filas de la tabla, causando que el panel se cierre en lugar de actualizar su contenido. Se necesita una estrategia para diferenciar los clics en la tabla de los clics fuera de ella.

---

## Problema Identificado

```text
Estado actual:
+----------------------------+----------------+
|                            |                |
|   TABLA (debajo del        |   PANEL        |
|   overlay transparente)    |   ABIERTO      |
|                            |                |
+----------------------------+----------------+
         ↑
   Clic en fila
         ↓
   1. Overlay captura el clic primero
   2. Sheet se cierra
   3. El evento nunca llega a la fila
```

---

## Solucion Propuesta

Usar `preventCloseOnOutsideClick` en el Sheet y manejar el cierre manualmente detectando clics fuera de la tabla.

### Estrategia:

1. **Prevenir cierre automatico**: Activar `preventCloseOnOutsideClick` en el Sheet
2. **Detectar clics fuera de la tabla**: Agregar un listener global que cierre el panel si el clic no fue en la tabla ni en el panel
3. **Separar logica de seleccion**: El clic en fila solo actualiza el panel, NO selecciona. Solo el checkbox selecciona.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/DetailSheet.tsx` | Activar `preventCloseOnOutsideClick`, agregar ref y listener para detectar clics fuera |
| `src/components/shared/DataTable.tsx` | Agregar `data-table-container` para identificar la tabla, separar logica de clic |
| `src/pages/personas/PersonasPage.tsx` | Modificar `handleRowClick` para NO seleccionar automaticamente |
| `src/pages/matriculas/MatriculasPage.tsx` | Mismos cambios |
| `src/pages/cursos/CursosPage.tsx` | Mismos cambios |

---

## Detalle de Implementacion

### 1. DataTable - Identificar el Contenedor

Agregar un `data-attribute` para identificar la tabla:

```typescript
// DataTable.tsx
return (
  <div className="space-y-2" data-table-container>
    <div className="rounded-lg border overflow-hidden">
      ...
    </div>
  </div>
);
```

### 2. DataTable - Separar Logica de Seleccion

El clic en la fila YA NO selecciona automaticamente. Solo actualiza el panel:

```typescript
// DataTable.tsx - el onRowClick solo cambia el panel
<TableRow
  onClick={() => onRowClick?.(item)}  // Solo abre/cambia panel
>
  {/* Checkbox - este SI selecciona */}
  <Checkbox onClick={(e) => handleToggleRow(item.id, e)} />
</TableRow>
```

### 3. PersonasPage - Modificar handleRowClick

```typescript
// PersonasPage.tsx
const handleRowClick = (persona: Persona) => {
  const index = filteredPersonas.findIndex((p) => p.id === persona.id);
  // SOLO abrir/actualizar el panel, NO seleccionar
  setSelectedIndex(index);
};

// handleViewRow sigue igual - cambia seleccion a solo ese registro
const handleViewRow = (persona: Persona) => {
  const index = filteredPersonas.findIndex((p) => p.id === persona.id);
  setSelectedIds([persona.id]);
  setSelectedIndex(index);
};
```

### 4. DetailSheet - Prevenir Cierre y Manejar Clics Externos

```typescript
// DetailSheet.tsx
import { useEffect, useRef } from "react";

export function DetailSheet({
  open,
  onOpenChange,
  // ... rest
}: DetailSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Verificar si el clic fue en la tabla
      const isInTable = target.closest('[data-table-container]');
      
      // Verificar si el clic fue en el panel
      const isInSheet = sheetRef.current?.contains(target);
      
      // Si no fue ni en tabla ni en panel, cerrar
      if (!isInTable && !isInSheet) {
        onOpenChange(false);
      }
    };

    // Usar capture para interceptar antes del bubble
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [open, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={sheetRef}
        side="right"
        hideCloseButton
        transparentOverlay
        preventCloseOnOutsideClick  // <-- Agregar esto
        className="flex flex-col p-0"
      >
        {/* ... contenido ... */}
      </SheetContent>
    </Sheet>
  );
}
```

---

## Flujo de Interaccion Corregido

```text
1. Usuario abre panel haciendo clic en una fila
   → Panel se abre mostrando detalles
   → Registro NO se selecciona automaticamente

2. Usuario hace clic en OTRA fila (con panel abierto)
   → El clic llega a la fila (porque preventCloseOnOutsideClick)
   → Panel actualiza mostrando nuevo registro
   → Ningun registro se selecciona

3. Usuario hace clic FUERA de la tabla (sidebar, header, etc)
   → El listener detecta que no es tabla ni panel
   → Panel se cierra

4. Usuario hace clic en CHECKBOX de una fila
   → Registro se selecciona/deselecciona
   → Panel NO cambia (sigue mostrando el mismo registro)
```

---

## Diagrama de Eventos

```text
Clic en pantalla
      │
      ▼
┌─────────────────────────────┐
│ mousedown listener (capture)│
└─────────────────────────────┘
      │
      ▼
┌─────────────────────┐     ┌──────────────────┐
│ Es en [data-table]? │─NO─►│ Es en SheetRef?  │
└─────────────────────┘     └──────────────────┘
      │YES                        │NO
      │                           ▼
      ▼                    ┌─────────────┐
┌─────────────────┐        │ CERRAR PANEL│
│ Dejar pasar     │        └─────────────┘
│ (onRowClick     │
│  actualiza panel)│
└─────────────────┘
```

---

## Seccion Tecnica

### Prop Ref en SheetContent

El `SheetContent` de Radix ya soporta `ref` mediante `forwardRef`, pero necesitamos pasarlo correctamente:

```typescript
// sheet.tsx - ya tiene forwardRef
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(...);
```

### Uso del Ref en DetailSheet

```typescript
// DetailSheet.tsx
<SheetContent
  ref={sheetRef as React.RefObject<HTMLDivElement>}
  ...
>
```

### Consideraciones del Event Listener

- Usar `mousedown` en lugar de `click` para capturar antes
- Usar `capture: true` para interceptar durante la fase de captura
- Limpiar el listener cuando el panel se cierra o el componente se desmonta

