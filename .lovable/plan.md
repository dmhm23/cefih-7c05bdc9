## Plan: Mejorar modal "Registrar Factura" y sincronizar con matrículas

### Resumen

Hacer la vinculación de matrículas opcional, mostrar nombres reales de personas en vez de IDs crípticos, permitir editar el monto total manualmente, y propagar cambios de facturación a las matrículas asociadas.

### Cambios

#### 1. `CrearFacturaDialog.tsx` — Rediseño del modal

- Recibir `personas` como prop adicional (ya disponibles en la página padre).
- En la lista de matrículas, mostrar **nombre completo** de la persona (`nombres apellidos`) + nombre del curso en vez de `m.id`.
- Hacer la selección de matrículas **opcional**: eliminar la validación `selectedIds.length === 0`.
- Cambiar el campo "Subtotal" de read-only a un `Input` numérico editable (`totalManual`). Si hay matrículas seleccionadas, pre-llenar con la suma de `valorCupo`, pero el usuario puede sobreescribirlo.
- **Añadir un control (toggle o checkbox) llamado “Seleccionar matrículas específicas para esta factura”.**
  - Por defecto debe estar **deshabilitado** para no sobrecargar el modal.
  - Solo cuando el usuario lo active se mostrará el **listado de matrículas/personas** para seleccionar cuáles desea incluir en el pago.
- **Ubicación del listado:** el bloque de selección de matrículas debe aparecer **después de los campos de número de factura, subtotal y totales**, únicamente si el usuario habilita el control anterior.
- Al enviar, usar `totalManual` como el total de la factura.
  &nbsp;

#### 2. `GrupoCarteraDetallePage.tsx` — Pasar personas y cursos al dialog

- Pasar `personas` y `cursos` como props al `CrearFacturaDialog`.

#### 3. `carteraService.ts` — Sincronizar factura → matrícula

- En `createFactura`: al registrar una factura, actualizar las matrículas vinculadas con `facturaNumero = numeroFactura` y `fechaFacturacion = fechaEmision`. (Ajustar nombres, en vez de crear factura es registrar).
- En `updateFactura`: si cambia el número o fecha, propagar a las matrículas vinculadas.
- Importar y mutar `mockMatriculas` desde `mockData` para aplicar los cambios.

#### 4. `EditarFacturaDialog.tsx` — Mismo tratamiento

- Mostrar nombres de personas en las matrículas vinculadas (read-only en edición).
- Permitir editar el total manualmente.
- Al guardar, propagar cambios a matrículas.

### Detalle técnico

- Las personas y cursos ya se cargan en `GrupoCarteraDetallePage` con `usePersonas()` y `useCursos()`, solo se pasan como props.
- La sincronización a matrículas usa la misma referencia en memoria de `mockMatriculas` que ya usa `matriculaService`.
- El campo total se inicializa con el cálculo automático de matrículas seleccionadas pero es editable; un `useEffect` actualiza el valor cuando cambia la selección, salvo que el usuario haya editado manualmente.