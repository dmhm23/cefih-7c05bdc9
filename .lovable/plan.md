

## Plan: Corregir RLS de `curso_consecutivos`

### Problema
La tabla `curso_consecutivos` (consecutivos para autogenerar el número de curso) tiene una política RLS que solo permite escribir a `superadministrador` y `administrador`. Cuando un usuario con rol **Auxiliar** (u otro rol con permiso `cursos.editar`) crea un curso, el trigger `autogenerar_nombre_curso` intenta hacer `INSERT/UPDATE` en `curso_consecutivos` con los permisos del usuario y la RLS lo bloquea.

### Solución
Convertir la función trigger `autogenerar_nombre_curso` a `SECURITY DEFINER` para que el `UPSERT` sobre `curso_consecutivos` se ejecute con los permisos del owner de la función (postgres), sin depender del rol del usuario que crea el curso. Es el patrón estándar para triggers que escriben en tablas de soporte internas.

Adicionalmente, alinear la política RLS de `curso_consecutivos` con el sistema de permisos granular para que sea consistente con el resto (cursos, matriculas, personas usan `has_permission`).

### Cambios técnicos (1 migración SQL)

1. **Recrear `autogenerar_nombre_curso` con `SECURITY DEFINER`** y `SET search_path = public`. Mantener exactamente la misma lógica (UPSERT atómico con `RETURNING`). Esto resuelve el bloqueo inmediatamente sin importar el rol del usuario.

2. **Actualizar la política RLS de `curso_consecutivos`** para usar `has_permission(auth.uid(), 'cursos', 'editar')` en lugar de la lista hardcoded de roles. Así, cualquier usuario con permiso para gestionar cursos puede operar (aunque el trigger ya bypassa esto, mantiene la coherencia del modelo).

```sql
DROP POLICY "Admin gestiona curso_consecutivos" ON public.curso_consecutivos;

CREATE POLICY "Usuarios con permiso gestionan curso_consecutivos"
ON public.curso_consecutivos FOR ALL TO authenticated
USING (has_permission(auth.uid(), 'cursos', 'editar'))
WITH CHECK (has_permission(auth.uid(), 'cursos', 'editar'));
```

### Validación post-cambio
- El usuario "Alturas" (rol Auxiliar con permiso `cursos.editar`) debe poder crear un curso completo sin error de RLS.
- El número de curso debe seguir generándose correctamente con el patrón configurado en el nivel de formación (`prefijo-tipo-AA-MM-NN`).
- Los administradores y superadministradores deben mantener su capacidad de crear cursos sin cambios.

### Sin impacto en otras áreas
- No se modifica la lógica de generación del consecutivo.
- No se cambia el esquema de la tabla.
- No afecta cursos ya creados.

