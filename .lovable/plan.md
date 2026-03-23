

## Plan: Reestructurar Facturación como unidad central de gestión

### Resumen

Convertir cada factura en la unidad principal, anidando pagos y seguimiento dentro de ella. Se elimina la sección global de pagos y seguimiento del grupo.

### Estructura visual resultante

```text
Grupo de Cartera
├── Info contacto + Resumen financiero + Stats
├── Matrículas Asociadas (sin cambios)
└── Facturación
    ├── [+ Registrar Factura]
    ├── Factura FAC-001 (collapsible)
    │   ├── Detalles (total, fechas, estado, archivo)
    │   ├── Pagos ──── [+ Registrar Pago]
    │   │   └── Tabla de pagos de esta factura
    │   └── Seguimiento ── [+ Agregar actividad]
    │       └── Timeline de actividades de esta factura
    ├── Factura FAC-002 (collapsible)
    │   ├── Pagos...
    │   └── Seguimiento...
    └── ...
```

### Cambios por archivo

**1. `src/types/cartera.ts`**
- Agregar `facturaId?: string` a `ActividadCartera` (opcional para retrocompatibilidad con actividades de grupo existentes)

**2. `src/services/carteraService.ts`**
- `getActividadesByFactura(facturaId)` — filtra actividades por facturaId
- `getPagosByFactura(facturaId)` — filtra pagos por facturaId (ya existe la data, solo agregar método)
- Actualizar `registrarActividad` para aceptar `facturaId` opcional
- Actualizar `addSystemActivity` para aceptar `facturaId` opcional

**3. `src/hooks/useCartera.ts`**
- Agregar `usePagosByFactura(facturaId)` y `useActividadesByFactura(facturaId)`

**4. Nuevo: `src/components/cartera/FacturaCard.tsx`**
- Componente collapsible que representa una factura individual
- Muestra header con número, estado, total, fechas
- Al expandir muestra:
  - Sección de pagos (tabla + botón registrar pago)
  - Sección de seguimiento (timeline + formulario inline)
  - Botón editar factura
- Calcula saldo pendiente de la factura (total - sum pagos)

**5. `src/components/cartera/RegistrarPagoDialog.tsx`**
- Simplificar: recibir `factura: Factura` directamente en vez de `facturas: Factura[]`
- Eliminar el select de factura (ya está implícito)
- Mostrar saldo pendiente de la factura

**6. `src/components/cartera/ActividadCarteraSection.tsx`**
- Agregar prop opcional `facturaId` para filtrar/registrar actividades por factura
- Usar `useActividadesByFactura` cuando se pasa facturaId

**7. `src/pages/cartera/GrupoCarteraDetallePage.tsx`**
- Eliminar las 3 cards separadas (Facturación tabla, Historial de Pagos, Seguimiento)
- Reemplazar con una sola sección "Facturación" que renderiza un `FacturaCard` por cada factura
- Mantener botón "Registrar Factura" en el header de la sección
- Eliminar estado `showRegistrarPago` global (ahora vive dentro de cada FacturaCard)

**8. `src/data/mockCartera.ts`**
- Agregar `facturaId` a las actividades mock existentes para que se asocien correctamente

### Notas técnicas

- Se usa `Collapsible` de Radix (ya existe en el proyecto) para expandir/colapsar cada factura
- Los pagos y actividades ya están vinculados a facturas vía `facturaId` en la data; solo falta exponerlo en la UI
- No se modifica la lógica de agrupación automática ni el modelo de datos de `GrupoCartera`

