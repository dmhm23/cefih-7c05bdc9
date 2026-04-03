

# Plan: Redisenar Admin con layout de la app principal

## Problema actual
El panel admin (`/admin/dashboard`) usa un layout completamente diferente al de la app principal: header plano con max-width, sin sidebar, sin breadcrumbs, sin avatar. La app principal usa `MainLayout` con sidebar colapsable, breadcrumbs, notificaciones y avatar.

## Enfoque
Envolver las rutas admin dentro del mismo `MainLayout` (sidebar + header + breadcrumbs), agregando los items de navegacion admin al sidebar cuando el usuario es superadministrador. Eliminar el header custom del `AdminDashboardPage` y adoptar la misma estructura de pagina que usa `Dashboard.tsx`.

---

## Cambios

### 1. `App.tsx` — Usar `MainLayout` para admin
- Cambiar la ruta `/admin/dashboard` de `<AdminGuard><AdminDashboardPage /></AdminGuard>` a `<AdminGuard><MainLayout><AdminDashboardPage /></MainLayout></AdminGuard>`
- Esto le da sidebar, breadcrumbs y header identicos a la app principal

### 2. `AppSidebar.tsx` — Agregar items de admin
- Agregar seccion "Administracion" al final del sidebar (antes del footer), visible solo si `perfil?.rol_nombre === 'superadministrador'`
- Items: "Usuarios" (`/admin/dashboard?tab=usuarios`, icon `Users`) y "Roles y Permisos" (`/admin/dashboard?tab=roles`, icon `KeyRound`)
- Alternativa mas limpia: un solo item "Administracion" con icono `Shield` que navega a `/admin/dashboard`

### 3. `AdminDashboardPage.tsx` — Redisenar como pagina de contenido
- Eliminar el `<header>` custom completo (border-b, Shield icon, logout button, email)
- Eliminar el wrapper `min-h-screen bg-background` y `max-w-5xl mx-auto`
- Adoptar la misma estructura que `Dashboard.tsx`:
  ```
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-foreground">Administracion</h1>
      <p className="text-muted-foreground mt-1">Gestion de usuarios, roles y permisos del sistema</p>
    </div>
    <Tabs ...>
  </div>
  ```
- El logout ya esta en el sidebar footer, no necesita duplicarse

### 4. `UsuariosTab.tsx` — Estilo Lightfield
- Formulario de creacion: quitar `rounded-2xl shadow-sm`, usar card plano sin sombra (`bg-card border border-border rounded-lg`)
- Tabla de usuarios: adoptar estilo Lightfield — ancho completo, sin bordes externos, encabezados en `text-xs uppercase tracking-wider text-muted-foreground`, filas con `bg-card hover:bg-muted/30`, sin rounded-xl
- Quitar iconos decorativos de los titulos de seccion (UserPlus, Users) — la app principal no los usa en headers de seccion

### 5. `RolesTab.tsx` — Estilo Lightfield
- Grid de roles: quitar `rounded-xl`, usar `rounded-lg border border-border`
- Tabla de permisos en dialog: adoptar mismos estilos de tabla Lightfield (encabezados uppercase, celdas compactas)
- Botones de accion: mantener `ghost` con iconos, consistente con `RowActions` de la app principal

### 6. `AdminLoginPage.tsx` — Unificar colores con login principal
- Cambiar `bg-destructive` a `bg-primary` en el icono
- Cambiar `focus:border-destructive` a `focus:border-primary` en inputs
- Cambiar boton de `bg-destructive` a `bg-primary` con sombras `shadow-primary/25`
- Cambiar `group-focus-within:text-destructive` a `group-focus-within:text-primary`
- Resultado: misma estetica visual que `LoginForm.tsx` pero con icono de Shield y texto "Acceso Administrativo"

### 7. `MainLayout.tsx` — Agregar ruta admin a breadcrumbs
- Agregar `"/admin/dashboard": "Administracion"` al mapa `routeNames`

## Archivos afectados
| Archivo | Cambio |
|---------|--------|
| `App.tsx` | Envolver admin route en MainLayout |
| `AppSidebar.tsx` | Agregar item "Administracion" para superadmin |
| `AdminDashboardPage.tsx` | Eliminar header custom, adoptar layout de contenido |
| `UsuariosTab.tsx` | Estilo Lightfield en formulario y tabla |
| `RolesTab.tsx` | Estilo Lightfield en grid y tabla de permisos |
| `AdminLoginPage.tsx` | Cambiar colores destructive → primary |
| `MainLayout.tsx` | Agregar ruta admin a breadcrumbs |

