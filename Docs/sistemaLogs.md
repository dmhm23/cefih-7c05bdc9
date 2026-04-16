# Sistema de Logs de Actividad de Usuario

## Índice

1. [Visión general](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Base de datos](#base-de-datos)
4. [Contexto global (ActivityLoggerContext)](#contexto-global)
5. [Servicio de consultas (activityLogService)](#servicio-de-consultas)
6. [Interfaz de administración](#interfaz-de-administración)
7. [Catálogo de acciones](#catálogo-de-acciones)
8. [Acciones instrumentadas actualmente](#acciones-instrumentadas)
9. [Guía para añadir logs a nuevos componentes](#guía-para-añadir-logs)
10. [Convenciones de nomenclatura](#convenciones-de-nomenclatura)
11. [Preguntas frecuentes](#preguntas-frecuentes)

---

## 1. Visión general

El sistema de logs registra **todas las acciones relevantes** de los usuarios autenticados con **alta precisión semántica**: navegación, creación, edición, eliminación, exportación, descarga, subida de archivos, captura de firmas, importación masiva, generación de certificados/PDFs, aprobación/rechazo de excepciones, login y logout.

Está diseñado bajo el principio **fire-and-forget desacoplado**:

- Si un log falla, la operación principal **no se ve afectada**.
- Si un componente nuevo no tiene logs, **funciona normalmente** sin errores.
- Si se elimina una llamada a `logActivity()`, **no hay efectos secundarios**.
- El sistema es **transversal e independiente**: se puede instrumentar cualquier componente en cualquier momento sin riesgo.

### Filosofía de precisión

Cada log incluye:
- **Descripción semántica** con nombre/identificador de la entidad (ej: `"Editó pago de $500.000 (Transferencia) en factura FAC-001"`)
- **Metadata estructurada** con valores relevantes: montos, campos modificados, valores anteriores/nuevos, nombres de archivos
- **Contexto completo**: módulo, tipo de entidad, ID de entidad, ruta

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
| `user_email` | TEXT | Email del usuario | `admin@fih.com` |
| `user_name` | TEXT | Nombre del perfil (puede ser null) | `Carlos Pérez` |
| `action` | TEXT | Tipo de acción realizada | `crear`, `editar`, `eliminar`, `subir` |
| `module` | TEXT | Módulo del sistema | `cursos`, `matriculas`, `personas` |
| `description` | TEXT | Descripción legible y precisa de la acción | `Creó el curso FI-25-04-01 (Trabajo en Alturas)` |
| `entity_type` | TEXT | Tipo de entidad afectada | `curso`, `matricula`, `persona` |
| `entity_id` | TEXT | ID de la entidad afectada | `uuid-de-la-entidad` |
| `metadata` | JSONB | Datos estructurados adicionales | `{ "valor_anterior": 500000, "valor_nuevo": 600000 }` |
| `route` | TEXT | Ruta en la que ocurrió la acción | `/cursos/abc-123` |
| `created_at` | TIMESTAMPTZ | Marca de tiempo automática | `2026-04-16T10:30:00Z` |

> **Nota importante:** La tabla **no tiene foreign keys** hacia otras tablas. Esto es intencional para garantizar independencia total.

---

## 4. Contexto global

### Archivo: `src/contexts/ActivityLoggerContext.tsx`

El `ActivityLoggerProvider` se monta en `App.tsx` envolviendo todas las rutas protegidas (dentro del `MainLayout`). Provee dos funcionalidades:

### 4.1. Función `logActivity()`

```typescript
interface LogActivityParams {
  action: string;          // Obligatorio: tipo de acción
  module?: string;         // Opcional: módulo del sistema
  description: string;     // Obligatorio: descripción legible y precisa
  entityType?: string;     // Opcional: tipo de entidad
  entityId?: string;       // Opcional: UUID de la entidad
  metadata?: Record<string, unknown>; // Opcional: datos estructurados
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

const { logActivity } = useActivityLogger();
```

Si el componente está fuera del `ActivityLoggerProvider`, `logActivity` será un **no-op** (función vacía).

### 4.4. Log de login (caso especial)

El login se registra directamente en `LoginForm.tsx` usando `supabase.from("user_activity_logs").insert(...)` porque el `ActivityLoggerProvider` aún no está montado en ese punto. El logout se registra en `MainLayout.tsx` antes de llamar a `signOut()`.

---

## 5. Servicio de consultas

### Archivo: `src/services/activityLogService.ts`

### `fetchUserActivitySummaries()`

- Consulta los últimos 10,000 registros
- Agrupa client-side por `user_id`
- Retorna: `user_id`, `user_email`, `user_name`, `total_actions`, `last_activity`

### `fetchUserActivityLogs(userId, filters?)`

- Límite de 500 registros por consulta
- Filtros opcionales: `module`, `action`, `from`, `to`
- Ordenado cronológicamente descendente

---

## 6. Interfaz de administración

### Ruta: `/admin/logs`

Vista principal con tabla de todos los usuarios con actividad registrada:
- **Columnas:** Nombre, Email, Cantidad de acciones, Última actividad
- **Buscador:** Filtra por nombre o email
- **Acceso:** Solo `superadministrador`

### Ruta: `/admin/logs/:userId`

Vista de detalle del historial de un usuario:
- **Filtros:** Selector de módulo y tipo de acción
- **Tabla cronológica:** Fecha/Hora, Acción (badge color), Módulo, Descripción, Ruta
- **Detalle expandible:** Click en fila muestra metadata JSON

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
| `subir` | Cyan |
| `importar` | Índigo |
| `completar` | Teal |
| `capturar` | Rosa |
| `generar_masivo` | Naranja |
| `revocar` | Rojo oscuro |
| `reemitir` | Cielo |
| `aprobar` | Esmeralda claro |
| `rechazar` | Rosa oscuro |
| `restaurar` | Violeta |
| `reabrir` | Lima |

---

## 7. Catálogo de acciones

| Acción | Cuándo usarla | Ejemplo de descripción |
|---|---|---|
| `crear` | Creación de una nueva entidad | `Creó persona Juan Pérez (CC 1234)` |
| `editar` | Modificación de una entidad existente | `Editó curso FI-25-04-01 (campos: nombre, lugar)` |
| `eliminar` | Eliminación de una entidad | `Eliminó empresa Acme S.A.S (NIT 900123456)` |
| `navegar` | Cambio de ruta (automático) | `Navegó a /cursos/abc-123` |
| `exportar` | Exportación de datos (CSV, Excel, PDF) | `Exportó listado Excel del curso FI-25-04-01 (8 col)` |
| `descargar` | Descarga de un archivo individual | `Descargó certificado de Juan Pérez` |
| `login` | Inicio de sesión | `Inició sesión` |
| `logout` | Cierre de sesión | `Cerró sesión` |
| `cambiar_estado` | Cambio de estado de una entidad | `Cambió estado del curso a "en_progreso"` |
| `activar` | Activación de una entidad | `Activó formato FOR-001 (Consentimiento)` |
| `desactivar` | Desactivación de una entidad | `Desactivó formato FOR-001` |
| `duplicar` | Duplicación de una entidad | `Duplicó formato FOR-001 (Consentimiento)` |
| `archivar` | Archivado de una entidad | `Archivó formato FOR-001` |
| `generar` | Generación individual (certificado, PDF) | `Generó certificado para Juan Pérez` |
| `generar_masivo` | Generación masiva (certificados, PDFs, ZIP) | `Generó 15 PDFs masivos del curso FI-25-04-01` |
| `restaurar` | Restauración de una versión anterior | `Restauró plantilla a versión 3` |
| `vincular` | Vinculación entre entidades | `Vinculó matrícula a grupo de cartera` |
| `desvincular` | Desvinculación entre entidades | `Desvinculó estudiante del curso` |
| `subir` | Subida de un archivo/documento/adjunto | `Subió documento Cédula para matrícula de Juan Pérez` |
| `importar` | Importación masiva desde archivo | `Importó 25 empresas desde archivo Excel` |
| `completar` | Formato/documento completado | `Completó formato Consentimiento de Salud` |
| `capturar` | Captura de firma digital | `Capturó firma del personal Carlos López` |
| `configurar` | Cambio de configuración | `Habilitó portal para nivel Alturas Básico` |
| `revocar` | Revocación de un certificado | `Revocó certificado CERT-001` |
| `reemitir` | Reemisión de un certificado | `Reemitió certificado CERT-001 (v2)` |
| `aprobar` | Aprobación de excepción/solicitud | `Aprobó excepción de certificación (motivo: ...)` |
| `rechazar` | Rechazo de excepción/solicitud | `Rechazó excepción de certificación` |
| `reabrir` | Reapertura de documento/formato | `Reabrió documento Evaluación para matrícula X` |

---

## 8. Acciones instrumentadas actualmente

### Auth

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `login` | `LoginForm.tsx` | Inicio de sesión (insert directo, fuera del provider) | — |
| `logout` | `MainLayout.tsx` | Cierre de sesión | — |

### Personas

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `PersonaFormPage.tsx` | Creación con nombre, documento, tipo | `{ tipo_documento, numero_documento }` |
| `editar` | `PersonaFormPage.tsx` | Edición con campos modificados | `{ campos_modificados }` |
| `eliminar` | `PersonasPage.tsx` | Eliminación individual con nombre | `{ nombre }` |
| `eliminar` | `PersonasPage.tsx` | Eliminación masiva con conteo | `{ cantidad, ids }` |
| `editar` | `PersonaDetailSheet.tsx` | Edición inline de campo específico | `{ campo, valor_anterior, valor_nuevo }` |

### Empresas

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `EmpresaFormPage.tsx` | Creación con nombre y NIT | `{ nit }` |
| `editar` | `EmpresaFormPage.tsx` | Edición con campos modificados | `{ campos_modificados }` |
| `eliminar` | `EmpresasPage.tsx` | Eliminación individual/masiva | `{ nombre/cantidad, ids }` |
| `editar` | `EmpresaDetailSheet.tsx` | Edición inline de campo | `{ campo, valor_anterior, valor_nuevo }` |
| `importar` | `ImportarEmpresasDialog.tsx` | Importación masiva desde Excel | `{ cantidad, archivo }` |
| `crear` | `CrearEmpresaModal.tsx` | Creación rápida desde matrícula | `{ nit }` |

### Matrículas

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `MatriculaFormPage.tsx` | Creación con persona, curso y valor | `{ persona_id, curso_id, valor_cupo }` |
| `editar` | `MatriculaDetallePage.tsx` | Edición con campos modificados | `{ campos_modificados }` |
| `pago` | `MatriculaDetallePage.tsx` | Registro de pago directo | `{ forma_pago, abono }` |
| `vincular_cartera` | `MatriculaDetallePage.tsx` | Vinculación a grupo de cartera | — |
| `eliminar` | `MatriculasPage.tsx` | Eliminación individual/masiva | `{ nombre/cantidad, ids }` |
| `editar` | `MatriculaDetailSheet.tsx` | Edición inline de campo | `{ campo, valor_anterior, valor_nuevo }` |
| `subir` | `MatriculaDetailSheet.tsx` | Subida de documento requerido | `{ documento, archivo }` |
| `eliminar` | `MatriculaDetailSheet.tsx` | Eliminación de documento | `{ documento }` |
| `capturar` | `MatriculaDetailSheet.tsx` | Captura de firma | — |
| `subir` | `DocumentosCarga.tsx` | Subida de documento por tipo | `{ tipo, nombre_archivo, tamano }` |
| `crear` | `CrearPersonaModal.tsx` | Creación rápida de persona | `{ tipo_documento, numero_documento }` |

### Cursos

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `CursoFormPage.tsx` | Creación con nombre y nivel | `{ nivel_formacion_id, tipo_formacion }` |
| `editar` | `CursoDetallePage.tsx` | Edición con campos modificados | `{ campos_modificados }` |
| `cambiar_estado` | `CursoDetallePage.tsx` | Cambio de estado | `{ estado_anterior, estado_nuevo }` |
| `exportar` | `CursoDetallePage.tsx` | Exportación CSV MinTrabajo | — |
| `cerrar` | `CloseCourseDialog.tsx` | Cierre de curso | — |
| `agregar_estudiantes` | `AgregarEstudiantesModal.tsx` | Agregar estudiantes con conteo | — |
| `remover_estudiante` | `EnrollmentsTable.tsx` | Remover estudiante con nombre | `{ estudiante_nombre, estudiante_id }` |
| `exportar` | `ExportarListadoDialog.tsx` | Exportación de listado con formato | `{ formato, columnas_seleccionadas }` |
| `generar_masivo` | `GenerarPdfsDialog.tsx` | Generación masiva de PDFs | `{ cantidad, formato }` |
| `generar_masivo` | `GeneracionMasivaDialog.tsx` | Generación masiva de certificados | `{ cantidad, plantilla_id }` |
| `crear` | `AddFechaMinTrabajoDialog.tsx` | Agregar fecha MinTrabajo | `{ fecha, motivo }` |
| `eliminar` | `MinTrabajoCard.tsx` | Eliminar fecha MinTrabajo | `{ fecha }` |
| `editar` | `CodigoEstudianteCard.tsx` | Configurar código de estudiante | `{ config }` |

### Niveles

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `NivelFormPage.tsx` | Creación con nombre y tipo | `{ tipo_formacion, duracion_horas }` |
| `editar` | `NivelFormPage.tsx` | Edición con campos modificados | `{ campos_modificados }` |
| `eliminar` | `NivelDetallePage.tsx` | Eliminación con nombre | — |
| `eliminar` | `NivelesPage.tsx` | Eliminación individual/masiva | `{ nombre/cantidad, ids }` |

### Personal

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `PersonalFormPage.tsx` | Creación con nombre y cargo | `{ cargo_id, numero_documento }` |
| `editar` | `PersonalFormPage.tsx` | Edición con campos modificados | `{ campos_modificados }` |
| `eliminar` | `GestionPersonalPage.tsx` | Eliminación individual/masiva | `{ nombre/cantidad, ids }` |
| `editar` | `PersonalDetailSheet.tsx` | Edición inline de campo | `{ campo, valor_anterior, valor_nuevo }` |
| `capturar` | `PersonalDetailSheet.tsx` | Guardado de firma digital | — |
| `eliminar` | `PersonalDetailSheet.tsx` | Eliminación de firma | — |
| `subir` | `PersonalDetailSheet.tsx` | Subida de adjunto | `{ nombre_archivo, tamano }` |
| `eliminar` | `PersonalDetailSheet.tsx` | Eliminación de adjunto | `{ nombre_archivo }` |
| `crear` | `GestionCargosModal.tsx` | Creación de cargo | `{ tipo }` |
| `editar` | `GestionCargosModal.tsx` | Edición de cargo | — |
| `eliminar` | `GestionCargosModal.tsx` | Eliminación de cargo | — |

### Formatos

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `FormatoEditorPage.tsx` | Creación con código y nombre | `{ codigo, categoria, motor_render }` |
| `editar` | `FormatoEditorPage.tsx` | Edición con campos modificados | `{ campos_modificados, version }` |
| `activar` | `FormatosPage.tsx` | Activación con nombre | — |
| `desactivar` | `FormatosPage.tsx` | Desactivación con nombre | — |
| `duplicar` | `FormatosPage.tsx` | Duplicación con nombre | — |
| `archivar` | `FormatosPage.tsx` | Archivado con nombre | — |
| `eliminar` | `FormatosPage.tsx` | Eliminación masiva con conteo | `{ cantidad }` |
| `restaurar` | `VersionHistoryDialog.tsx` | Restauración de versión | `{ version_restaurada }` |
| `reabrir` | `DynamicFormatoPreviewDialog.tsx` | Reapertura de formato completado | `{ formato_nombre }` |

### Certificación

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `editar` | `PlantillaEditorPage.tsx` | Guardado de plantilla con versión | `{ version, nombre }` |
| `restaurar` | `PlantillaEditorPage.tsx` | Restauración de versión | `{ version_restaurada }` |
| `generar` | `PlantillaEditorPage.tsx` | Generación individual de certificado | — |
| `crear` | `PlantillasPage.tsx` | Creación de plantilla | `{ nombre, tipo_formacion }` |
| `eliminar` | `PlantillasPage.tsx` | Eliminación de plantilla | `{ nombre }` |
| `generar` | `CertificacionSection.tsx` | Generación de certificado individual | `{ persona_nombre, curso_nombre }` |
| `revocar` | `CertificacionSection.tsx` | Revocación de certificado | `{ codigo, motivo }` |
| `reemitir` | `CertificacionSection.tsx` | Reemisión de certificado | `{ codigo, nueva_version }` |
| `aprobar` | `ExcepcionesPanel.tsx` | Aprobación de excepción | `{ motivo }` |
| `rechazar` | `ExcepcionesPanel.tsx` | Rechazo de excepción | `{ motivo }` |

### Cartera

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `CrearFacturaDialog.tsx` | Creación de factura con número y total | `{ numero_factura, total, matriculas_count }` |
| `editar` | `EditarFacturaDialog.tsx` | Edición con campos modificados | `{ campos_modificados, numero_factura }` |
| `eliminar` | `EditarFacturaDialog.tsx` | Eliminación de factura | `{ numero_factura }` |
| `crear` | `RegistrarPagoDialog.tsx` | Registro de pago con monto y método | `{ valor_pago, metodo_pago, factura_id }` |
| `editar` | `EditarPagoDialog.tsx` | Edición de pago con valores ant/nuevo | `{ valor_anterior, valor_nuevo, metodo_pago }` |
| `eliminar` | `EditarPagoDialog.tsx` | Eliminación de pago con monto | `{ valor_pago }` |

### Portal Admin

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `configurar` | `PortalAdminPage.tsx` | Configuración de documento | — |
| `configurar` | `PortalAdminPage.tsx` | Habilitación/deshabilitación de nivel | `{ nivel_nombre }` |
| `configurar` | `PortalAdminPage.tsx` | Toggle global del portal | `{ habilitado }` |
| `configurar` | `PortalAdminPage.tsx` | Reordenamiento de documentos | `{ nivel_nombre, cantidad_docs }` |
| `reabrir` | `MonitoreoDetalleDialog.tsx` | Reapertura de documento en monitoreo | `{ documento_key, matricula_id }` |

### Admin (Usuarios y Roles)

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `UsuariosTab.tsx` | Creación de usuario con email y rol | `{ email, rol_nombre }` |
| `editar` | `UsuariosTab.tsx` | Edición de usuario con rol nuevo | `{ email, rol_anterior, rol_nuevo }` |
| `eliminar` | `UsuariosTab.tsx` | Eliminación de usuario | `{ email }` |
| `editar` | `UsuariosTab.tsx` | Reinicio de contraseña | `{ email }` |
| `crear` | `RolesTab.tsx` | Creación de rol con permisos | `{ permisos }` |
| `editar` | `RolesTab.tsx` | Edición de rol con permisos | `{ permisos_nuevos }` |
| `eliminar` | `RolesTab.tsx` | Eliminación de rol | `{ nombre }` |

### Comentarios (transversal)

| Acción | Archivo | Descripción | Metadata |
|---|---|---|---|
| `crear` | `ComentariosSection.tsx` | Creación de comentario en entidad | `{ seccion, entidad_tipo, texto_preview }` |
| `editar` | `ComentariosSection.tsx` | Edición de comentario | `{ seccion }` |
| `eliminar` | `ComentariosSection.tsx` | Eliminación de comentario | `{ seccion }` |

### Navegación (automático)

| Acción | Archivo | Descripción |
|---|---|---|
| `navegar` | `ActivityLoggerContext.tsx` | Cada cambio de ruta se registra automáticamente |

---

## 9. Guía para añadir logs a nuevos componentes

### Paso 1: Importar el hook

```typescript
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
```

### Paso 2: Obtener la función

```typescript
const { logActivity } = useActivityLogger();
```

### Paso 3: Llamar en el callback de éxito

Coloca la llamada **después** de la operación principal exitosa:

```typescript
const handleCrear = async (data: FormData) => {
  try {
    const resultado = await crearEntidad(data);
    toast({ title: "Entidad creada exitosamente" });

    // ✅ Log DESPUÉS del éxito, nunca antes
    logActivity({
      action: "crear",
      module: "mi_modulo",
      description: `Creó ${resultado.nombre} (ID: ${resultado.codigo})`,
      entityType: "mi_entidad",
      entityId: resultado.id,
      metadata: {
        codigo: resultado.codigo,
        campo_relevante: resultado.campo,
      },
    });

    navigate("/mi-modulo");
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
    // ❌ NO registrar log en caso de error
  }
};
```

### Buenas prácticas de descripción

```typescript
// ❌ MAL: genérico, no aporta información
description: "Editó pago"

// ✅ BIEN: incluye monto, método y factura
description: `Editó pago de $${valor} (${metodo}) en factura ${numero}`

// ❌ MAL: sin contexto
description: "Eliminó empresa"

// ✅ BIEN: incluye nombre y NIT
description: `Eliminó empresa ${nombre} (NIT ${nit})`

// ❌ MAL: sin conteo
description: "Importó empresas"

// ✅ BIEN: incluye cantidad y origen
description: `Importó ${count} empresas desde ${archivo}`
```

### Buenas prácticas de metadata

```typescript
// Para ediciones: incluir campos modificados y valores
metadata: {
  campos_modificados: ["nombre", "email", "telefono"],
  valor_anterior: { nombre: "Juan" },
  valor_nuevo: { nombre: "Juan Carlos" },
}

// Para operaciones masivas: incluir conteo
metadata: {
  cantidad: 15,
  ids: ["uuid1", "uuid2", ...],
}

// Para archivos: incluir nombre y tamaño
metadata: {
  nombre_archivo: "cedula.pdf",
  tamano: 245000,
  tipo: "cedula",
}

// Para montos: incluir valores numéricos
metadata: {
  valor_pago: 500000,
  metodo_pago: "transferencia",
  factura_id: "uuid",
}
```

---

## 10. Convenciones de nomenclatura

### Acciones (`action`)

Ver [Catálogo de acciones](#catálogo-de-acciones) para la lista completa.

### Módulos (`module`)

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
| Autenticación | `auth` |

### Tipos de entidad (`entityType`)

`persona`, `empresa`, `matricula`, `curso`, `nivel`, `personal`, `formato`, `plantilla`, `certificado`, `factura`, `pago`, `usuario`, `rol`, `documento`, `excepcion_certificado`, `cargo`, `comentario`, `adjunto`, `fecha_mintrabajo`, `firma`, `codigo_estudiante`

### Descripción (`description`)

- Usar **tercera persona del pasado**: "Creó...", "Editó...", "Eliminó...", "Subió...", "Capturó..."
- Incluir **nombre o identificador** de la entidad: `"Editó el curso FI-25-04-01 (Trabajo en Alturas)"`
- Incluir **valores relevantes** cuando aplique: `"Registró pago de $500.000 (Transferencia)"`
- Ser **conciso pero informativo**: máximo ~120 caracteres

---

## 11. Preguntas frecuentes

### ¿Qué pasa si `logActivity()` falla?

Nada. La inserción es fire-and-forget (`.then(() => {})`). La operación principal del usuario ya se completó.

### ¿Qué pasa si creo un componente nuevo sin logs?

Funciona perfectamente. Los logs son opcionales.

### ¿Puedo usar `logActivity()` fuera del contexto?

El hook retornará un no-op. No hay error, simplemente no se registra nada.

### ¿Debo usar `await` con `logActivity()`?

**No.** La función es síncrona desde la perspectiva del componente.

### ¿Se registran las navegaciones automáticamente?

Sí. El `ActivityLoggerProvider` detecta cambios de ruta automáticamente.

### ¿Quién puede ver los logs?

Solo usuarios con rol `superadministrador` o `administrador` (controlado por RLS).

### ¿Hay límite de registros?

La tabla no tiene límite. Las consultas limitan a 10,000 para resumen y 500 por usuario en detalle.

### ¿Cómo agrego un nuevo módulo al mapa de navegación?

Edita el `moduleMap` en `ActivityLoggerContext.tsx`.

### ¿Cómo agrego un nuevo color de badge para una acción nueva?

Edita `ACTION_COLORS` y `ACTIONS` en `UserActivityLogPage.tsx`.

### ¿Cuántos puntos de instrumentación tiene el sistema?

Actualmente **~90+ puntos** distribuidos en **~40 archivos**, cubriendo todos los módulos del sistema.
