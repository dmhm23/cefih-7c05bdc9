

## Fix: Firma digital no se guarda — error en `getTrimmedCanvas`

### Problema

El error en consola es: `(0, import_trim_canvas.default) is not a function`. La librería `react-signature-canvas` tiene un bug de compatibilidad con Vite donde `getTrimmedCanvas()` falla porque la dependencia interna `trim-canvas` no exporta correctamente su default.

### Solución

Reemplazar `getTrimmedCanvas()` por `getCanvas().toDataURL()` en los dos componentes que usan `SignatureCanvas`:

| Archivo | Cambio |
|---|---|
| `src/components/matriculas/FirmaCaptura.tsx` | Línea 24: cambiar `sigRef.current.getTrimmedCanvas().toDataURL(...)` por `sigRef.current.getCanvas().toDataURL(...)` |
| `src/components/personal/FirmaPersonal.tsx` | Línea 33: mismo cambio — `getTrimmedCanvas()` → `getCanvas()` |

Son 2 líneas en total. La firma se guardará correctamente como base64 PNG.

