

## Plan: Auto-marcar "Acepto" al firmar

### Diagnóstico

El flujo actual requiere **dos acciones independientes**: marcar "Acepto" en el radio Y dibujar la firma. Si el usuario solo firma sin marcar "Acepto", `autorizacion` queda `null` y `puedeEnviar` es `false`. Esto es lo que está pasando.

### Cambio

**`src/pages/estudiante/InfoAprendizPage.tsx`** -- modificar `handleFirmaChange` (linea 50-52):

Cuando recibe una firma no vacía, auto-setear `autorizacion = 'acepto'`:

```typescript
const handleFirmaChange = (base64: string) => {
  setFirmaBase64(base64 || null);
  if (base64) {
    setAutorizacion('acepto');
  }
};
```

Esto habilita inmediatamente tanto el botón "Limpiar" (ya funciona) como "Enviar documento" con un solo gesto del usuario.

