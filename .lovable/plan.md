
# Plan: Conectar creación de matrícula con el módulo de Cartera

## Diagnóstico

La función `asignarMatriculaACartera()` existe en `carteraService.ts` y contiene toda la lógica para crear responsables de pago, grupos de cartera y vincular matrículas. Sin embargo, **nunca es invocada** desde ningún punto de la aplicación. Por eso:

- Las 2 matrículas existentes (tipo empresa, con Gerenciar SAS) tienen `valor_cupo = 0` y no generaron grupo de cartera.
- La tabla `grupos_cartera` está vacía.
- La tabla `grupo_cartera_matriculas` está vacía.

Además, el formulario de matrícula no tiene campo para `valorCupo`, así que siempre se guarda con valor 0.

## Solución

### Paso 1: Agregar campo `valorCupo` al formulario de matrícula

En `MatriculaFormPage.tsx`, agregar un campo numérico "Valor del cupo" en la sección de vinculación laboral / cobros. Incluirlo en el schema de Zod y en el `onSubmit`.

### Paso 2: Llamar `asignarMatriculaACartera` al crear matrícula

En `MatriculaFormPage.tsx`, después de crear la matrícula exitosamente, invocar `asignarMatriculaACartera` con los datos del formulario (matriculaId, valorCupo, tipoVinculacion, empresa, persona). Esto creará automáticamente el responsable de pago y el grupo de cartera.

### Paso 3: Llamar `asignarMatriculaACartera` al editar `valorCupo`

En `MatriculaDetallePage.tsx`, cuando se edita el `valorCupo`, verificar si la matrícula ya tiene grupo de cartera asignado; si no, llamar a `asignarMatriculaACartera` para crearla. Si ya existe, recalcular el grupo.

### Paso 4: Agregar un hook `useAsignarCartera` para encapsular la llamada

Crear un mutation hook que encapsule `asignarMatriculaACartera` y se pueda reusar desde el formulario y el detalle.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/pages/matriculas/MatriculaFormPage.tsx` | Agregar campo valorCupo, llamar asignarMatriculaACartera post-creación |
| `src/hooks/useCartera.ts` | Agregar hook `useAsignarCartera` |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Trigger asignación a cartera al editar valorCupo si no hay grupo |

**Total: 3 archivos editados, 0 migraciones**
