

# Plan: Eliminar toggle `activo` redundante en empresas y corregir filtro del dropdown

## Diagnóstico

El log de auditoría confirma que `activo` se está estableciendo en `false` cuando se edita una empresa desde `EmpresaFormPage`. El formulario tiene un Switch para "Estado" (`activo`) que siempre envía su valor en cada guardado (`activo: data.activo`). Si el usuario lo deja en OFF (intencionalmente o no), la empresa queda con `activo = false`.

El campo `activo` en empresas es redundante: el sistema ya usa `deleted_at IS NULL` para filtrar empresas eliminadas (soft delete). La función `empresaService.delete()` ya establece `deleted_at` Y `activo = false` juntos. Tener un toggle manual adicional solo introduce inconsistencias.

Las 3 empresas no eliminadas actualmente tienen `activo = false` por esta causa, y `MatriculaFormPage` las filtra con `.filter(e => e.activo !== false)`, dejando el dropdown vacío.

## Solución

1. Eliminar el Switch de "Estado" (`activo`) del formulario `EmpresaFormPage` para evitar que el usuario cambie este campo manualmente.
2. Dejar de enviar `activo` en las operaciones de creación y edición (excepto en soft delete).
3. Eliminar el filtro `e.activo !== false` de `MatriculaFormPage`, ya que `empresaService.getAll()` ya filtra por `deleted_at IS NULL`.
4. Corregir las 3 empresas afectadas restaurando `activo = true`.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/pages/empresas/EmpresaFormPage.tsx` | Eliminar el campo `activo` del schema Zod, de `defaultValues`, de `useEffect` reset, del `onSubmit`, y eliminar el bloque JSX del Switch (líneas 278-294). |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Eliminar `.filter(e => e.activo !== false)` en línea 1039; usar la lista completa de empresas (ya filtrada por `deleted_at IS NULL` desde el servicio). |
| Migración SQL | `UPDATE empresas SET activo = true WHERE deleted_at IS NULL AND activo = false;` para restaurar las empresas afectadas. |

**Total: 2 archivos editados, 1 operación de datos**

