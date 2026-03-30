

## Plan: Confirmar antes de salir del editor con cambios sin guardar

### Enfoque

Usar dos mecanismos complementarios:

1. **Navegacion interna (React Router)**: Interceptar con `useBlocker` de react-router-dom v6. Cuando `isDirty` es `true`, bloquear la navegacion y mostrar un `ConfirmDialog` (ya existe en `src/components/shared/ConfirmDialog.tsx`) preguntando si desea guardar o descartar.

2. **Cierre de pestana / recarga**: Usar el evento `beforeunload` del navegador para mostrar el dialogo nativo del browser cuando `isDirty` es `true`.

### Cambios

**`src/pages/formatos/FormatoEditorPage.tsx`**

- Importar `useBlocker` de `react-router-dom` y `ConfirmDialog` de `@/components/shared/ConfirmDialog`
- Crear blocker: `const blocker = useBlocker(store.isDirty)`
- Renderizar `ConfirmDialog` condicionado a `blocker.state === 'blocked'`:
  - Titulo: "Cambios sin guardar"
  - Descripcion: "Tienes cambios sin guardar. Si sales ahora, se perderan."
  - Boton confirmar: "Salir sin guardar" (variant destructive) → `blocker.proceed()`
  - Boton cancelar: "Seguir editando" → `blocker.reset()`
- Agregar `useEffect` para `beforeunload`:
  ```
  useEffect(() => {
    if (!store.isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [store.isDirty]);
  ```
- Tras guardar exitosamente (`handleSave`), `markClean()` ya se llama, lo que desactivara ambos mecanismos automaticamente

### Archivo afectado

| Archivo | Cambio |
|---|---|
| `src/pages/formatos/FormatoEditorPage.tsx` | `useBlocker` + `ConfirmDialog` + `beforeunload` listener |

