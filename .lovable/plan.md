

# Fix: Auxiliar no puede eliminar (soft-delete) personas ni empresas

## Diagnóstico

Las tablas `personas` y `empresas` tienen la política `"Admin gestiona..."` que solo permite UPDATE/INSERT/DELETE a `superadministrador` y `administrador`. El rol Auxiliar, aunque tenga permisos `personas:editar` y `empresas:editar`, es bloqueado por RLS. La operación de soft-delete (UPDATE de `deleted_at`) falla silenciosamente.

## Solución

Reemplazar las políticas RLS hardcodeadas por políticas basadas en `has_permission()`, igual que se hizo para `matriculas` y `documentos_matricula`.

### Migración SQL

```sql
-- personas
DROP POLICY "Admin gestiona personas" ON public.personas;
CREATE POLICY "Usuarios con permiso gestionan personas"
  ON public.personas FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'personas', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'personas', 'editar'));

-- empresas
DROP POLICY "Admin gestiona empresas" ON public.empresas;
CREATE POLICY "Usuarios con permiso gestionan empresas"
  ON public.empresas FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'empresas', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'empresas', 'editar'));
```

### Por qué es seguro

- `has_permission()` es `SECURITY DEFINER` y valida contra `rol_permisos`
- Superadmin retorna `TRUE` para todo
- Solo los roles con permiso explícito `personas:editar` o `empresas:editar` podrán modificar datos
- Las políticas SELECT existentes no se tocan — todos los autenticados siguen pudiendo leer

### Recurso a modificar

| Recurso | Cambio |
|---|---|
| Nueva migración SQL | Reemplazar políticas RLS de `personas` y `empresas` para usar `has_permission()` |

