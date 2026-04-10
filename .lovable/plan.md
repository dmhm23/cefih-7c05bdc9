

# Plan: Auto-diligenciar "Responsable del Registro" con el usuario actual

## Diagnóstico

El campo "Responsable del Registro" en MinTrabajo es un input manual (`Input` editable), mientras que "Agregada por" en fechas adicionales se resuelve automáticamente desde el `user_id` del usuario autenticado consultando la tabla `perfiles`.

El campo responsable se guarda como texto plano en `observaciones` JSON (`minTrabajoResponsable`). Para que sea automático, debe capturarse el nombre del usuario logueado al momento de guardar, igual que `created_by` en fechas adicionales.

## Cambios

| Archivo | Cambio |
|---------|--------|
| `src/services/cursoService.ts` | En `actualizarMinTrabajo()`: obtener el usuario autenticado con `supabase.auth.getUser()`, consultar su nombre desde `perfiles`, y asignar automáticamente `obs.minTrabajoResponsable` con ese nombre (ignorando el valor enviado desde el frontend). |
| `src/components/cursos/MinTrabajoCard.tsx` | Convertir el campo "Responsable del Registro" de `Input` editable a texto de solo lectura que muestre `curso.minTrabajoResponsable` (o "Sin asignar" si está vacío). Eliminar el estado local `responsable` y su lógica de `setDirty`. El valor se llenará automáticamente al guardar el registro/fecha. |

**Total: 2 archivos editados, 0 migraciones**

