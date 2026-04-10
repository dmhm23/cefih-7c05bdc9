

# Plan: Agregar toggle de visibilidad de contraseña en creación de usuario

## Diagnóstico

En `UsuariosTab.tsx` líneas 78-80, el campo de contraseña usa `type="password"` fijo sin opción para alternar visibilidad.

## Solución

Agregar un botón con ícono ojo (`Eye`/`EyeOff` de lucide-react) dentro del campo de contraseña para alternar entre `type="password"` y `type="text"`.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/components/admin/UsuariosTab.tsx` | Agregar estado `showPassword`, envolver el `Input` de contraseña en un `div relative`, agregar botón con ícono `Eye`/`EyeOff` posicionado a la derecha del input, alternar `type` entre `"password"` y `"text"` según el estado |

**Total: 1 archivo, 0 migraciones**

