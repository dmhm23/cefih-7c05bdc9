

## Scroll horizontal contenido exclusivamente en la tabla

### Diagnostico

La cadena de contencion de ancho tiene un eslabon roto. La estructura actual es:

```text
SidebarProvider  (div flex w-full)
  +-- AppSidebar (ancho fijo)
  +-- SidebarInset (main, flex-1, flex-col)  <-- SIN min-w-0
        +-- header (shrink-0)
        +-- main (flex-1, overflow-x-hidden, min-w-0)
              +-- PersonasPage div
                    +-- Toolbar (buscador, filtros, botones)
                    +-- DataTable (min-w-0, w-full)
                          +-- div overflow-x-auto  <-- scroll interno
```

El problema es que `SidebarInset` (definido en `sidebar.tsx`) tiene `flex-1` pero **no tiene `min-w-0`**. En un contenedor flex, un hijo con `flex-1` puede crecer mas alla del espacio disponible si su contenido es mas ancho. Esto hace que todo el panel (incluyendo header con buscador y botones) se expanda horizontalmente, generando scroll a nivel superior.

El `overflow-x-hidden` y `min-w-0` que ya estan en el `<main>` interno no sirven porque su padre (`SidebarInset`) ya se expandio.

### Solucion

Agregar `min-w-0` al componente `SidebarInset` en `MainLayout.tsx` pasandolo como className. Esto evita que el flex item crezca mas alla de su espacio disponible, forzando que el contenido se recorte/scrollee internamente.

### Cambio

**Archivo: `src/components/layout/MainLayout.tsx`** (linea 40)

- Antes: `<SidebarInset>`
- Despues: `<SidebarInset className="min-w-0">`

Un solo cambio. No se requieren modificaciones en ningun otro archivo.

### Por que funciona

Con `min-w-0` en `SidebarInset`:
1. El panel no puede crecer mas alla del espacio que le asigna el flex container del `SidebarProvider`.
2. El `overflow-x-hidden` del `<main>` interno ahora si tiene efecto porque su padre esta limitado.
3. El `overflow-x-auto` dentro de `DataTable` captura el scroll horizontal solo para la tabla.
4. El header, toolbar, buscador y botones permanecen siempre visibles y estaticos.

