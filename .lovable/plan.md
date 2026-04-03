

# Plan: Sistema de Roles y Permisos con Superadministrador

## Contexto actual

- `perfiles.rol` es un campo TEXT con valores `'admin'` y `'global'`
- `get_my_rol()` retorna ese texto para las políticas RLS
- No existe tabla de roles ni permisos — todo está hardcoded
- El panel admin (`/admin/dashboard`) solo tiene creación de usuarios

## Arquitectura propuesta

```text
roles                     rol_permisos                 perfiles
┌──────────────┐          ┌──────────────────┐         ┌──────────┐
│ id (PK)      │◄─────────│ rol_id (FK)      │         │ id       │
│ nombre       │          │ modulo           │         │ rol_id ──│──► roles.id
│ descripcion  │          │ accion           │         │ email    │
│ es_sistema   │          │ PK(rol_id,mod,ac)│         │ nombres  │
│ created_at   │          └──────────────────┘         └──────────┘
└──────────────┘
```

### Roles del sistema (protegidos, no eliminables)

| Rol | Propósito |
|-----|-----------|
| `superadministrador` | Acceso total + gestión de roles/usuarios. Solo accede via `/admin` |
| `administrador` | Acceso total a módulos operativos (sin gestión de roles) |
| `operador` | Rol configurable con permisos por módulo |

### Catálogo de módulos y acciones

| Módulo | Acciones posibles |
|--------|------------------|
| `dashboard` | ver |
| `matriculas` | ver, crear, editar, eliminar |
| `cursos` | ver, crear, editar, eliminar |
| `cartera` | ver, crear, editar, eliminar |
| `personal` | ver, crear, editar, eliminar |
| `formatos` | ver, crear, editar, eliminar |
| `niveles` | ver, crear, editar, eliminar |
| `portal_estudiante` | ver, editar |
| `personas` | ver, crear, editar, eliminar |
| `empresas` | ver, crear, editar, eliminar |
| `certificacion` | ver, crear, editar, eliminar |

### Reglas de negocio para roles

1. **Roles de sistema** (`es_sistema = true`): `superadministrador` y `administrador` no se pueden eliminar ni renombrar
2. **No se puede eliminar un rol** que tiene usuarios asignados — primero deben reasignarse
3. **`superadministrador`** tiene implícitamente TODOS los permisos (no se almacenan en `rol_permisos`, se evalúan por convención)
4. **`administrador`** tiene todos los permisos operativos de módulos, pero NO acceso a gestión de roles
5. Los roles personalizados (ej: "Asistente Cartera") tienen solo los permisos asignados vía checkboxes

---

## Paso 1 — Migración SQL

- Crear tabla `roles` (id, nombre UNIQUE, descripcion, es_sistema BOOL, created_at)
- Crear tabla `rol_permisos` (rol_id FK CASCADE, modulo TEXT, accion TEXT, PK compuesto)
- Insertar roles de sistema: `superadministrador`, `administrador`
- Insertar rol `operador` como rol por defecto configurable
- Agregar `rol_id UUID` a `perfiles` con FK a `roles`
- Migrar datos: usuarios con `rol='admin'` → `rol_id` del superadministrador, `rol='global'` → `rol_id` del administrador
- Eliminar columna `perfiles.rol`
- Actualizar `get_my_rol()` → retorna `roles.nombre` via JOIN
- Crear función `has_permission(p_user_id, p_modulo, p_accion)` SECURITY DEFINER que retorna TRUE si el usuario tiene ese permiso (o si es superadmin/admin)
- Crear función `get_user_permissions(p_user_id)` que retorna todos los permisos del usuario
- RLS en `roles` y `rol_permisos`: SELECT para autenticados, ALL solo para superadministrador
- Trigger de auditoría en ambas tablas

## Paso 2 — Edge Function: `admin-gestionar-roles`

- CRUD de roles vía service role (para bypasear RLS)
- Validaciones:
  - No eliminar roles con `es_sistema = true`
  - No eliminar roles con usuarios asignados (retorna conteo)
  - Al crear rol, insertar permisos seleccionados
  - Al editar, reemplazar permisos (DELETE + INSERT)
- Endpoints: `create`, `update`, `delete`, `assign-role-to-user`

## Paso 3 — Actualizar Edge Function `admin-crear-usuario`

- Aceptar `rol_id` en vez de asignar siempre `'global'`
- Validar que el rol_id existe
- Actualizar `perfiles.rol_id` después de crear usuario

## Paso 4 — Servicios y tipos frontend

- Crear `src/types/roles.ts`: interfaces `Rol`, `Permiso`, `PermisoModulo`
- Crear `src/services/rolesService.ts`: invoca edge function para CRUD de roles y asignación
- Crear `src/hooks/useRoles.ts`: queries y mutations con React Query

## Paso 5 — UI: Panel Admin → Módulo Roles y Permisos

- Expandir `AdminDashboardPage` con tabs: **Usuarios** (actual) + **Roles y Permisos** (nuevo)
- **Tab Roles y Permisos**:
  - Tabla con roles existentes (nombre, descripcion, usuarios asignados, es_sistema badge)
  - Botón "Crear Rol" → Dialog con nombre, descripción y grilla de checkboxes por módulo×acción
  - Editar rol → misma grilla, preseleccionada con permisos actuales
  - Eliminar rol → ConfirmDialog que muestra usuarios afectados si existen, bloquea si es_sistema
- **Tab Usuarios** (mejora):
  - Selector de rol al crear usuario (dropdown con roles disponibles)
  - Lista de usuarios existentes con su rol asignado
  - Botón para cambiar rol de usuario

## Paso 6 — Integrar permisos en navegación y guards

- Actualizar `AuthContext` para cargar permisos del usuario al login
- Crear hook `usePermission(modulo, accion)` que retorna boolean
- Actualizar `AppSidebar`: mostrar/ocultar items según permisos de `ver`
- Actualizar `AuthGuard`/páginas: verificar permiso antes de renderizar
- Los botones de crear/editar/eliminar en cada módulo se ocultan si no hay permiso

## Paso 7 — Actualizar AdminGuard

- Cambiar validación de `perfil.rol !== 'admin'` a verificar que el rol sea `superadministrador`
- Solo superadministrador accede a `/admin/*`

---

## Archivos afectados

| Paso | Archivos |
|------|----------|
| 1 | 1 migración SQL |
| 2 | `supabase/functions/admin-gestionar-roles/index.ts` (nuevo) |
| 3 | `supabase/functions/admin-crear-usuario/index.ts` |
| 4 | `src/types/roles.ts`, `src/services/rolesService.ts`, `src/hooks/useRoles.ts` (nuevos) |
| 5 | `src/pages/admin/AdminDashboardPage.tsx`, componentes nuevos en `src/components/admin/` |
| 6 | `src/contexts/AuthContext.tsx`, `src/components/layout/AppSidebar.tsx`, hook `usePermission` |
| 7 | `src/components/guards/AdminGuard.tsx` |

**Total: 1 migración, 1 edge function nueva, 1 edge function actualizada, ~8 archivos frontend nuevos/editados**

