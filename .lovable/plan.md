# Plan: Mostrar mensaje específico en error de tarifa duplicada

## Problema

En `EmpresaDetallePage.tsx` línea 213, el `catch` muestra un mensaje genérico "Error al guardar tarifa" sin inspeccionar el error. El servicio `empresaService.createTarifa` ya lanza un `ApiError` con mensaje específico ("Ya existe una tarifa para esta combinación...") y código `TARIFA_DUPLICADA`, pero el catch lo ignora.

## Solución

Modificar el `catch` en `handleSaveTarifa` (línea 213) para extraer el mensaje del error y mostrarlo al usuario:

```typescript
} catch (err: any) {
  const msg = err?.message || "Error al guardar: ya existe una tarifa para este nivel..."";
  toast({ title: msg, variant: "destructive" });
}
```

## Archivo afectado


| Archivo                                     | Cambio                                               |
| ------------------------------------------- | ---------------------------------------------------- |
| `src/pages/empresas/EmpresaDetallePage.tsx` | Usar `err.message` en el catch de `handleSaveTarifa` |


**Total: 1 archivo editado, 0 migraciones**