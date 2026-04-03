

## Plan: Corregir diálogo falso de "Cambios sin guardar" al guardar matrícula

### Problema

Al guardar exitosamente una matrícula (nueva o editada), `onSubmit` llama `navigate("/matriculas")` sin activar el flag `skipNavGuardRef`. Como el formulario sigue marcado como dirty en ese momento, el interceptor de `pushState` bloquea la navegación y muestra el diálogo de "Cambios sin guardar" incorrectamente.

### Solución

Agregar `skipNavGuardRef.current = true` justo antes de `navigate("/matriculas")` en la función `onSubmit` de `MatriculaFormPage.tsx`. Mismo patrón que ya se usa en `handleNavConfirmDiscard` y `handleNavConfirmSave`.

Verificar si `MatriculaDetallePage.tsx` tiene el mismo problema en su lógica de guardado.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/pages/matriculas/MatriculaFormPage.tsx` | Agregar `skipNavGuardRef.current = true` antes de `navigate` en `onSubmit` (línea ~438) |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Verificar y aplicar el mismo fix si aplica |

### Detalle técnico

```typescript
// En onSubmit, antes de navigate:
skipNavGuardRef.current = true;
navigate("/matriculas");
```

Es una corrección de una línea por archivo.

