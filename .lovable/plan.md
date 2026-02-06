

# Plan: Tabla con Seleccion Masiva y Panel sin Bloqueo

## Resumen

Se mejorara el componente DataTable para incluir seleccion masiva con checkboxes y acciones en lote, columnas configurables con scroll horizontal, y se modificara el comportamiento del panel deslizante para permitir la interaccion con la tabla mientras esta abierto.

---

## Cambios Principales

### 1. Overlay Transparente del Panel

**Problema actual**: El Sheet tiene un overlay con `bg-black/80` que bloquea toda la pantalla.

**Solucion**: Modificar el SheetOverlay para que sea transparente o muy sutil, permitiendo que el usuario vea la tabla y pueda hacer clic en otros registros sin cerrar primero el panel.

| Antes | Despues |
|-------|---------|
| `bg-black/80` | `bg-transparent` o `bg-black/5` |
| Click en overlay cierra | Click en fila cambia registro |
| Bloquea interaccion | Permite interaccion con tabla |

### 2. Iconos de Accion en Hover

**Propuesta**: Los iconos de editar, ver y eliminar solo apareceran al hacer hover sobre la fila, ahorrando espacio horizontal.

```text
Estado normal:
| Documento | Nombre    | Sector      | Telefono   |
|-----------|-----------|-------------|------------|
| 123456    | Juan Perez| Construccion| 311...     |

Estado hover:
| Documento | Nombre    | Sector      | Telefono   | [👁] [✏] [🗑] |
|-----------|-----------|-------------|------------|---------------|
| 123456    | Juan Perez| Construccion| 311...     | <- fila hover |
```

**Implementacion**: 
- La columna de acciones tendra `opacity-0 group-hover:opacity-100`
- La fila tendra la clase `group`

### 3. Seleccion Masiva con Checkboxes

**Nuevas funcionalidades**:
- Checkbox en el header para seleccionar/deseleccionar todos
- Checkbox por cada fila
- Barra de acciones que aparece cuando hay seleccion
- Contador de items seleccionados

```text
+--------------------------------------------------------------+
| 3 seleccionados                    [Eliminar] [Exportar]     |
+--------------------------------------------------------------+
| [x] Documento | Nombre     | Sector         | Telefono       |
|---------------|------------|----------------|----------------|
| [x] 12345678  | Juan Perez | [Construccion] | 311...         |
| [ ] 98765432  | Maria Lopez| [Energia]      | 300...         |
| [x] 55555555  | Carlos Ruiz| [Telecomunic.] | 315...         |
+--------------------------------------------------------------+
```

### 4. Columnas Configurables

**Nuevas funcionalidades**:
- Boton para mostrar/ocultar columnas
- Scroll horizontal cuando hay muchas columnas
- Configuracion persistente en localStorage

```text
+------------------------------------------+
| [Columnas ▼]                             |
+------------------------------------------+
| [x] Documento                            |
| [x] Nombre                               |
| [ ] Email (oculta)                       |
| [x] Sector                               |
| [ ] Fecha Nacimiento (oculta)            |
+------------------------------------------+
```

---

## Archivos a Modificar/Crear

| Archivo | Accion | Descripcion |
|---------|--------|-------------|
| `src/components/ui/sheet.tsx` | Modificar | Overlay transparente, no modal |
| `src/components/shared/DataTable.tsx` | Modificar | Checkboxes, hover actions, scroll |
| `src/components/shared/BulkActionsBar.tsx` | Crear | Barra de acciones masivas |
| `src/components/shared/ColumnSelector.tsx` | Crear | Selector de columnas visibles |
| `src/components/shared/RowActions.tsx` | Crear | Acciones en hover |
| `src/pages/personas/PersonasPage.tsx` | Modificar | Integrar nuevas funcionalidades |
| `src/pages/matriculas/MatriculasPage.tsx` | Modificar | Integrar nuevas funcionalidades |
| `src/pages/cursos/CursosPage.tsx` | Modificar | Integrar nuevas funcionalidades |

---

## Detalle de Implementacion

### SheetOverlay sin bloqueo

```typescript
// sheet.tsx - Nuevo SheetOverlay
const SheetOverlay = React.forwardRef<...>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-transparent", // Sin fondo oscuro
      className,
    )}
    {...props}
    ref={ref}
  />
));

// SheetContent - permitir clics fuera
<SheetPrimitive.Content 
  ref={ref} 
  className={cn(sheetVariants({ side, size }), className)} 
  onPointerDownOutside={(e) => e.preventDefault()} // No cerrar al clic fuera
  {...props}
>
```

Esto permitira:
- El usuario ve la tabla claramente
- Puede hacer clic en otra fila para cambiar el registro mostrado
- El panel permanece abierto

### DataTable con Checkboxes

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  // Nuevas props
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: BulkAction[];
  columnConfig?: ColumnConfig[];
  onColumnConfigChange?: (config: ColumnConfig[]) => void;
}

interface BulkAction {
  label: string;
  icon?: React.ElementType;
  variant?: "default" | "destructive";
  onClick: (ids: string[]) => void;
}

interface ColumnConfig {
  key: string;
  visible: boolean;
}
```

### RowActions con Hover

```typescript
// Dentro de DataTable
<TableRow
  key={item.id}
  className="group cursor-pointer"
  onClick={() => onRowClick?.(item)}
>
  {/* ... celdas ... */}
  
  {/* Acciones en hover */}
  <TableCell className="w-[100px]">
    <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Edit className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7">
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  </TableCell>
</TableRow>
```

### BulkActionsBar

```typescript
interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  actions: BulkAction[];
}

// Renderizado
<div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-lg">
  <div className="flex items-center gap-2">
    <Checkbox checked={selectedCount === totalCount} />
    <span className="text-sm font-medium">
      {selectedCount} seleccionados
    </span>
    <Button variant="ghost" size="sm" onClick={onClearSelection}>
      Limpiar
    </Button>
  </div>
  <div className="flex gap-2">
    {actions.map(action => (
      <Button 
        key={action.label}
        variant={action.variant}
        size="sm"
        onClick={() => action.onClick(selectedIds)}
      >
        {action.icon && <action.icon className="h-4 w-4 mr-1" />}
        {action.label}
      </Button>
    ))}
  </div>
</div>
```

### ColumnSelector

```typescript
interface ColumnSelectorProps {
  columns: { key: string; header: string }[];
  visibleColumns: string[];
  onChange: (visibleColumns: string[]) => void;
}

// Se renderiza como un Popover con checkboxes
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm">
      <Columns className="h-4 w-4 mr-2" />
      Columnas
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    {columns.map(col => (
      <div key={col.key} className="flex items-center gap-2">
        <Checkbox 
          checked={visibleColumns.includes(col.key)}
          onCheckedChange={() => toggle(col.key)}
        />
        <span>{col.header}</span>
      </div>
    ))}
  </PopoverContent>
</Popover>
```

---

## Flujo de Interaccion con Panel Abierto

```text
1. Usuario en /personas
2. Clic en fila -> Panel se abre a la derecha
3. Tabla sigue visible y funcional
4. Usuario hace clic en OTRA fila
5. Panel actualiza contenido (sin cerrar y reabrir)
6. Usuario puede seleccionar checkboxes en la tabla
7. Usuario cierra panel con X o Escape
```

---

## Scroll Horizontal

Para tablas con muchas columnas:

```typescript
// En DataTable
<div className="overflow-x-auto border rounded-lg">
  <Table className="min-w-[800px]"> {/* Ancho minimo */}
    {/* contenido */}
  </Table>
</div>
```

Esto asegura que:
- Las columnas mantienen su ancho minimo
- Aparece scroll horizontal cuando es necesario
- La tabla no se comprime demasiado

---

## Seccion Tecnica

### Modificacion del Sheet para no bloquear

El cambio principal es en `SheetContent`:

```typescript
const SheetContent = React.forwardRef<...>(
  ({ side, size, className, children, hideCloseButton, ...props }, ref) => (
    <SheetPortal>
      {/* Overlay sutil o transparente */}
      <SheetOverlay className="bg-black/5" />
      
      <SheetPrimitive.Content 
        ref={ref} 
        className={cn(sheetVariants({ side, size }), className)} 
        // Prevenir cierre automatico al clic fuera
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        {...props}
      >
        {children}
        {/* ... */}
      </SheetPrimitive.Content>
    </SheetPortal>
  ),
);
```

### Estado de Seleccion en PersonasPage

```typescript
const [selectedIds, setSelectedIds] = useState<string[]>([]);

const handleSelectionChange = (ids: string[]) => {
  setSelectedIds(ids);
};

const handleBulkDelete = async () => {
  // Confirmar y eliminar
  for (const id of selectedIds) {
    await deletePersona.mutateAsync(id);
  }
  setSelectedIds([]);
};

const bulkActions: BulkAction[] = [
  {
    label: "Eliminar",
    icon: Trash2,
    variant: "destructive",
    onClick: handleBulkDelete,
  },
];
```

### Persistencia de Columnas Visibles

```typescript
const STORAGE_KEY = 'personas_visible_columns';

const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : ['numeroDocumento', 'nombre', 'sector', 'telefono'];
});

useEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns));
}, [visibleColumns]);
```

