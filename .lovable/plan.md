

# Plan: Evitar que botones de adjuntos disparen el envío del formulario

## Problema

Los botones de **Vista previa**, **Descargar** y **Eliminar** dentro del componente `AdjuntosPersonal` no tienen el atributo `type="button"`. En HTML, los botones dentro de un `<form>` tienen `type="submit"` por defecto. Al hacer clic en "Vista previa", el navegador envía el formulario, lo que ejecuta `onSubmit`, crea el perfil y redirige al listado.

## Solución

Agregar `type="button"` a todos los botones interactivos dentro de `AdjuntosPersonal.tsx` que están dentro del formulario: los botones de Vista previa (Eye), Descargar (Download), Eliminar (Trash2), Abrir en nueva pestaña (ExternalLink) y Cerrar preview (X).

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/components/personal/AdjuntosPersonal.tsx` | Agregar `type="button"` a los 5 botones interactivos (líneas 107, 117, 127, 149, 157) |

**Total: 1 archivo editado, 0 migraciones**

