

## Plan: Scrollbar horizontal fija en tablas

### Problema
Hay dos contenedores `overflow-auto` anidados:
1. **DataTable** (línea 191): `overflow-auto h-full` — maneja scroll vertical
2. **Table component** (línea 7): `overflow-auto` — maneja scroll horizontal

La scrollbar horizontal vive en el contenedor interior, así que se desplaza hacia abajo con el contenido y desaparece de la vista.

### Solución
Eliminar el `overflow-auto` del wrapper interno del componente `Table` y dejar que el único contenedor de DataTable maneje ambos ejes de scroll. Así la scrollbar horizontal queda fija al fondo del contenedor visible.

### Cambios

1. **`src/components/ui/table.tsx`** — Cambiar `overflow-auto` a `overflow-visible` en el div wrapper del `Table` para que no cree su propia zona de scroll.

2. **`src/components/shared/DataTable.tsx`** — En el contenedor de scroll (línea 191), asegurar `overflow-auto` para ambos ejes. Como el contenedor tiene `h-full` y `min-h-0`, la scrollbar horizontal permanecerá anclada al borde inferior visible.

Resultado: una sola zona de scroll que mantiene la barra horizontal siempre visible al fondo de la tabla, sin importar cuántos registros haya.

