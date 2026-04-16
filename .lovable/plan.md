# Plan: Personalizar sidebar y header con branding FIH Instructores

## Cambios

### 1. Copiar logo al proyecto

Copiar `user-uploads://LOGO_FIH_LTDA_PNG_SIN_FONDO.png` a `src/assets/logo-fih.png` para importarlo como módulo ES6.

### 2. Sidebar — `AppSidebar.tsx`

- Reemplazar la caja azul con "S" por una `<img>` del logo importado (h-10 w-10, rounded-lg)
- Cambiar "SAFA" → "FIH Instructores"
- Cambiar subtítulo "Sistema Administrativo" → "Sistema Administrativo" (se mantiene)

### 3. Header — `MainLayout.tsx`

- Ocultar el bloque de notificaciones (Bell icon)
- Cambiar breadcrumb "SAFA" → "FIH Instructores"
- Reemplazar el avatar estático "A" por un `DropdownMenu` que:
  - Muestra la inicial del nombre del usuario en sesión (desde `perfil.nombres`)
  - Al hacer clic despliega: nombre completo, email, y opción de cerrar sesión
- Importar `useAuth` para acceder a `perfil`

### Archivos a modificar


| Archivo                                | Cambio                                              |
| -------------------------------------- | --------------------------------------------------- |
| `src/assets/logo-fih.png`              | Crear — logo copiado                                |
| `src/components/layout/AppSidebar.tsx` | Logo + nombre                                       |
| `src/components/layout/MainLayout.tsx` | Ocultar notificaciones, avatar con menú desplegable |
