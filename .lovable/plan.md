

# Plan: Agregar opción de limpiar selección en campos Curso y Nivel Previo

## Diagnóstico

Ambos campos (`cursoId` línea 779 y `nivelPrevio` línea 1290) usan el componente `Select` de Radix, que no permite deseleccionar un valor una vez elegido. No existe un mecanismo de "limpiar" ni una opción vacía.

## Solución

Agregar un botón de limpiar (icono X) junto a cada `Select` cuando tiene un valor seleccionado. Al hacer clic, se resetea el campo a `""`.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/matriculas/MatriculaFormPage.tsx` | Para los campos `cursoId` (línea 773-796) y `nivelPrevio` (línea 1284-1307): envolver cada `Select` en un contenedor `relative` y agregar un botón con icono `X` que aparezca condicionalmente cuando `field.value` tiene valor. Al hacer clic, ejecutar `field.onChange("")`. |

**Total: 1 archivo editado, 0 migraciones**

