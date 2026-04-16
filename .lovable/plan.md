

# Plan: Sistema de Logs de Actividad de Usuario

## Resumen

Implementar un sistema de registro de actividad de usuario (user activity logs) completamente desacoplado del código de negocio, accesible desde el panel de administración en `/admin/logs`. El sistema registrará acciones como navegación, guardado, eliminación, exportación y cualquier interacción relevante, asociadas al usuario autenticado.

## Principio arquitectónico: fire-and-forget desacoplado

El sistema se basa en un **hook global** (`useActivityLogger`) que:
- Se inicializa una sola vez en el `MainLayout`
- Escucha automáticamente navegación de rutas (sin tocar componentes)
- Expone una función `logActivity()` que se puede llamar desde cualquier lugar
- Las llamadas a `logActivity()` son **fire-and-forget**: si fallan, no afectan la funcionalidad del sistema
- Si un componente no tiene logs, simplemente no genera registros — nada se rompe

## 1. Tabla de base de datos: `user_activity_logs`

```sql
CREATE TABLE public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,           -- 'navegar', 'crear', 'editar', 'eliminar', 'exportar', 'descargar', 'login', 'logout', etc.
  module TEXT,                     -- 'cursos', 'matriculas', 'personas', etc.
  description TEXT NOT NULL,       -- Descripción legible: "Guardó cambios en curso FI-25-04-01"
  entity_type TEXT,                -- 'curso', 'matricula', 'persona', etc.
  entity_id UUID,                  -- ID de la entidad afectada
  metadata JSONB DEFAULT '{}'::JSONB,  -- Datos adicionales (campos modificados, valores, etc.)
  route TEXT,                      -- Ruta en la que ocurrió: /cursos/abc-123
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ual_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_ual_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX idx_ual_module ON public.user_activity_logs(module);
```

RLS: solo lectura para superadmin/admin, inserción para cualquier autenticado.

## 2. Hook global: `useActivityLogger`

**Archivo:** `src/hooks/useActivityLogger.ts`

```typescript
// Interfaz pública
logActivity(params: {
  action: string;
  module?: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): void  // fire-and-forget, no async
```

Características:
- Obtiene `user_id`, `email`, `name` del contexto de autenticación
- Inserta en `user_activity_logs` sin `await` (catch silencioso)
- **Auto-log de navegación**: usa `useLocation` para registrar cada cambio de ruta automáticamente (acción `navegar`)
- **Auto-log de login/logout**: escucha `onAuthStateChange`

## 3. Contexto global: `ActivityLoggerContext`

**Archivo:** `src/contexts/ActivityLoggerContext.tsx`

Provee `logActivity` a toda la aplicación vía contexto, sin necesidad de pasar props. Se monta en `App.tsx` envolviendo las rutas protegidas.

## 4. Instrumentación de acciones existentes (~50 puntos)

Se agregarán llamadas `logActivity(...)` en los callbacks de éxito de las mutaciones existentes. Estas llamadas son opcionales y no bloquean la ejecución.

### Acciones identificadas por módulo:

| Módulo | Acciones a registrar |
|---|---|
| **Auth** | Login, logout |
| **Dashboard** | Navegación (automático) |
| **Personas** | Crear, editar, eliminar persona |
| **Empresas** | Crear, editar, eliminar empresa |
| **Matrículas** | Crear, editar, cambiar estado, subir/eliminar documento, registrar pago, reabrir formato, guardar formato |
| **Cursos** | Crear, editar, cambiar estado, cerrar curso, exportar MinTrabajo, exportar listado, generar PDFs masivos, agregar/remover estudiantes |
| **Niveles** | Crear, editar, eliminar nivel |
| **Personal** | Crear, editar, eliminar personal, subir/eliminar firma, subir/eliminar adjunto |
| **Formatos** | Crear, editar, duplicar, eliminar formato |
| **Cartera** | Crear/editar/eliminar factura, registrar/editar/eliminar pago |
| **Certificación** | Generar certificado, revocar, crear/editar plantilla |
| **Portal Admin** | Configurar documentos, habilitar/deshabilitar niveles |
| **Admin** | Crear usuario, asignar rol, editar usuario, eliminar usuario, crear/editar/eliminar rol |

### Patrón de instrumentación (ejemplo):

```typescript
// En CursoDetallePage.tsx, después del toast de éxito:
toast({ title: "Cambios guardados correctamente" });
logActivity({
  action: "editar",
  module: "cursos",
  description: `Editó el curso ${curso.nombre}`,
  entityType: "curso",
  entityId: curso.id,
});
```

## 5. Interfaz de administración

### Ruta: `/admin/logs`

**Archivo:** `src/pages/admin/AdminLogsPage.tsx`

Vista principal con tabla de usuarios que tienen actividad registrada:
- Columnas: nombre, email, rol, cantidad de acciones, última actividad
- Buscador por nombre/email
- Click en fila → navega a `/admin/logs/:userId`

### Ruta: `/admin/logs/:userId`

**Archivo:** `src/pages/admin/UserActivityLogPage.tsx`

Vista de detalle con:
- Encabezado: nombre del usuario, email, rol
- Filtros: rango de fechas, módulo, tipo de acción
- Tabla cronológica descendente con columnas:
  - Fecha/hora (formateada Colombia UTC-5)
  - Acción (badge con color)
  - Módulo
  - Descripción
  - Detalle expandible (metadata JSON si existe)

### Sidebar

Agregar enlace "Logs de Actividad" en la sección Administración del sidebar, visible solo para superadministrador.

## 6. Archivos a crear/modificar

| Archivo | Tipo | Descripción |
|---|---|---|
| Migración SQL | Nuevo | Tabla `user_activity_logs` + índices + RLS |
| `src/hooks/useActivityLogger.ts` | Nuevo | Hook con auto-log de navegación |
| `src/contexts/ActivityLoggerContext.tsx` | Nuevo | Contexto global para `logActivity` |
| `src/services/activityLogService.ts` | Nuevo | Queries de lectura para la interfaz admin |
| `src/pages/admin/AdminLogsPage.tsx` | Nuevo | Lista de usuarios con actividad |
| `src/pages/admin/UserActivityLogPage.tsx` | Nuevo | Historial de un usuario |
| `src/App.tsx` | Modificar | Agregar rutas `/admin/logs` y `/admin/logs/:userId`, montar contexto |
| `src/components/layout/AppSidebar.tsx` | Modificar | Enlace "Logs" en sección admin |
| ~25 archivos de páginas/componentes | Modificar | Agregar llamadas `logActivity()` en callbacks existentes |

## 7. Garantías de independencia

- Si `logActivity` falla → se silencia, la operación principal continúa
- Si un componente nuevo no tiene `logActivity` → funciona normalmente, sin error
- Si se elimina una llamada a `logActivity` → no hay efecto secundario
- La tabla `user_activity_logs` no tiene foreign keys hacia otras tablas (solo guarda `user_id` como texto/UUID sin constraint externo)
- El contexto es opcional: si no está montado, `logActivity` es un no-op

