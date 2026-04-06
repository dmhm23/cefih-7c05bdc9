

# Plan: Recalcular grupo de cartera al actualizar valor del cupo en matrícula

## Problema

Cuando se edita el `valorCupo` de una matrícula desde su página de detalle, el cambio se guarda en la tabla `matriculas` pero el grupo de cartera asociado **no se recalcula**. La función `recalcular_grupo_cartera` (que suma los `valor_cupo` de las matrículas vinculadas) solo se invoca al crear la matrícula o al operar con facturas/pagos, nunca al editar el valor del cupo.

El grupo actual tiene `total_valor = 0` mientras las matrículas ya tienen `valor_cupo = 70000` cada una.

## Solución

### Paso 1: Recalcular al guardar cambios en matrícula (código)

En `MatriculaDetallePage.tsx`, modificar `handleSave` para que, después de guardar los cambios de la matrícula, si `valorCupo` fue modificado, busque el grupo de cartera vinculado y llame a `recalcular_grupo_cartera`.

```
handleSave:
  1. await updateMatricula(...)
  2. if formData contiene "valorCupo":
     a. buscar grupo_cartera_id desde grupo_cartera_matriculas
     b. llamar supabase.rpc('recalcular_grupo_cartera', { p_grupo_id })
```

### Paso 2: Migración de datos — recalcular grupos existentes

Ejecutar una migración SQL que recalcule todos los grupos de cartera existentes para sincronizar los valores actuales de las matrículas.

```sql
SELECT public.recalcular_grupo_cartera(id) FROM public.grupos_cartera;
```

## Archivos afectados

| Paso | Archivo | Cambio |
|------|---------|--------|
| 1 | `src/pages/matriculas/MatriculaDetallePage.tsx` | Llamar `recalcular_grupo_cartera` tras editar valorCupo |
| 2 | 1 migración SQL | Recalcular todos los grupos existentes |

**Total: 1 archivo editado, 1 migración**

