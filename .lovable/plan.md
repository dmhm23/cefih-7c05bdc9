

# Plan: Crear componente CurrencyInput y aplicarlo globalmente

## Diagnóstico

El campo `valorCupo` en `MatriculaFormPage` usa `<Input type="number">` con `onChange={(e) => field.onChange(Number(e.target.value) || 0)}`. El `|| 0` impide borrar el valor (siempre vuelve a 0), y `type="number"` no permite formato con separador de miles.

Este mismo patrón se repite en todos los campos monetarios de la aplicación.

## Solución

Crear un componente reutilizable `CurrencyInput` que:
- Use `type="text"` (no `number`) para permitir formateo visual
- Formatee automáticamente con separador de miles (punto) al estilo colombiano: `95.000`
- Permita borrar el campo completamente (valor vacío = `undefined` o `0` según contexto)
- Internamente maneje solo dígitos, ignorando caracteres no numéricos
- Exponga `value: number | undefined` y `onChange: (value: number | undefined) => void`

## Campos afectados (7 instancias en 5 archivos)

| Archivo | Campo(s) |
|---------|----------|
| `src/pages/matriculas/MatriculaFormPage.tsx` | `valorCupo` (línea 1263) |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | `valorCupo` y `abono` via `EditableField` (líneas 772-780) |
| `src/components/cartera/RegistrarPagoDialog.tsx` | `valorPago` (línea 106) |
| `src/components/cartera/EditarPagoDialog.tsx` | `valorPago` (línea 106) |
| `src/components/cartera/CrearFacturaDialog.tsx` | `totalFactura` (línea 115) |
| `src/components/cartera/EditarFacturaDialog.tsx` | `editTotal` (línea 113) |
| `src/pages/empresas/EmpresaDetallePage.tsx` | tarifa `Valor` (línea 526) |

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/shared/CurrencyInput.tsx` | **Nuevo.** Componente que acepta `value: number | undefined`, `onChange(v: number | undefined)`, y opcionalmente `placeholder`. Usa `type="text"`, formatea con `toLocaleString('es-CO')` al mostrar, y parsea solo dígitos al editar. Permite vaciar el campo. |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Reemplazar `<Input type="number">` por `<CurrencyInput>` en `valorCupo`. Ajustar `onChange` para pasar `value ?? 0`. |
| `src/components/cartera/RegistrarPagoDialog.tsx` | Reemplazar `<Input type="number">` por `<CurrencyInput>` en `valorPago`. |
| `src/components/cartera/EditarPagoDialog.tsx` | Ídem para `valorPago`. |
| `src/components/cartera/CrearFacturaDialog.tsx` | Ídem para `totalFactura`. |
| `src/components/cartera/EditarFacturaDialog.tsx` | Ídem para `editTotal`. |
| `src/pages/empresas/EmpresaDetallePage.tsx` | Ídem para tarifa valor. |
| `src/components/shared/EditableField.tsx` | Agregar soporte para `type="currency"` que use `CurrencyInput` internamente, para que los campos editables de detalle de matrícula (`valorCupo`, `abono`) se beneficien automáticamente. |

**Total: 1 componente nuevo, 7 archivos editados, 0 migraciones**

