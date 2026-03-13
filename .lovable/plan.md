
## Plan: Corregir estado inicial de grupo de cartera

### Problema

Cuando se crea una matrícula nueva y se genera automáticamente un grupo de cartera, el estado aparece como **"Pagado"** en vez de **"Pendiente"**.

**Causa raíz**: En `recalcGrupo()` la primera condición es `if (grupo.saldo <= 0)` → marca `'pagado'`. Cuando el grupo es nuevo con `totalValor = 0` y `totalAbonos = 0`, el saldo es 0, cumple la condición y se marca como pagado incorrectamente.

### Cambio

**`src/services/carteraService.ts`** — línea 30: Cambiar la condición para que solo marque "pagado" cuando el saldo es ≤ 0 **y** el total es mayor que 0 (es decir, hay algo que pagar y ya se cubrió).

```typescript
// Antes
if (grupo.saldo <= 0) {

// Después  
if (grupo.saldo <= 0 && grupo.totalValor > 0) {
```

Un solo cambio de una línea.
