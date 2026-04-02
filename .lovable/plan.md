

## Plan: Interceptar navegación del sidebar en protección de matrículas

### Problema

El sidebar usa `navigate()` dentro de `<button onClick>`, no enlaces `<a href>`. El interceptor actual solo captura clics en `<a>` tags, por lo que la navegación desde el menú lateral no se intercepta.

### Solución

Reemplazar la estrategia de interceptación: en vez de escuchar clics en `<a>`, sobrescribir temporalmente `window.history.pushState` y `window.history.replaceState` para capturar cualquier navegación programática (incluyendo `navigate()` de React Router).

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/pages/matriculas/MatriculaFormPage.tsx` | Reemplazar interceptor de clics en `<a>` por interceptor de `pushState`/`replaceState` |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Mismo cambio |

### Detalle técnico

Eliminar el useEffect que escucha `click` en `<a>` tags. Reemplazar con un useEffect que:

1. Guarda referencia a `history.pushState` y `history.replaceState` originales
2. Los sobrescribe con wrappers que, antes de ejecutar, verifican si hay cambios sin guardar
3. Si hay cambios, bloquea la navegación y guarda la URL destino en `pendingNavPath`
4. Si no hay cambios, ejecuta la función original normalmente
5. En cleanup, restaura las funciones originales

```typescript
useEffect(() => {
  if (!hasUnsavedData) return;
  const origPush = history.pushState.bind(history);
  const origReplace = history.replaceState.bind(history);
  
  const intercept = (orig: typeof history.pushState) => 
    function(this: History, data: any, unused: string, url?: string | URL | null) {
      if (url && typeof url === 'string') {
        setPendingNavPath(url);
        return; // block
      }
      return orig.call(this, data, unused, url);
    };
  
  history.pushState = intercept(origPush);
  history.replaceState = intercept(origReplace);
  
  return () => {
    history.pushState = origPush;
    history.replaceState = origReplace;
  };
}, [hasUnsavedData]);
```

Los useEffects de `beforeunload` y `popstate` se mantienen sin cambios. El `handleNavConfirmDiscard` sigue usando `navigate(path)` que funcionará porque en ese momento ya se habrá restaurado o el store estará limpio.

