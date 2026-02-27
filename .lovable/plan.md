

## Fix: Botón "Guardar Firma" no funciona

### Causa raiz

El metodo `sigRef.current.isEmpty()` de `react-signature-canvas` usa internamente `trimCanvas`, la misma funcion que causa el error `(0, import_trim_canvas.default) is not a function`. Por eso el boton "Guardar Firma" falla silenciosamente.

### Solucion

Reemplazar `sigRef.current.isEmpty()` por el estado local `isEmpty` que ya se trackea via `onBegin`. Esto aplica a los 2 archivos que usan `SignatureCanvas`:

| Archivo | Cambio |
|---|---|
| `src/components/matriculas/FirmaCaptura.tsx` | Linea 23: cambiar `if (sigRef.current && !sigRef.current.isEmpty())` por `if (sigRef.current && !isEmpty)` |
| `src/components/personal/FirmaPersonal.tsx` | Linea 33: mismo cambio — `!sigRef.current.isEmpty()` → `!isEmpty` |

Son 2 lineas. El estado `isEmpty` ya se pone en `false` cuando el usuario empieza a dibujar (`onBegin`), por lo que es funcionalmente equivalente.

