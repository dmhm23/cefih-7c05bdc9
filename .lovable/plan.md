
# Plan: Corregir error UUID al crear matrícula

## Problema raíz

`formToRow()` en `matriculaService.ts` convierte todos los campos a snake_case pero **no limpia strings vacíos (`''`) en columnas UUID**. El formulario envía `cursoId: ''` y `empresaId: ''` cuando no se seleccionan, y Postgres rechaza `''` como UUID inválido.

Además, el campo `empresaContactoId` del schema del formulario no existe en la tabla `matriculas` de la DB y se filtra al INSERT.

## Solución

### 1. `src/services/matriculaService.ts` — Sanitizar `formToRow`

Agregar limpieza en `formToRow()`:
- Convertir strings vacíos (`''`) a `null` para los campos UUID conocidos: `curso_id`, `empresa_id`, `persona_id`
- Eliminar el campo `empresa_contacto_id` que no existe en la tabla
- Eliminar cualquier campo con valor `undefined` del objeto final (prevención)

### 2. `src/pages/matriculas/MatriculaFormPage.tsx` — Limpiar valores en `onSubmit`

- Cambiar `cursoId: data.cursoId || ''` → `cursoId: data.cursoId || undefined` (línea 402)
- Asegurar que `empresaId` y otros campos UUID opcionales envíen `undefined` en lugar de `''`
- Eliminar `empresaContactoId` del objeto que se pasa a `createMatricula`

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/services/matriculaService.ts` | Sanitizar UUIDs vacíos en `formToRow` |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Enviar `undefined` en vez de `''` para UUIDs |
