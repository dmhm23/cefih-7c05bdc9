

## Plan: Autenticacion Real + Panel Admin con Lovable Cloud

### Resumen
Implementar autenticacion real con Email/Password, tabla de perfiles con roles, Edge Function para creacion de usuarios por admin, y las rutas frontend `/admin`, `/admin/dashboard` con guards de sesion y rol.

---

### Paso 1: Base de Datos -- Tabla `perfiles` + Trigger + RLS

**Migracion SQL:**

```sql
-- Tabla perfiles
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombres TEXT,
  rol TEXT NOT NULL DEFAULT 'global',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Funcion auxiliar para obtener rol (SECURITY DEFINER, evita recursion RLS)
CREATE OR REPLACE FUNCTION public.get_my_rol()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid()
$$;

-- RLS: SELECT - admin ve todo, usuario ve solo su perfil
CREATE POLICY "Usuarios leen su propio perfil"
  ON public.perfiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.get_my_rol() = 'admin');

-- RLS: INSERT solo via trigger (bloqueado para cliente)
CREATE POLICY "Insert bloqueado para cliente"
  ON public.perfiles FOR INSERT TO authenticated
  WITH CHECK (false);

-- RLS: UPDATE/DELETE bloqueado
CREATE POLICY "Update bloqueado"
  ON public.perfiles FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Delete bloqueado"
  ON public.perfiles FOR DELETE TO authenticated
  USING (false);

-- Trigger: crear perfil automaticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombres, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombres', ''),
    'global'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Paso 2: Crear usuario admin inicial

Usar la Edge Function de creacion (paso 3) no es posible aun, asi que se creara el usuario admin directamente via `supabase.auth.admin.createUser` desde una Edge Function de bootstrap, o manualmente insertando en la tabla perfiles despues del signup. El enfoque sera:

1. Habilitar auto-confirm para email (temporalmente via `configure_auth`)
2. Crear el usuario `mhoyos456@gmail.com` con password `7d!@\O6(5JlN` usando la Edge Function admin (que se despliega primero)
3. Actualizar su rol a `admin` via INSERT en la tabla perfiles (el trigger lo crea como `global`, luego se actualiza via service role)

**Alternativa mas simple:** Crear una Edge Function `bootstrap-admin` de uso unico que cree el usuario y le asigne rol admin.

### Paso 3: Edge Function `admin-crear-usuario`

**Archivo:** `supabase/functions/admin-crear-usuario/index.ts`

Logica:
1. CORS headers
2. Validar JWT con `getClaims()`
3. Consultar `perfiles` del usuario autenticado para verificar `rol = 'admin'`
4. Crear usuario con `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
5. Actualizar campo `nombres` en `perfiles` si se proporciono
6. Retornar ID del nuevo usuario o error

### Paso 4: Frontend -- Adaptar Login Principal (`/`)

**Archivo:** `src/components/LoginForm.tsx`

Cambios:
- Eliminar `DEMO_CREDENTIALS` y credenciales hardcodeadas
- Campos vacios por defecto
- Conectar a `supabase.auth.signInWithPassword({ email, password })`
- Manejo de errores con toast
- Redireccion a `/dashboard` al exito

### Paso 5: Frontend -- Auth Context

**Archivo nuevo:** `src/contexts/AuthContext.tsx`

- Provider que escucha `onAuthStateChange`
- Expone `session`, `user`, `perfil` (con rol), `loading`, `signOut`
- Consulta `perfiles` al obtener sesion para tener el rol disponible
- Hook `useAuth()`

### Paso 6: Frontend -- Login Admin (`/admin`)

**Archivo nuevo:** `src/pages/admin/AdminLoginPage.tsx`

- Reutiliza estructura visual de LoginForm con diferencias (titulo "Acceso Administrativo", color diferente en boton)
- Post-login: consulta perfil, si `rol !== 'admin'` hace signOut y muestra error
- Si es admin, redirige a `/admin/dashboard`

### Paso 7: Frontend -- Admin Dashboard (`/admin/dashboard`)

**Archivo nuevo:** `src/pages/admin/AdminDashboardPage.tsx`

- Header con titulo + boton cerrar sesion
- Formulario: Nombres, Email, Contraseña
- Envia a Edge Function via `supabase.functions.invoke('admin-crear-usuario', { body })`
- Toast de exito/error, limpia formulario al exito

### Paso 8: Frontend -- Guards

**Archivos nuevos:**
- `src/components/guards/AuthGuard.tsx` -- Verifica sesion activa, redirige a `/` si no hay
- `src/components/guards/AdminGuard.tsx` -- Verifica sesion + rol admin, redirige a `/admin` si no cumple

### Paso 9: Frontend -- Rutas en App.tsx

Cambios en `src/App.tsx`:
- Envolver toda la app con `AuthProvider`
- Rutas protegidas existentes: envolver con `AuthGuard`
- Nuevas rutas:
  - `/admin` → `AdminLoginPage`
  - `/admin/dashboard` → `AdminGuard` → `AdminDashboardPage`

---

### Archivos afectados

| Archivo | Accion |
|---|---|
| Migracion SQL (perfiles + trigger + RLS) | Crear |
| `supabase/functions/admin-crear-usuario/index.ts` | Crear |
| `src/contexts/AuthContext.tsx` | Crear |
| `src/components/guards/AuthGuard.tsx` | Crear |
| `src/components/guards/AdminGuard.tsx` | Crear |
| `src/pages/admin/AdminLoginPage.tsx` | Crear |
| `src/pages/admin/AdminDashboardPage.tsx` | Crear |
| `src/components/LoginForm.tsx` | Modificar (conectar a Supabase Auth) |
| `src/App.tsx` | Modificar (AuthProvider + guards + rutas admin) |

### Notas
- El usuario admin `mhoyos456@gmail.com` se creara via Edge Function bootstrap con service role key y su rol se actualizara a `admin` directamente
- No se usa auto-confirm global; el admin crea usuarios con `email_confirm: true` via service role
- Las rutas del portal estudiante (`/estudiante/*`) mantienen su guard independiente existente

