# Sistema de Logs de Actividad de Usuario

## Índice

1. [Visión general](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Base de datos](#base-de-datos)
4. [Contexto global (ActivityLoggerContext)](#contexto-global)
5. [Servicio de consultas (activityLogService)](#servicio-de-consultas)
6. [Interfaz de administración](#interfaz-de-administración)
7. [Acciones instrumentadas actualmente](#acciones-instrumentadas)
8. [Guía para añadir logs a nuevos componentes](#guía-para-añadir-logs)
9. [Convenciones de nomenclatura](#convenciones-de-nomenclatura)
10. [Preguntas frecuentes](#preguntas-frecuentes)

---

## 1. Visión general

El sistema de logs registra **todas las acciones relevantes** de los usuarios autenticados: navegación, creación, edición, eliminación, exportación, descarga, login y logout. Está diseñado bajo el principio **fire-and-forget desacoplado**:

- Si un log falla, la operación principal **no se ve afectada**.
- Si un componente nuevo no tiene logs, **funciona normalmente** sin errores.
- Si se elimina una llamada a `logActivity()`, **no hay efectos secundarios**.
- El sistema es **transversal e independiente**: se puede instrumentar cualquier componente en cualquier momento sin riesgo.

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     App.tsx                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │         ActivityLoggerProvider                     │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Auto-log de navegación (useLocation)       │  │  │
│  │  │  Expone logActivity() vía Context           │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │                     │                              │  │
│  │     ┌───────────────┼───────────────┐              │  │
│  │     ▼               ▼               ▼              │  │
│  │  Página A       Página B       Componente C        │  │
│  │  logActivity()  logActivity()  (sin logs = OK)     │  │
│  │     │               │                              │  │
│  │     ▼               ▼                              │  │
│  │  ┌─────────────────────────────┐                   │  │
│  │  │  supabase.from(             │                   │  │
│  │  │    "user_activity_logs"     │                   │  │
│  │  │  ).insert([...])            │                   │  │
│  │  │  .then(() => {})  ← silencioso                  │  │
│  │  └─────────────────────────────┘                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Archivos clave

| Archivo | Propósito |
|---|---|
| `src/contexts/ActivityLoggerContext.tsx` | Provider global + hook `useActivityLogger` + auto-log de navegación |
| `src/services/activityLogService.ts` | Funciones de consulta para la interfaz admin |
| `src/pages/admin/AdminLogsPage.tsx` | Vista resumen de usuarios con actividad |
| `src/pages/admin/UserActivityLogPage.tsx` | Historial detallado de un usuario |

---

## 3. Base de datos

### Tabla: `public.user_activity_logs`

```sql
CREATE TABLE public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  module TEXT,
  description TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  route TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Índices

```sql
CREATE INDEX idx_ual_user_id ON public.user_activity_logs(user_id);
CREATE INDEX idx_ual_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX idx_ual_module ON public.user_activity_logs(module);
```

### Políticas RLS

| Política | Acción | Quién | Condición |
|---|---|---|---|
| Insertar logs propios | INSERT | `authenticated` | `user_id = auth.uid()` |
| Lectura para admins | SELECT | `authenticated` | El usuario tiene rol `superadministrador` o `administrador` |

### Campos explicados

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `user_id` | UUID | ID del usuario que realizó la acción | `a1b2c3d4-...` |
| `user_email` | TEXT | Email del usuario | `admin@safa.com` |
| `user_name` | TEXT | Nombre del perfil (puede ser null) | `Carlos Pérez` |
| `action` | TEXT | Tipo de acción realizada | `crear`, `editar`, `eliminar`, `navegar` |
| `module` | TEXT | Módulo del sistema | `cursos`, `matriculas`, `personas` |
| `description` | TEXT | Descripción legible de la acción | `Creó el curso FI-25-04-01` |
| `entity_type` | TEXT | Tipo de entidad afectada | `curso`, `matricula`, `persona` |
| `entity_id` | TEXT | ID de la entidad afectada | `uuid-de-la-entidad` |
| `metadata` | JSONB | Datos adicionales opcionales | `{ "campos_modificados": ["nombre", "email"] }` |
| `route` | TEXT | Ruta en la que ocurrió la acción | `/cursos/abc-123` |
| `created_at` | TIMESTAMPTZ | Marca de tiempo automática | `2026-04-16T10:30:00Z` |

> **Nota importante:** La tabla **no tiene foreign keys** hacia otras tablas. Esto es intencional para garantizar independencia total. El `user_id` se almacena como UUID pero sin constraint referencial.

---

## 4. Contexto global

### Archivo: `src/contexts/ActivityLoggerContext.tsx`

El `ActivityLoggerProvider` se monta en `App.tsx` envolviendo todas las rutas protegidas (dentro del `MainLayout`). Provee dos funcionalidades:

### 4.1. Función `logActivity()`

```typescript
interface LogActivityParams {
  action: string;          // Obligatorio: tipo de acción
  module?: string;         // Opcional: módulo del sistema
  description: string;     // Obligatorio: descripción legible
  entityType?: string;     // Opcional: tipo de entidad
  entityId?: string;       // Opcional: UUID de la entidad
  metadata?: Record<string, unknown>; // Opcional: datos extra
}
```

**Características:**
- Obtiene automáticamente `user_id`, `user_email` y `user_name` del contexto de autenticación (`useAuth`)
- Obtiene automáticamente la `route` del `useLocation`
- La inserción en la base de datos es **fire-and-forget**: usa `.then(() => {})` sin `await`
- Si el usuario no está autenticado, la función **no hace nada** (no lanza error)

### 4.2. Auto-log de navegación

Cada vez que cambia `location.pathname`, se registra automáticamente un log con:
- `action: "navegar"`
- `module`: detectado automáticamente a partir del primer segmento de la ruta
- `description`: `"Navegó a /ruta/actual"`

**Mapa de módulos por segmento de URL:**

| Segmento URL | Módulo registrado |
|---|---|
| `dashboard` | `dashboard` |
| `personas` | `personas` |
| `empresas` | `empresas` |
| `matriculas` | `matriculas` |
| `cursos` | `cursos` |
| `niveles` | `niveles` |
| `gestion-personal` | `personal` |
| `gestion-formatos` | `formatos` |
| `portal-estudiante` | `portal_estudiante` |
| `certificacion` | `certificacion` |
| `cartera` | `cartera` |
| `admin` | `admin` |

### 4.3. Hook de consumo

```typescript
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";

// Dentro de un componente React:
const { logActivity } = useActivityLogger();
```

Si el componente está fuera del `ActivityLoggerProvider`, `logActivity` será un **no-op** (función vacía), evitando cualquier error.

---

## 5. Servicio de consultas

### Archivo: `src/services/activityLogService.ts`

Contiene las funciones de **lectura** usadas por la interfaz de administración.

### `fetchUserActivitySummaries()`

Obtiene un resumen de actividad por usuario:
- Consulta los últimos 10,000 registros
- Agrupa client-side por `user_id`
- Retorna: `user_id`, `user_email`, `user_name`, `total_actions`, `last_activity`
- Ordenado por última actividad (más reciente primero)

### `fetchUserActivityLogs(userId, filters?)`

Obtiene el historial detallado de un usuario específico:
- Límite de 500 registros por consulta
- Filtros opcionales: `module`, `action`, `from` (fecha inicio), `to` (fecha fin)
- Ordenado cronológicamente descendente

---

## 6. Interfaz de administración

### Ruta: `/admin/logs`

**Archivo:** `src/pages/admin/AdminLogsPage.tsx`

Vista principal que muestra una tabla con todos los usuarios que tienen actividad registrada:
- **Columnas:** Nombre, Email, Cantidad de acciones (badge), Última actividad
- **Buscador:** Filtra por nombre o email en tiempo real
- **Interacción:** Click en fila → navega a `/admin/logs/:userId`
- **Acceso:** Solo visible para usuarios con rol `superadministrador` (controlado en el sidebar)

### Ruta: `/admin/logs/:userId`

**Archivo:** `src/pages/admin/UserActivityLogPage.tsx`

Vista de detalle del historial de un usuario:
- **Encabezado:** Nombre y email del usuario
- **Filtros:** Selector de módulo y selector de tipo de acción
- **Tabla cronológica** con columnas:
  - Fecha/Hora (formateada en zona horaria Colombia UTC-5)
  - Acción (badge con color semántico)
  - Módulo
  - Descripción
  - Ruta
- **Detalle expandible:** Click en una fila muestra el `metadata` JSON si existe

### Colores de badges por acción

| Acción | Color |
|---|---|
| `crear` | Verde |
| `editar` | Azul |
| `eliminar` | Rojo |
| `navegar` | Gris |
| `exportar` | Púrpura |
| `descargar` | Púrpura |
| `login` | Esmeralda |
| `logout` | Ámbar |

### Enlace en sidebar

En `src/components/layout/AppSidebar.tsx` se agregó el enlace "Logs de Actividad" dentro de la sección "Administración", visible únicamente para usuarios con permiso `superadministrador`.

---

## 7. Acciones instrumentadas actualmente

A continuación se listan todos los puntos donde `logActivity()` está implementado:

### Auth
| Acción | Archivo | Descripción |
|---|---|---|
| `logout` | `AppSidebar.tsx` | Cierre de sesión |

### Personas
| Acción | Archivo | Descripción |
|---|---|---|
| `crear` | `PersonaFormPage.tsx` | Creación de persona |
| `editar` | `PersonaFormPage.tsx` | Edición de persona |

### Empresas
| Acción | Archivo | Descripción |
|---|---|---|
| `crear` | `EmpresaFormPage.tsx` | Creación de empresa |
| `editar` | `EmpresaFormPage.tsx` | Edición de empresa |

### Matrículas
| Acción | Archivo | Descripción |
|---|---|---|
| `crear` | `MatriculaFormPage.tsx` | Creación de matrícula |
| `editar` | `MatriculaDetallePage.tsx` | Edición de matrícula |
| `pago` | `MatriculaDetallePage.tsx` | Registro de pago directo |
| `vincular_cartera` | `MatriculaDetallePage.tsx` | Vinculación a grupo de cartera |

### Cursos
| Acción | Archivo | Descripción |
|---|---|---|
| `crear` | `CursoFormPage.tsx` | Creación de curso |
| `editar` | `CursoDetallePage.tsx` | Edición de curso |
| `cambiar_estado` | `CursoDetallePage.tsx` | Cambio de estado del curso |
| `exportar` | `CursoDetallePage.tsx` | Exportación CSV MinTrabajo |
| `cerrar` | `CloseCourseDialog.tsx` | Cierre de curso |
| `agregar_estudiantes` | `AgregarEstudiantesModal.tsx` | Agregar estudiantes al curso |
| `remover_estudiante` | `EnrollmentsTable.tsx` | Remover estudiante del curso |

### Niveles
| Acción | Archivo | Descripción |
|---|---|---|
| `crear` | `NivelFormPage.tsx` | Creación de nivel |
| `editar` | `NivelFormPage.tsx` | Edición de nivel |
| `eliminar` | `NivelDetallePage.tsx` | Eliminación de nivel |

### Personal
| Acción | Archivo | Descripción |
|---|---|---|
| `crear` | `PersonalFormPage.tsx` | Creación de personal |
| `editar` | `PersonalFormPage.tsx` | Edición de personal |

### Formatos
| Acción | Archivo | Descripción |
|---|---|---|
| `crear` | `FormatoEditorPage.tsx` | Creación de formato |
| `editar` | `FormatoEditorPage.tsx` | Edición de formato |
| `activar` | `FormatosPage.tsx` | Activación de formato |
| `desactivar` | `FormatosPage.tsx` | Desactivación de formato |
| `duplicar` | `FormatosPage.tsx` | Duplicación de formato |
| `archivar` | `FormatosPage.tsx` | Archivado de formato |
| `eliminar` | `FormatosPage.tsx` | Eliminación masiva de formatos |

### Certificación
| Acción | Archivo | Descripción |
|---|---|---|
| `guardar_plantilla` | `PlantillaEditorPage.tsx` | Guardado de plantilla |
| `restaurar_version` | `PlantillaEditorPage.tsx` | Restauración de versión |
| `generar_certificado` | `PlantillaEditorPage.tsx` | Generación individual de certificado |

### Cartera
| Acción | Archivo | Descripción |
|---|---|---|
| `crear_factura` | `CrearFacturaDialog.tsx` | Creación de factura |
| `editar_factura` | `EditarFacturaDialog.tsx` | Edición de factura |
| `eliminar_factura` | `EditarFacturaDialog.tsx` | Eliminación de factura |
| `registrar_pago` | `RegistrarPagoDialog.tsx` | Registro de pago |
| `editar_pago` | `EditarPagoDialog.tsx` | Edición de pago |
| `eliminar_pago` | `EditarPagoDialog.tsx` | Eliminación de pago |

### Portal Admin
| Acción | Archivo | Descripción |
|---|---|---|
| `configurar_documento` | `PortalAdminPage.tsx` | Configuración de documento |
| `habilitar_nivel` | `PortalAdminPage.tsx` | Habilitación de nivel |
| `deshabilitar_nivel` | `PortalAdminPage.tsx` | Deshabilitación de nivel |

### Admin (Usuarios y Roles)
| Acción | Archivo | Descripción |
|---|---|---|
| `crear_usuario` | `UsuariosTab.tsx` | Creación de usuario |
| `editar_usuario` | `UsuariosTab.tsx` | Edición de usuario |
| `eliminar_usuario` | `UsuariosTab.tsx` | Eliminación de usuario |
| `reset_password` | `UsuariosTab.tsx` | Reinicio de contraseña |
| `crear_rol` | `RolesTab.tsx` | Creación de rol |
| `editar_rol` | `RolesTab.tsx` | Edición de rol |
| `eliminar_rol` | `RolesTab.tsx` | Eliminación de rol |

### Navegación (automático)
| Acción | Archivo | Descripción |
|---|---|---|
| `navegar` | `ActivityLoggerContext.tsx` | Cada cambio de ruta se registra automáticamente |

---

## 8. Guía para añadir logs a nuevos componentes

### Paso 1: Importar el hook

```typescript
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
```

### Paso 2: Obtener la función

```typescript
const { logActivity } = useActivityLogger();
```

### Paso 3: Llamar en el callback de éxito

Coloca la llamada **después** de la operación principal exitosa (generalmente después del `toast` de éxito):

```typescript
// Ejemplo: Crear una entidad nueva
const handleCrear = async (data: FormData) => {
  try {
    const resultado = await crearEntidad(data);
    
    toast({ title: "Entidad creada exitosamente" });
    
    // ✅ Log DESPUÉS del éxito, nunca antes
    logActivity({
      action: "crear",
      module: "mi_modulo",
      description: `Creó la entidad ${resultado.nombre}`,
      entityType: "mi_entidad",
      entityId: resultado.id,
    });
    
    navigate("/mi-modulo");
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
    // ❌ NO registrar log en caso de error
  }
};
```

### Paso 4: Para edición, incluir detalles útiles

```typescript
logActivity({
  action: "editar",
  module: "cursos",
  description: `Editó el curso ${curso.nombre}`,
  entityType: "curso",
  entityId: curso.id,
  metadata: {
    campos_modificados: ["nombre", "lugar", "fecha_inicio"],
  },
});
```

### Paso 5: Para eliminación

```typescript
logActivity({
  action: "eliminar",
  module: "niveles",
  description: `Eliminó el nivel ${nivel.nombre}`,
  entityType: "nivel",
  entityId: nivel.id,
});
```

### Paso 6: Para exportaciones/descargas

```typescript
logActivity({
  action: "exportar",
  module: "cursos",
  description: `Exportó listado CSV del curso ${curso.nombre}`,
  entityType: "curso",
  entityId: curso.id,
  metadata: {
    formato: "csv",
    columnas_seleccionadas: selectedColumns,
  },
});
```

### Ejemplo completo en un componente nuevo

```typescript
import { useState } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { useToast } from "@/hooks/use-toast";

export default function MiNuevoComponente() {
  const { logActivity } = useActivityLogger();
  const { toast } = useToast();

  const handleGuardar = async () => {
    try {
      // ... lógica de guardado ...
      
      toast({ title: "Guardado exitosamente" });
      
      logActivity({
        action: "editar",
        module: "mi_modulo",
        description: "Guardó configuración de mi módulo",
      });
    } catch (error) {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleEliminar = async (itemId: string, itemName: string) => {
    try {
      // ... lógica de eliminación ...
      
      toast({ title: "Eliminado correctamente" });
      
      logActivity({
        action: "eliminar",
        module: "mi_modulo",
        description: `Eliminó ${itemName}`,
        entityType: "mi_entidad",
        entityId: itemId,
      });
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  return <div>{/* ... UI ... */}</div>;
}
```

---

## 9. Convenciones de nomenclatura

### Acciones (`action`)

Usar **verbos en infinitivo en español**, en minúsculas:

| Acción | Cuándo usarla |
|---|---|
| `crear` | Creación de una nueva entidad |
| `editar` | Modificación de una entidad existente |
| `eliminar` | Eliminación de una entidad |
| `navegar` | Cambio de ruta (automático) |
| `exportar` | Exportación de datos (CSV, Excel, PDF) |
| `descargar` | Descarga de un archivo individual |
| `login` | Inicio de sesión |
| `logout` | Cierre de sesión |
| `cambiar_estado` | Cambio de estado de una entidad |
| `activar` | Activación de una entidad |
| `desactivar` | Desactivación de una entidad |
| `duplicar` | Duplicación de una entidad |
| `archivar` | Archivado de una entidad |
| `generar` | Generación de un documento/certificado |
| `restaurar` | Restauración de una versión anterior |
| `vincular` | Vinculación entre entidades |
| `desvincular` | Desvinculación entre entidades |
| `subir` | Subida de un archivo |
| `configurar` | Cambio de configuración |

### Módulos (`module`)

Usar el **nombre del módulo en minúsculas**, separado por guion bajo:

| Módulo | Valor |
|---|---|
| Dashboard | `dashboard` |
| Personas | `personas` |
| Empresas | `empresas` |
| Matrículas | `matriculas` |
| Cursos | `cursos` |
| Niveles | `niveles` |
| Personal | `personal` |
| Formatos | `formatos` |
| Portal Estudiante | `portal_estudiante` |
| Certificación | `certificacion` |
| Cartera | `cartera` |
| Administración | `admin` |

### Tipos de entidad (`entityType`)

Usar el **nombre singular de la entidad en minúsculas**:

`persona`, `empresa`, `matricula`, `curso`, `nivel`, `personal`, `formato`, `plantilla`, `certificado`, `factura`, `pago`, `usuario`, `rol`, `documento`

### Descripción (`description`)

- Usar **tercera persona del pasado**: "Creó...", "Editó...", "Eliminó..."
- Incluir **nombre o identificador** de la entidad: `"Editó el curso FI-25-04-01"`
- Ser **conciso pero informativo**: máximo ~80 caracteres

---

## 10. Preguntas frecuentes

### ¿Qué pasa si `logActivity()` falla?

Nada. La inserción es fire-and-forget (`.then(() => {})`). No hay `catch` que lance errores. La operación principal del usuario ya se completó antes de que se llame a `logActivity()`.

### ¿Qué pasa si creo un componente nuevo sin logs?

Funciona perfectamente. Los logs son opcionales. Simplemente no se generarán registros para ese componente hasta que se instrumenten.

### ¿Puedo usar `logActivity()` fuera del contexto?

Si el componente está fuera del `ActivityLoggerProvider`, el hook retornará un no-op (función vacía). No hay error, simplemente no se registra nada.

### ¿Debo usar `await` con `logActivity()`?

**No.** La función es síncrona desde la perspectiva del componente. Internamente dispara una inserción asíncrona, pero no retorna una promesa. Esto es intencional: nunca se debe esperar a que un log se complete.

### ¿Se registran las navegaciones automáticamente?

Sí. El `ActivityLoggerProvider` usa `useLocation` para detectar cambios de ruta y registra automáticamente un log con `action: "navegar"`. No necesitas hacer nada adicional para esto.

### ¿Quién puede ver los logs?

Solo usuarios con rol `superadministrador` o `administrador` pueden leer la tabla `user_activity_logs` (controlado por RLS). El enlace en el sidebar solo aparece para `superadministrador`.

### ¿Hay límite de registros?

La tabla no tiene límite. Las consultas en la interfaz admin limitan a:
- 10,000 registros para el resumen de usuarios
- 500 registros por usuario en la vista de detalle

### ¿Cómo agrego un nuevo módulo al mapa de navegación?

Edita el `moduleMap` en `ActivityLoggerContext.tsx`:

```typescript
const moduleMap: Record<string, string> = {
  // ... existentes ...
  "mi-nuevo-modulo": "mi_modulo",  // ← agregar aquí
};
```

### ¿Cómo agrego un nuevo color de badge para una acción nueva?

Edita `ACTION_COLORS` en `UserActivityLogPage.tsx`:

```typescript
const ACTION_COLORS: Record<string, string> = {
  // ... existentes ...
  mi_accion: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};
```

Y agrega la acción al array `ACTIONS` en el mismo archivo para que aparezca en el filtro.
