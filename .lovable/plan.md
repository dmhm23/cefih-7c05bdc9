

## Plan: Corregir desbordamiento de nombres de archivo en modales

### Problema
Cuando un archivo tiene un nombre largo, el contenedor de vista previa del archivo dentro de los modales se expande y los elementos se desbordan fuera de los márgenes.

### Causa raíz
En `FileDropZone.tsx`, el contenedor de archivo seleccionado (línea 99) no tiene `min-w-0` ni `overflow-hidden`, y el span del tamaño del archivo no tiene `shrink-0`, permitiendo que el nombre empuje todo fuera del contenedor.

### Cambios

**1. `src/components/shared/FileDropZone.tsx`**
- Agregar `min-w-0` al contenedor principal del archivo seleccionado para que `truncate` funcione correctamente dentro de flex
- Agregar `shrink-0` al span del tamaño del archivo para que no se comprima
- Agregar `overflow-hidden` como respaldo

**2. `src/components/cartera/EditarFacturaDialog.tsx`**
- Agregar `min-w-0` al contenedor inline de "Archivo adjunto" y `shrink-0` a los botones

**3. `src/components/cartera/EditarPagoDialog.tsx`**
- Mismo ajuste: `min-w-0` al contenedor inline de "Comprobante adjunto" y `shrink-0` a los botones

Estos son cambios mínimos de CSS (clases de Tailwind) que resuelven el problema en todos los puntos donde se muestra un archivo adjunto.

