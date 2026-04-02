

## Plan: Corregir UX del diálogo de navegación en MatriculaFormPage

### Problema

Cuando el usuario hace clic en "Descartar", `handleNavConfirmDiscard` ejecuta `navigate(path)`, pero `hasUnsavedData` sigue siendo `true` (el formulario sigue dirty). Esto hace que el interceptor de `pushState` capture nuevamente la navegación y vuelva a abrir el diálogo — quedando atrapado en un loop.

En `MatriculaDetallePage` esto ya funciona bien porque `handleNavDiscard` resetea el estado dirty antes de navegar.

### Solución

Agregar un flag `skipNavGuard` tipo `useRef<boolean>` que se activa justo antes de navegar en "Descartar". El interceptor de `pushState` verificará este flag y dejará pasar la navegación cuando esté activo.

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/pages/matriculas/MatriculaFormPage.tsx` | Agregar `useRef` para bypass; usarlo en `handleNavConfirmDiscard` y `handleNavConfirmSave`; verificarlo en el interceptor de `pushState` |

### Detalle técnico

1. Agregar `const skipNavGuardRef = useRef(false);`
2. En el interceptor de `pushState`, antes de bloquear: `if (skipNavGuardRef.current) return orig.call(...)` — dejar pasar
3. En `handleNavConfirmDiscard`: activar `skipNavGuardRef.current = true` antes de `navigate(path)`
4. En `handleNavConfirmSave`: activar `skipNavGuardRef.current = true` antes de `navigate(path)`

Esto es más limpio que intentar resetear `form.reset()` porque react-hook-form no actualiza `isDirty` sincrónicamente.

