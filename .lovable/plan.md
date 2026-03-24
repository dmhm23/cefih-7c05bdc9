

## Análisis: Estados de pago en Cartera vs Matrículas

### Situación actual

Existen **tres conjuntos de estados** relacionados con pagos:

| Ubicación | Tipo | Valores actuales | Dónde se ve |
|---|---|---|---|
| **Grupo Cartera** | `EstadoGrupoCartera` | pendiente, facturado, abonado, pagado, vencido | Lista de grupos en /cartera y detalle |
| **Factura** | `EstadoFactura` | pendiente, parcial, pagada | Tarjetas de factura dentro de un grupo |
| **Matrícula** | `pagado: boolean` | Pagado / Pendiente | Badge en /matriculas/:id sección cartera y en tabla de matrículas del grupo |

### Problemas identificados

1. **Ambigüedad de "Pendiente"**: En Grupo Cartera significa "sin facturar"; en Factura significa "sin pagar". Mismo label, significados distintos.

2. **Duplicidad Matrícula vs Cartera**: `matricula.pagado` es un booleano independiente que no se sincroniza con el estado real del grupo de cartera. Una matrícula puede marcarse como "Pagado" en su detalle aunque el grupo de cartera siga en estado "abonado" o viceversa.

3. **Dos fuentes de verdad**: El módulo de Cartera calcula estados automáticamente (recalcGrupo), pero el `pagado` de matrícula se gestiona manualmente vía `registrarPago`.

### Propuesta

#### A. Renombrar estados ambiguos

**EstadoGrupoCartera** (5 estados → mismos 5, con labels claros):

| Valor técnico | Label actual | Label nuevo |
|---|---|---|
| `sin_facturar` | Pendiente | **Sin facturar** |
| `facturado` | Facturado | Facturado (sin cambio) |
| `abonado` | Abonado | Abonado (sin cambio) |
| `pagado` | Pagado | Pagado (sin cambio) |
| `vencido` | Vencido | Vencido (sin cambio) |

**EstadoFactura** (3 estados → mismos 3, con labels claros):

| Valor técnico | Label actual | Label nuevo |
|---|---|---|
| `por_pagar` | Pendiente | **Por pagar** |
| `parcial` | Parcial | Parcial (sin cambio) |
| `pagada` | Pagada | Pagada (sin cambio) |

#### B. Matrícula: derivar estado de pago desde Cartera

En lugar de mantener dos fuentes de verdad, el badge de pago en `/matriculas/:id` debería **consultar el estado real de la factura/grupo** en cartera, no el booleano `pagado` local. Esto implica:

- En la vista de detalle de matrícula, buscar si la matrícula está vinculada a alguna factura en cartera y mostrar el estado de esa factura.
- Si no tiene factura vinculada, mostrar "Sin facturar".
- Mantener `pagado` como campo legacy por compatibilidad pero dejar de usarlo como fuente visual.

#### C. StatusBadge unificado

Agregar los nuevos estados al componente `StatusBadge`:
- `sin_facturar`: fondo gris/slate, label "Sin facturar"
- `por_pagar`: fondo amber, label "Por pagar"

### Archivos a modificar

1. **`src/types/cartera.ts`** — renombrar `pendiente` → `sin_facturar` en EstadoGrupoCartera y `pendiente` → `por_pagar` en EstadoFactura, actualizar labels
2. **`src/services/carteraService.ts`** — actualizar `recalcGrupo` y `recalcFactura` con los nuevos valores
3. **`src/data/mockCartera.ts`** — actualizar estados en datos mock
4. **`src/components/shared/StatusBadge.tsx`** — agregar `sin_facturar` y `por_pagar`, remover `pendiente` de los estados de cartera/factura
5. **`src/pages/cartera/CarteraPage.tsx`** — actualizar filtros
6. **`src/pages/cartera/GrupoCarteraDetallePage.tsx`** — derivar estado de pago de matrícula desde cartera en vez de `m.pagado`
7. **`src/pages/matriculas/MatriculaDetallePage.tsx`** — sección cartera: mostrar estado derivado de factura/grupo en vez de `matricula.pagado`
8. **`src/components/cartera/CrearFacturaDialog.tsx`**, **`EditarFacturaDialog.tsx`** — si referencian el estado `pendiente`

