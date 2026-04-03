

## Plan: Actualizar DOCUMENTACION_SISTEMA.md a v1.9

### Resumen

Actualizar el documento tecnico para reflejar la implementacion de autenticacion real con Lovable Cloud, el sistema de perfiles/roles, Edge Functions, guards de ruta, y el panel de administracion. Se mantiene la estructura original del documento y se expanden las secciones relevantes.

---

### Cambios por seccion

#### 1. Metadata (lineas 1-8)
- Version: 1.8 → **1.9**
- Fecha: 25 de Marzo 2026 → **3 de Abril 2026**

#### 2. Seccion 1.2 — Alcance Funcional
- Agregar fila en la tabla de modulos: **Autenticacion y Administracion** — Login real, gestion de usuarios, roles y panel admin.

#### 3. Seccion 2.1 — Stack Tecnologico
- Agregar fila: **Backend** | Lovable Cloud (Supabase) — Auth, PostgreSQL, Edge Functions
- Agregar fila: **Autenticacion** | Supabase Auth (Email/Password)

#### 4. Seccion 2.2 — Patron de Arquitectura
- Renombrar de "Backend Emulado" a **"Arquitectura Hibrida: Backend Real + Servicios Mock"**
- Actualizar el diagrama ASCII para mostrar:
  - Capa de Autenticacion (Supabase Auth) como capa real
  - Tabla `perfiles` en PostgreSQL
  - Edge Functions (`admin-crear-usuario`, `bootstrap-admin`)
  - Capa de servicios mock (sin cambios, aun operativa para datos de negocio)
- Agregar nota explicativa: la autenticacion es real via Lovable Cloud; los modulos de negocio (personas, matriculas, cursos, etc.) aun operan con servicios mock en memoria, pendientes de migracion a base de datos.

#### 5. Seccion 2.3 — Estructura de Directorios
- Agregar entradas:
  - `src/contexts/AuthContext.tsx` — Contexto de autenticacion global
  - `src/components/guards/` — AuthGuard, AdminGuard
  - `src/pages/admin/` — AdminLoginPage, AdminDashboardPage
  - `supabase/functions/` — Edge Functions (admin-crear-usuario, bootstrap-admin)
  - `supabase/migrations/` — Migraciones SQL

#### 6. Seccion 2.4 — Enrutamiento
- Agregar rutas a la tabla:
  - `/admin` | `AdminLoginPage` | Login administrativo
  - `/admin/dashboard` | `AdminDashboardPage` | Panel de administracion (protegido por AdminGuard)
- Actualizar nota de proteccion de rutas: mencionar `AuthGuard` y `AdminGuard`

#### 7. Nueva seccion (insertar despues de seccion 2 o como nueva seccion numerada)

**Seccion: Autenticacion y Autorizacion**

Contenido:
- **Proveedores**: Email/Password via Lovable Cloud
- **Tabla `perfiles`**: Esquema (id UUID PK → auth.users, email, nombres, rol, created_at)
- **Roles**: `global` (por defecto), `admin` (acceso al panel de administracion)
- **Trigger `on_auth_user_created`**: Crea perfil automaticamente con rol `global` al registrar usuario
- **Funcion `get_my_rol()`**: SECURITY DEFINER para consultar rol sin recursion RLS
- **Politicas RLS**:
  - SELECT: admin ve todo, usuario ve solo su perfil
  - INSERT/UPDATE/DELETE: bloqueado para cliente (solo service role/trigger)
- **AuthContext**: Provider que escucha `onAuthStateChange`, expone session, user, perfil (con rol), loading, signOut
- **Guards**:
  - `AuthGuard`: Verifica sesion activa, redirige a `/` si no existe
  - `AdminGuard`: Verifica sesion + rol admin, redirige a `/admin` si no cumple
- **Edge Functions**:
  - `admin-crear-usuario`: Valida JWT + rol admin, crea usuario con service role, actualiza nombres
  - `bootstrap-admin`: Funcion de uso unico para crear primer usuario admin
- **Login principal** (`/`): `LoginForm.tsx` conectado a `supabase.auth.signInWithPassword`
- **Login admin** (`/admin`): Verifica rol post-login, cierra sesion si no es admin
- **Panel admin** (`/admin/dashboard`): Formulario de creacion de usuarios globales via Edge Function

#### 8. Seccion 14.1 — Servicios
- Agregar subseccion: **Supabase Client** (`src/integrations/supabase/client.ts`) — cliente auto-generado, no editar manualmente

#### 9. Seccion 18 — Auditoria
- Actualizar el tipo `TipoEntidad` para incluir todos los tipos actuales del codigo: `'persona' | 'matricula' | 'curso' | 'comentario' | 'nivel_formacion' | 'personal' | 'cargo' | 'certificado' | 'plantilla_certificado' | 'excepcion_certificado' | 'empresa' | 'formato_formacion' | 'tarifa_empresa' | 'factura' | 'pago' | 'grupo_cartera'`

#### 10. Seccion 19 — Historial de Cambios
- Agregar entrada **v1.9 — 3 de Abril 2026**:
  - **Autenticacion real con Lovable Cloud**: Migracion de login simulado a Supabase Auth real con Email/Password
  - **Tabla `perfiles`**: Tabla en PostgreSQL con trigger automatico, RLS y funcion SECURITY DEFINER
  - **Sistema de roles**: `global` (operador) y `admin` (administrador)
  - **Edge Functions**: `admin-crear-usuario` (creacion de usuarios por admin) y `bootstrap-admin` (inicializacion)
  - **AuthContext + Guards**: Contexto global de sesion con `AuthGuard` y `AdminGuard`
  - **Panel de Administracion**: Login admin (`/admin`) y dashboard de creacion de usuarios (`/admin/dashboard`)
  - **LoginForm adaptado**: Eliminadas credenciales demo, conectado a autenticacion real
  - Archivos creados y modificados

---

### Archivos afectados

| Archivo | Accion |
|---|---|
| `Docs/DOCUMENTACION_SISTEMA.md` | Modificar (actualizar ~10 secciones) |

### Notas
- Se preserva toda la estructura y numeracion original del documento
- No se eliminan secciones existentes, solo se expanden y actualizan
- Los modulos de negocio siguen documentados como servicios mock (sin cambios en esas secciones)
- La nueva seccion de autenticacion se integra logicamente con el patron arquitectonico existente

