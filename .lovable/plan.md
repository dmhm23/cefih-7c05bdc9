## Plan: Actualizar métodos de pago y hacer soporte obligatorio

### Cambios

**1. Actualizar tipo y labels** — `src/types/cartera.ts`

Reemplazar:

```typescript
export type MetodoPago = 'transferencia' | 'efectivo' | 'consignacion' | 'tarjeta';
```

Por:

```typescript
export type MetodoPago = 'transferencia_bancaria' | 'efectivo' | 'consignacion' | 'nequi' | 'daviplata' | 'bre_b' | 'corresponsal_bancario' | '+ Añadir opción';
```

Labels actualizados:


| Valor                    | Etiqueta               |
| ------------------------ | ---------------------- |
| `transferencia_bancaria` | Transferencia Bancaria |
| `efectivo`               | Efectivo               |
| `consignacion`           | Consignación           |
| `nequi`                  | Nequi                  |
| `daviplata`              | Daviplata              |
| `bre_b`                  | Bre-b                  |
| `corresponsal_bancario`  | Corresponsal Bancario  |
| `anadir_opcion`          | Añadir opción          |


Se elimina `tarjeta`.

**2. Campo "Añadr opción" con input adicional** — `RegistrarPagoDialog.tsx` y `EditarPagoDialog.tsx`

- Cuando se selecciona "Añadir opción", aparece un `Input` debajo para especificar el método
- Este texto se guarda en `observaciones` o en un campo adicional en la descripción del pago

**3. Soporte de pago obligatorio** — `RegistrarPagoDialog.tsx`

- Validar que `archivo` no sea `null` antes de permitir el submit
- Mostrar mensaje de error si no se adjunta comprobante
- Cambiar label a "Soporte de Pago (comprobante) *"

**4. Actualizar mocks** — `src/data/mockCartera.ts`

- Cambiar `'transferencia'` → `'transferencia_bancaria'` en todos los pagos mock

**5. Actualizar servicio** — `src/services/carteraService.ts`

- Actualizar la referencia `metodoLabel` si existe, para usar los nuevos keys

### Archivos afectados


| Archivo                                          | Cambio                                     |
| ------------------------------------------------ | ------------------------------------------ |
| `src/types/cartera.ts`                           | Nuevo `MetodoPago` type + labels           |
| `src/components/cartera/RegistrarPagoDialog.tsx` | Input "añadir opción", soporte obligatorio |
| `src/components/cartera/EditarPagoDialog.tsx`    | Input "añadir opción", consistencia        |
| `src/data/mockCartera.ts`                        | Migrar keys                                |
| `src/services/carteraService.ts`                 | Actualizar labels internos                 |
