

# Plan: Corregir eliminación de niveles desde la tabla y mejorar mensaje de error

## Problema 1: Clic en eliminar navega al detalle

En `DataTable`, el `<tr>` tiene `onClick={() => onRowClick?.(item)}` (línea 245). Los botones de `RowActions` no llaman `e.stopPropagation()`, por lo que al hacer clic en Eliminar (o Editar), el evento burbujea al `<tr>` y navega a la vista de detalle.

### Solución

En `RowActions.tsx`, agregar `e.stopPropagation()` antes de ejecutar `action.onClick()` en ambos contextos (desktop `IconButton` y mobile `DropdownMenuItem`):

```typescript
// Desktop
onClick={(e) => { e.stopPropagation(); action.onClick(); }}

// Mobile DropdownMenuItem
onClick={(e) => { e.stopPropagation(); action.onClick(); }}
```

Esto corrige el problema para **todos los módulos** que usan `RowActions` dentro de tablas con `onRowClick`.

## Problema 2: Mensaje genérico "Error al eliminar"

En `NivelesPage.tsx` línea 59, el `catch` ignora el mensaje del error. El servicio ya lanza un `ApiError` con mensaje "No se puede eliminar el nivel de formación. Tiene cursos vinculados." (ver `nivelFormacionService.delete`).

### Solución

En `NivelesPage.tsx`, modificar el catch para extraer `err.message`:

```typescript
} catch (err: any) {
  toast({ 
    title: err?.message || "Error al eliminar el nivel", 
    variant: "destructive" 
  });
}
```

Aplicar la misma corrección en `NivelDetallePage.tsx` línea 50-51.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/RowActions.tsx` | Agregar `e.stopPropagation()` en onClick de ambos contextos |
| `src/pages/niveles/NivelesPage.tsx` | Usar `err.message` en catch de handleDelete |
| `src/pages/niveles/NivelDetallePage.tsx` | Usar `err.message` en catch de handleDelete |

**Total: 3 archivos editados, 0 migraciones**

