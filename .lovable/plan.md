

# Plan: Boton "Ver" en Hover y Estilos de Seleccion Mejorados

## Resumen

Se implementaran dos mejoras principales:
1. Un boton "Ver" que aparece al hacer hover sobre las filas cuando el panel esta abierto, permitiendo cambiar a ese registro sin acumular selecciones
2. Estilos de seleccion mas pronunciados con bordes coloreados y checkbox mas visible

---

## Analisis de la Imagen de Referencia

La imagen de Jotform muestra:
- Un boton verde "Ver" con icono que aparece en la fila en hover
- La fila seleccionada tiene un fondo verde suave con borde izquierdo verde
- El checkbox cuando esta seleccionado tiene fondo verde
- Clara distincion visual entre filas seleccionadas y no seleccionadas

---

## Cambios a Implementar

### 1. Boton "Ver" en Hover (cuando el panel esta abierto)

Se agregara una nueva prop `isPanelOpen` al DataTable para saber cuando mostrar el boton "Ver".

Comportamiento:
- Si el panel esta abierto Y se hace hover en una fila diferente → aparece boton "Ver"
- Al hacer clic en "Ver" → cambia seleccion a SOLO ese registro y actualiza el panel
- El checkbox sigue funcionando independiente para seleccionar multiples

```text
Panel cerrado:
| [ ] | 12345678 | Juan Perez | Construccion |

Panel abierto + hover en otra fila:
| [ ] | 12345678 [Ver] | Juan Perez | Construccion |  <- Boton aparece
```

### 2. Estilos de Seleccion Acentuados

**Fila seleccionada:**
- Fondo: `bg-primary/10` (verde/azul suave)
- Borde izquierdo: `border-l-2 border-primary` (linea de color)

**Checkbox seleccionado:**
- Fondo: `bg-primary` en lugar de `bg-muted`
- Icono: `text-primary-foreground` (blanco)

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/ui/checkbox.tsx` | Estilo seleccionado con primary |
| `src/components/shared/DataTable.tsx` | Boton "Ver", estilos de fila, prop isPanelOpen |
| `src/pages/personas/PersonasPage.tsx` | Pasar isPanelOpen, logica de ver registro |
| `src/pages/matriculas/MatriculasPage.tsx` | Mismos cambios |
| `src/pages/cursos/CursosPage.tsx` | Mismos cambios |

---

## Detalle de Implementacion

### DataTable - Nuevas Props y Logica

```typescript
interface DataTableProps<T> {
  // ... existing props
  isPanelOpen?: boolean;
  activeRowId?: string; // ID del registro actualmente mostrado en panel
  onViewRow?: (item: T) => void; // Callback para "Ver" un registro
}
```

### DataTable - Renderizado de Fila

```typescript
<TableRow
  key={item.id}
  className={cn(
    "group relative",
    onRowClick && "cursor-pointer",
    isSelected && "bg-primary/10 border-l-2 border-l-primary",
    !isSelected && "hover:bg-muted/30"
  )}
>
  {/* Celda con boton Ver en hover */}
  <TableCell>
    <div className="relative">
      {/* Contenido normal */}
      <span>{value}</span>
      
      {/* Boton Ver - solo cuando panel abierto y no es fila activa */}
      {isPanelOpen && item.id !== activeRowId && (
        <Button
          variant="default"
          size="sm"
          className="absolute right-0 top-1/2 -translate-y-1/2 
                     opacity-0 group-hover:opacity-100 transition-opacity
                     h-6 px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onViewRow?.(item);
          }}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Ver
        </Button>
      )}
    </div>
  </TableCell>
</TableRow>
```

### PersonasPage - Logica de Ver Registro

```typescript
// Nuevo handler para "Ver" un registro (sin acumular seleccion)
const handleViewRow = (persona: Persona) => {
  const index = filteredPersonas.findIndex((p) => p.id === persona.id);
  // Cambiar seleccion a SOLO este registro
  setSelectedIds([persona.id]);
  // Actualizar panel
  setSelectedIndex(index);
};

// En DataTable
<DataTable
  // ... props existentes
  isPanelOpen={selectedIndex !== null}
  activeRowId={selectedPersona?.id}
  onViewRow={handleViewRow}
/>
```

### Checkbox - Estilos Seleccionados

```typescript
<CheckboxPrimitive.Root
  className={cn(
    "peer h-4 w-4 shrink-0 rounded-sm border",
    "border-muted-foreground/40",
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Cuando seleccionado: fondo primario
    "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
    className,
  )}
>
  <CheckboxPrimitive.Indicator>
    <Check className="h-3 w-3" strokeWidth={2.5} />
  </CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
```

---

## Flujo de Interaccion

```text
1. Usuario abre panel haciendo clic en una fila
   → Fila se selecciona (checkbox marcado)
   → Panel muestra detalles
   → Fila tiene fondo coloreado y borde izquierdo

2. Usuario hace hover en OTRA fila (con panel abierto)
   → Aparece boton "Ver" en esa fila
   
3. Usuario hace clic en "Ver"
   → Seleccion cambia a SOLO ese registro
   → Panel actualiza a mostrar nuevo registro
   
4. Usuario hace clic en CHECKBOX de otra fila
   → Se agrega a seleccion multiple
   → Panel NO cambia (sigue mostrando registro original)
```

---

## Seccion Tecnica

### Estilos de Fila en DataTable

```typescript
// En TableRow
const rowClasses = cn(
  "group relative transition-colors",
  onRowClick && "cursor-pointer",
  isSelected
    ? "bg-primary/10 border-l-2 border-l-primary"
    : "hover:bg-muted/30",
  isActive && "ring-1 ring-primary/50" // Fila activa en panel
);
```

### Posicionamiento del Boton Ver

El boton "Ver" se posicionara de forma absoluta dentro de la primera celda de contenido (despues del checkbox), apareciendo solo en hover:

```typescript
// Primera columna visible (despues de checkbox)
<TableCell className="relative">
  <div className="flex items-center gap-2">
    <span>{content}</span>
    
    {/* Boton Ver superpuesto */}
    {isPanelOpen && !isCurrentlyViewing && (
      <Button
        size="sm"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                   opacity-0 group-hover:opacity-100 
                   h-6 px-2 text-xs bg-primary hover:bg-primary/90
                   shadow-sm z-10"
        onClick={(e) => {
          e.stopPropagation();
          onViewRow?.(item);
        }}
      >
        <ExternalLink className="h-3 w-3 mr-1" />
        Ver
      </Button>
    )}
  </div>
</TableCell>
```

### Diferenciacion entre Clic en Fila vs Checkbox

- **Clic en checkbox**: Agrega/quita de seleccion multiple (sin cambiar panel)
- **Clic en boton Ver**: Cambia a ver solo ese registro
- **Clic en fila**: Mantiene comportamiento actual (selecciona + abre panel)

