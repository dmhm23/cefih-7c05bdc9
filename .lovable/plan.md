

# Fix: Permitir eliminación de cursos según permisos del rol

## Problema
La tabla `cursos` tiene la política `"Admin gestiona cursos"` hardcodeada a solo `superadministrador` y `administrador`. El rol Auxiliar con permiso `cursos:eliminar` no puede hacer soft-delete.

## Solución
Reemplazar la política RLS por una basada en `has_permission()`, igual que se hizo para `personas`, `empresas`, `matriculas` y `documentos_matricula`.

### Migración SQL

```sql
DROP POLICY "Admin gestiona cursos" ON public.cursos;

CREATE POLICY "Usuarios con permiso gestionan cursos"
  ON public.cursos FOR ALL TO authenticated
  USING (public.has_permission(auth.uid(), 'cursos', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'cursos', 'editar'));
```

### Recurso a modificar

| Recurso | Cambio |
|---|---|
| Nueva migración SQL | Reemplazar política RLS de `cursos` para usar `has_permission()` |

