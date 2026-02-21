

## Correccion de dos problemas en las tablas

### Problema 1: Columnas adicionales aparecen aunque no estan seleccionadas

**Causa raiz**: En `DataTable.tsx`, linea 64, cuando una columna del array `columns` no se encuentra en el `columnConfig` (por ejemplo, porque el usuario tiene una version anterior guardada en localStorage), el fallback es `true`:

```
return config ? config.visible : true;
```

Esto significa que cualquier columna nueva que no exista en el `columnConfig` guardado en localStorage se muestra automaticamente. El fix es cambiar ese fallback a `false`.

**Cambio**: En `src/components/shared/DataTable.tsx`, cambiar la linea 64 de `return config ? config.visible : true;` a `return config ? config.visible : false;`.

---

### Problema 2: Scroll horizontal se propaga a toda la vista

**Causa raiz**: El `<main>` en `MainLayout.tsx` tiene `overflow-auto` (linea 79), lo que permite que el contenido se expanda y genere scroll a nivel de toda la vista. Las paginas (`MatriculasPage`, `PersonasPage`, `CursosListView`) envuelven la tabla en divs sin restriccion de ancho, asi que la tabla ancha empuja todo el layout.

**Cambio**: En `src/components/layout/MainLayout.tsx`, agregar `min-w-0` al `<main>` para que no crezca mas alla de su contenedor flex. Esto, combinado con el `min-w-0 w-full` ya existente en DataTable y el `overflow-x-auto` interno, garantiza que solo la tabla haga scroll horizontal.

---

### Resumen de archivos a modificar

1. **`src/components/shared/DataTable.tsx`** - Cambiar fallback de visibilidad de columna de `true` a `false` (1 linea).
2. **`src/components/layout/MainLayout.tsx`** - Agregar `min-w-0` al elemento `<main>` (1 linea).

