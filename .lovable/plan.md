
Objetivo: corregir el desbordamiento de nombres de archivos en los modales de Cartera sin agrandar inputs, haciendo que el nombre visible se limite a 28–30 caracteres con puntos suspensivos y reforzando la regla general de que ningún contenido puede salirse de los márgenes del modal.

Plan de implementación

1. Ajustar el componente compartido `FileDropZone`
- Centralizar aquí la solución porque ya se reutiliza en Registro de factura, Registro de pago y otros flujos.
- Agregar una función de presentación para truncar el nombre visible del archivo a 30 caracteres aprox.
- Mostrar solo la versión resumida en UI, pero conservar el nombre completo como `title`/tooltip para consulta.
- Mantener `truncate`, `min-w-0`, `overflow-hidden`, `flex-1` y `shrink-0` para que el layout nunca empuje botones o tamaños fuera del contenedor.
- Asegurar que el contenedor del archivo seleccionado use `w-full max-w-full` para no crecer más que el modal.

2. Reforzar los modales de Cartera donde ocurre el problema
- Revisar `RegistrarPagoDialog` y `CrearFacturaDialog`, que dependen directamente de `FileDropZone`, para confirmar que el contenedor padre no introduce expansión horizontal.
- Mantener el mismo criterio en `EditarPagoDialog` y `EditarFacturaDialog`, aunque hoy muestran texto genérico, para que cualquier variante futura de nombre real quede protegida.
- Si hace falta, añadir `min-w-0`/`overflow-hidden` a wrappers intermedios dentro del modal.

3. Aplicar la regla general de no desbordamiento en UI compartida
- Como `FileDropZone` se usa en más módulos, este ajuste servirá como regla global para adjuntos cargados desde inputs/modales en toda la app.
- Revisar los usos más sensibles del componente para confirmar que heredan correctamente el truncado sin romper otros layouts.

4. Criterio visual esperado
- Nombre visible del archivo: máximo 28–30 caracteres.
- Si excede el límite: mostrar primeros caracteres + `…`.
- El tamaño del archivo y el botón de eliminar deben permanecer siempre visibles dentro del borde del input.
- Ningún texto, botón o icono debe salirse del ancho del modal.

Detalle técnico
- Archivos clave:
  - `src/components/shared/FileDropZone.tsx`
  - `src/components/cartera/RegistrarPagoDialog.tsx`
  - `src/components/cartera/CrearFacturaDialog.tsx`
  - `src/components/cartera/EditarPagoDialog.tsx`
  - `src/components/cartera/EditarFacturaDialog.tsx`
- Enfoque recomendado:
  - Resolver primero a nivel compartido en `FileDropZone`.
  - Complementar con restricciones de layout (`min-w-0`, `max-w-full`, `overflow-hidden`) en contenedores de modal donde corresponda.
- Resultado: solución consistente en `/cartera/:id` y reusable en cualquier otra parte donde se carguen adjuntos.
