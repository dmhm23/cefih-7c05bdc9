

# Fix: Rol Auxiliar no puede persistir documentos de requisitos

## Diagnóstico

El problema tiene **dos puntos de fallo**:

1. **RLS en tabla `documentos_matricula`**: La política de escritura (`Admin gestiona documentos_matricula`) solo permite UPDATE/INSERT/DELETE a `superadministrador` y `administrador`. El rol "Auxiliar", aunque tiene permisos `matriculas:editar`, es bloqueado por RLS al intentar actualizar el registro del documento tras subirlo.

2. **El archivo sí se sube a Storage** (la política `Autenticados suben archivos` permite a cualquier autenticado subir), pero el UPDATE posterior en `documentos_matricula` para registrar el path, nombre y estado falla silenciosamente por RLS. Resultado: archivo huérfano en storage, registro sin cambios en la tabla.

## Solución

Reemplazar la política RLS hardcodeada de `documentos_matricula` por una que use la función `has_permission()` ya existente. Lo mismo aplica para la tabla `matriculas`, que también tiene políticas hardcodeadas a solo admin/superadmin.

### Cambios en base de datos (migración SQL)

**Tabla `documentos_matricula`** — reemplazar política ALL:

```sql
-- Eliminar política restrictiva actual
DROP POLICY "Admin gestiona documentos_matricula" ON public.documentos_matricula;

-- Nueva política: usuarios con permiso matriculas:editar pueden gestionar
CREATE POLICY "Usuarios con permiso gestionan documentos_matricula"
  ON public.documentos_matricula FOR ALL
  TO authenticated
  USING (public.has_permission(auth.uid(), 'matriculas', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'matriculas', 'editar'));
```

**Tabla `matriculas`** — misma corrección:

```sql
DROP POLICY "Admin gestiona matriculas" ON public.matriculas;

CREATE POLICY "Usuarios con permiso gestionan matriculas"
  ON public.matriculas FOR ALL
  TO authenticated
  USING (public.has_permission(auth.uid(), 'matriculas', 'editar'))
  WITH CHECK (public.has_permission(auth.uid(), 'matriculas', 'editar'));
```

### Por qué esto es seguro

- `has_permission()` es `SECURITY DEFINER` y ya valida contra `rol_permisos`
- El rol Auxiliar tiene explícitamente `matriculas:editar`, así que pasará la verificación
- Superadmin retorna `TRUE` para todo dentro de `has_permission()`
- No se cambia código del frontend, solo las políticas de acceso en la base de datos

### Archivo a modificar

| Recurso | Cambio |
|---|---|
| Nueva migración SQL | Reemplazar políticas RLS de `documentos_matricula` y `matriculas` para usar `has_permission()` en lugar de roles hardcodeados |

