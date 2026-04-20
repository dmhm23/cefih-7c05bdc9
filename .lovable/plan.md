

## Plan: Corregir "Cannot coerce the result to a single JSON object" al editar cursos

### Diagnóstico

El error ocurre por **dos bugs combinados** en `src/services/cursoService.ts → update()`:

**Bug 1 — `numeroCurso` no se mapea a la columna `nombre`:**
El campo "Número del Curso" en la UI escribe en `formData.numeroCurso`, pero el service solo lee `data.nombre`. El cambio se descarta silenciosamente.

**Bug 2 — UPDATE con payload vacío + `.single()`:**
Cuando el usuario edita solo campos que no se mapean a columnas reales (`numeroCurso`, `entrenadorNombre`, `supervisorNombre`, o `tipoFormacion` cuando se omite por validación de enum), el objeto `dbData` queda en `{}`. PostgREST ejecuta `UPDATE ... SET () WHERE id=...` → no devuelve filas → `.single()` lanza `PGRST116: Cannot coerce the result to a single JSON object`.

### ¿Afecta a otros campos?

Sí, el error se reproduce siempre que **todos** los campos editados sean uno de estos:
- `numeroCurso` (no mapeado — bug 1)
- `entrenadorNombre` / `supervisorNombre` (campos derivados, no van a BD)
- `tipoFormacion` con valor inválido (omitido por la validación de enum)

**No falla** cuando se edita junto a algún campo válido (fechas, duración, capacidad, entrenador_id, supervisor_id, nivel_formacion_id, estado), porque entonces `dbData` no está vacío.

### Solución (1 archivo)

**`src/services/cursoService.ts` → función `update`:**

1. **Mapear `numeroCurso` → `nombre`** para que el cambio se persista. El trigger `autogenerar_nombre_curso` ya respeta nombres no vacíos en INSERT; en UPDATE no se ejecuta el trigger BEFORE INSERT, así que la edición manual del número se persiste sin generar nuevo consecutivo.

2. **Ignorar campos derivados** (`entrenadorNombre`, `supervisorNombre`) — son snapshots reconstruidos desde el JOIN.

3. **Guardar contra UPDATE vacío:** si tras filtrar `dbData` queda sin claves, no llamar al UPDATE — devolver el curso actual con `getById(id)`. Esto evita el error PGRST116 y comunica el éxito sin operación inútil.

```ts
// Pseudo-código del fix
if (data.numeroCurso !== undefined) dbData.nombre = data.numeroCurso;
if (data.nombre !== undefined) dbData.nombre = data.nombre; // legacy fallback
// (entrenadorNombre / supervisorNombre se ignoran intencionalmente)

if (Object.keys(dbData).length === 0) {
  const curso = await cursoService.getById(id);
  if (!curso) throw new ApiError('Curso no encontrado', 404);
  return curso;
}
// ...UPDATE normal con .single()
```

### Validación post-cambio

- Editar **solo** "Número del curso" y guardar → debe persistir el nuevo número sin error.
- Editar solo entrenador o supervisor → debe persistir el ID y refrescar el nombre desde el JOIN.
- Editar varios campos a la vez (caso ya funcional) → sigue funcionando.
- El número editado manualmente debe aparecer en la columna "Curso" del listado y en el header del detalle.
- El trigger de autogeneración no se dispara en UPDATE, así que no se consume un consecutivo extra.

### Sin impacto adicional

- No requiere migración SQL.
- No modifica la lógica del trigger `autogenerar_nombre_curso` ni la tabla `curso_consecutivos`.
- No afecta el flujo de creación de cursos.

