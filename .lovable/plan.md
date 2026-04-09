

# Plan: Habilitar edición del número de documento en vista ampliada

## Problema

En `PersonaFormPage.tsx` línea 219, el campo "No. Documento" tiene `disabled={isEditing}`, lo que lo bloquea en modo edición. Sin embargo, el panel lateral (`PersonaDetailSheet`) sí permite editarlo.

## Solución

Eliminar `disabled={isEditing}` del `<Input>` del campo `numeroDocumento`.

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/personas/PersonaFormPage.tsx` | Quitar `disabled={isEditing}` en línea 219 |

**Total: 1 archivo editado, 0 migraciones**

