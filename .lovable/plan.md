

## Plan: Sincronizar métodos de pago de Cartera con Matrículas

### Problema

Matrículas usa `FORMAS_PAGO` en `src/data/formOptions.ts` con opciones desactualizadas (transferencia, tarjeta, otro), mientras Cartera ya tiene los métodos correctos: transferencia bancaria, efectivo, consignación, nequi, daviplata, bre-b, corresponsal bancario y "+ Añadir opción".

### Cambios

| Archivo | Cambio |
|---|---|
| `src/data/formOptions.ts` | Reemplazar `FORMAS_PAGO` con los mismos métodos de Cartera, incluyendo opción "+ Añadir opción" |
| `src/types/matricula.ts` | Actualizar tipo `FormaPago` y `FORMA_PAGO_LABELS` para coincidir con `MetodoPago` de Cartera |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Añadir lógica de "+ Añadir opción" (input custom) como en Cartera |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Mismo tratamiento para edición en detalle |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Mismo tratamiento en el sheet lateral |
| `src/data/mockData.ts` | Migrar valores `'transferencia'` → `'transferencia_bancaria'` en mocks |

### Detalle

**`FORMAS_PAGO`** nuevo:
```typescript
export const FORMAS_PAGO = [
  { value: 'transferencia_bancaria', label: 'Transferencia Bancaria' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'consignacion', label: 'Consignación' },
  { value: 'nequi', label: 'Nequi' },
  { value: 'daviplata', label: 'Daviplata' },
  { value: 'bre_b', label: 'Bre-b' },
  { value: 'corresponsal_bancario', label: 'Corresponsal Bancario' },
  { value: 'otro', label: '+ Añadir opción' },
] as const;
```

**Tipo `FormaPago`** actualizado para coincidir con los nuevos values. Se elimina `'tarjeta'`.

**UI**: En los 3 archivos de matrículas donde se usa el selector de forma de pago, añadir la lógica de input custom cuando se selecciona `'otro'` (mismo patrón que en `RegistrarPagoDialog`).

