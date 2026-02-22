

## Header fijo con scroll exclusivo en el contenido principal

### Problema

El `SidebarInset` tiene `min-h-svh` pero no un alto maximo fijo. Cuando el contenido de la pagina es mas largo que el viewport, el `SidebarInset` crece y el navegador genera scroll nativo a nivel de toda la ventana, desplazando el header junto con el contenido.

### Solucion

Agregar `h-svh overflow-hidden` al `SidebarInset` en `MainLayout.tsx`. Esto fija el panel al alto exacto del viewport y evita que crezca. El scroll vertical queda delegado exclusivamente al `<main>` interno que ya tiene `overflow-y-auto`.

### Cambio

**Archivo: `src/components/layout/MainLayout.tsx`** (linea 40)

- Antes: `<SidebarInset className="min-w-0">`
- Despues: `<SidebarInset className="min-w-0 h-svh overflow-hidden">`

Un solo cambio de una linea. No se requieren modificaciones en ningun otro archivo.

### Resultado

- El header permanece fijo en la parte superior, siempre visible.
- Solo el area de contenido (`<main>`) hace scroll vertical.
- El scroll horizontal de la tabla sigue funcionando correctamente dentro de `<main>`.

