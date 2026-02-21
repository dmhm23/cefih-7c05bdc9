

## Scroll horizontal contenido exclusivamente en la tabla

### Problema

El elemento `<main>` en `MainLayout.tsx` tiene la clase `overflow-auto`, lo que permite scroll tanto vertical como horizontal a nivel de toda la vista. Cuando la tabla tiene muchas columnas activas, el contenido ancho "empuja" el scroll horizontal hacia el contenedor principal en lugar de quedarse dentro de la tabla.

### Solucion

Cambiar `overflow-auto` por `overflow-y-auto overflow-x-hidden` en el `<main>` de `MainLayout.tsx`. Esto permite que la pagina siga haciendo scroll vertical normalmente, pero bloquea el scroll horizontal a nivel del layout. El scroll horizontal queda contenido dentro del `overflow-x-auto` que ya existe en el wrapper interno de la tabla (`DataTable.tsx`, linea 118).

### Cambio

**Archivo: `src/components/layout/MainLayout.tsx`** (linea 79)

- Antes: `<main className="flex-1 overflow-auto p-6 min-w-0">`
- Despues: `<main className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-0">`

Un solo cambio de una linea. No se requieren modificaciones en ningun otro archivo.

