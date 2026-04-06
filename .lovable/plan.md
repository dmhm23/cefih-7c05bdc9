

# Plan: Crear grupo de cartera siempre al matricular

## Problema

La condición actual en `MatriculaFormPage.tsx` línea 446 es `if (data.valorCupo > 0 && ...)`, lo que impide crear el grupo de cartera cuando el valor del cupo es 0 o no se diligencia.

## Solución

Cambiar la condición para que siempre se asigne a cartera independientemente del valor del cupo. Solo se requiere que exista el ID de la matrícula creada.

### Archivo: `src/pages/matriculas/MatriculaFormPage.tsx`

- Línea 446: cambiar `if (data.valorCupo > 0 && data.tipoVinculacion && matricula?.id)` por `if (matricula?.id)`
- Si `tipoVinculacion` no está definida, usar `'independiente'` como fallback para el tipo de responsable
- Pasar `valorCupo: data.valorCupo || 0` para que funcione con valor 0

**Total: 1 archivo, 1 cambio de condición**

