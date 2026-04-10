# Plan: Gestión completa de usuarios (editar, reiniciar contraseña, eliminar)

## Diagnóstico

Actualmente `UsuariosTab.tsx` solo permite crear usuarios y cambiar su rol. No existe funcionalidad para editar datos (nombres), reiniciar contraseñas ni eliminar usuarios. Además, la Edge Function `admin-gestionar-roles` solo acepta acciones sobre roles, no sobre usuarios. El `AdminGuard` solo permite acceso a superadministradores.

## Solución

### 1. Ampliar la Edge Function existente

Extender `admin-gestionar-roles` (que ya maneja autenticación y autorización) con 3 nuevas acciones para usuarios:

- `**update-user**`: Actualiza nombres en `perfiles` y email en `auth.users`
- `**reset-password**`: Genera una contraseña temporal usando `auth.admin.updateUser()` y la retorna
- `**delete-user**`: Elimina el usuario de `auth.users` (cascade elimina `perfiles` automáticamente)

La lógica de permisos en la Edge Function:

- Se obtiene el rol del caller y del usuario objetivo
- **Superadministrador**: puede operar sobre cualquier usuario excepto sobre sí mismo
- **Administrador**: solo puede operar sobre usuarios con rol `operador` o roles custom (no sistema). No puede tocar superadministradores ni otros administradores
- Ningún usuario puede eliminarse a sí mismo

### 2. Ampliar el AdminGuard

Permitir acceso al panel admin tanto a `superadministrador` como a `administrador`, ya que los administradores también necesitan gestionar usuarios según las reglas.

### 3. Actualizar la UI de usuarios

Agregar a cada fila de la tabla:

- Botón **editar** (abre diálogo para cambiar nombres)
- Botón **reiniciar contraseña** (muestra la contraseña temporal generada)
- Botón **eliminar** (con confirmación, visible solo si el usuario tiene permiso según su rol)

Se crearán dos diálogos nuevos:

- `EditarUsuarioDialog`: formulario para editar nombres del usuario
- `ResetPasswordDialog`: muestra la contraseña temporal generada tras el reinicio

## Cambios


| Archivo                                             | Cambio                                                                                                                                                                                                                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `supabase/functions/admin-gestionar-roles/index.ts` | Cambiar validación de permisos: permitir `superadministrador` y `administrador` (con restricciones jerárquicas). Agregar acciones `update-user`, `reset-password` y `delete-user` con validación de jerarquía de roles                                                  |
| `src/components/guards/AdminGuard.tsx`              | Permitir acceso a `administrador` además de `superadministrador`                                                                                                                                                                                                        |
| `src/services/rolesService.ts`                      | Agregar métodos `updateUser()`, `resetPassword()`, `deleteUser()` que invocan las nuevas acciones de la Edge Function                                                                                                                                                   |
| `src/hooks/useRoles.ts`                             | Agregar mutations `updateUser`, `resetPassword`, `deleteUser`                                                                                                                                                                                                           |
| `src/components/admin/UsuariosTab.tsx`              | Agregar columna de acciones con botones editar/reiniciar/eliminar. Agregar diálogos inline para edición, confirmación de eliminación y visualización de contraseña temporal. Filtrar acciones visibles según el rol del usuario logueado vs el rol del usuario objetivo |


**Total: 5 archivos editados, 0 archivos nuevos, 0 migraciones**