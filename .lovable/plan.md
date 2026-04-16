

# Plan: Rediseño del Sistema de Logs — Precisión y Cobertura Completa

## Diagnóstico del estado actual

### Lo que funciona bien
- Arquitectura **fire-and-forget** sólida: no bloquea operaciones principales
- El `ActivityLoggerContext` con auto-log de navegación es correcto
- La tabla `user_activity_logs` tiene una estructura flexible (metadata JSONB)
- ~40 puntos de instrumentación distribuidos en 22 archivos

### Problemas identificados

**1. Descripciones genéricas sin contexto útil**
- `"Editó pago"` → no dice monto, factura ni grupo
- `"Cambió rol de usuario"` → no dice a qué rol cambió
- `"Agregó 3 estudiante(s) al curso"` → no dice cuáles estudiantes ni qué curso
- `"Archivó formato"` → no dice nombre del formato

**2. Falta de metadata estructurada**
- La mayoría de llamadas pasan `metadata` vacío o no lo usan
- No se registran campos modificados, valores anteriores/nuevos, montos, nombres de archivos

**3. Acciones sin instrumentar (~30 puntos ciegos)**

| Área | Acciones sin log |
|---|---|
| **PersonalDetailSheet** | Editar perfil, guardar/eliminar firma, subir/eliminar adjuntos |
| **MatriculaDetallePage** | Subir documentos, capturar firma, cambiar estado docs |
| **DocumentosCarga** | Upload de cada documento requerido |
| **ImportarEmpresasDialog** | Importación masiva (nuevo) |
| **EmpresaDetailSheet** | Edición inline de empresa |
| **PersonaDetailSheet** | Edición inline de persona |
| **PortalFormatoRenderer** | Estudiante completa/firma formato |
| **ExportarListadoDialog** | Exportación de listados |
| **GenerarPdfsDialog** | Generación masiva de PDFs |
| **GeneracionMasivaDialog** | Generación masiva de certificados |
| **RegistrarPagoDialog** | Le falta metadata del monto |
| **Login** | No se registra el inicio de sesión |

## Propuesta de solución

### Estrategia: Enriquecimiento progresivo en componentes

La mejor opción es **mantener la arquitectura actual** (context + `logActivity()` en componentes) pero mejorarla en dos dimensiones:

1. **Enriquecer los logs existentes** con descripciones precisas y metadata estructurada
2. **Instrumentar los puntos ciegos** donde no hay logs

No se recomienda un enfoque de interceptores o edge functions porque:
- Las acciones relevantes ya tienen callbacks claros (`onSuccess`, `try/catch`)
- El contexto semántico (nombre de entidad, campos modificados) solo está disponible en el componente
- Un interceptor genérico de Supabase produciría logs técnicos, no descriptivos

### Cambios concretos

#### Fase 1: Enriquecer logs existentes (~20 archivos)

Patrón de mejora — Ejemplo antes/después:

```text
ANTES:
logActivity({ action: "editar", module: "cartera", description: "Editó pago", entityType: "pago", entityId: pago.id })

DESPUÉS:
logActivity({
  action: "editar",
  module: "cartera",
  description: `Editó pago de $${pago.valorPago} en factura ${factura.numeroFactura}`,
  entityType: "pago",
  entityId: pago.id,
  metadata: {
    factura_id: factura.id,
    valor_anterior: oldValor,
    valor_nuevo: newValor,
    metodo_pago: pago.metodoPago,
  }
})
```

Cada log existente se revisará para:
- Incluir **nombre/identificador** de la entidad en la descripción
- Incluir **valores relevantes** en metadata (montos, campos modificados, nombres de archivos)
- Usar **verbos precisos** en la descripción: "Subió documento de cédula para Juan Pérez" en vez de "Editó matrícula"

#### Fase 2: Instrumentar puntos ciegos (~12 componentes)

| Componente | Acciones a instrumentar |
|---|---|
| `PersonalDetailSheet` | `editar` perfil, `subir` firma, `eliminar` firma, `subir` adjunto, `eliminar` adjunto |
| `MatriculaDetallePage` | `subir` documento requerido, `capturar` firma |
| `DocumentosCarga` | `subir` archivo por tipo de documento |
| `ImportarEmpresasDialog` | `importar` empresas masivas (con conteo) |
| `EmpresaDetailSheet` | `editar` empresa inline |
| `PersonaDetailSheet` | `editar` persona inline |
| `ExportarListadoDialog` | `exportar` listado con formato y columnas |
| `GenerarPdfsDialog` | `generar` PDFs masivos |
| `GeneracionMasivaDialog` | `generar` certificados masivos |
| `LoginForm` | `login` exitoso |
| `PortalFormatoRenderer` | `completar` formato por estudiante |
| `MainLayout` | `logout` (mover desde AppSidebar si aplica) |

#### Fase 3: Registrar login en `LoginForm.tsx`

```typescript
logActivity({ action: "login", module: "auth", description: "Inició sesión" });
```

### Nuevas acciones a agregar al catálogo

| Acción | Uso |
|---|---|
| `subir` | Upload de archivo/documento/adjunto |
| `importar` | Importación masiva desde archivo |
| `completar` | Formato completado por estudiante |
| `capturar` | Captura de firma digital |
| `generar_masivo` | Generación masiva (certificados, PDFs) |

### Archivos a modificar

| Archivo | Tipo de cambio |
|---|---|
| `src/pages/cursos/CursoDetallePage.tsx` | Enriquecer metadata |
| `src/pages/cursos/CursoFormPage.tsx` | Enriquecer descripción |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Enriquecer + agregar logs de docs/firma |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Enriquecer metadata |
| `src/pages/personas/PersonaFormPage.tsx` | Enriquecer metadata |
| `src/pages/empresas/EmpresaFormPage.tsx` | Enriquecer metadata |
| `src/pages/formatos/FormatosPage.tsx` | Enriquecer descripción |
| `src/pages/formatos/FormatoEditorPage.tsx` | Enriquecer metadata |
| `src/pages/certificacion/PlantillaEditorPage.tsx` | Enriquecer metadata |
| `src/pages/personal/PersonalFormPage.tsx` | Enriquecer metadata |
| `src/pages/niveles/NivelFormPage.tsx` | Enriquecer metadata |
| `src/pages/niveles/NivelDetallePage.tsx` | Enriquecer metadata |
| `src/components/personal/PersonalDetailSheet.tsx` | **Nuevo**: logs de firma/adjuntos/edición |
| `src/components/empresas/ImportarEmpresasDialog.tsx` | **Nuevo**: log de importación masiva |
| `src/components/empresas/EmpresaDetailSheet.tsx` | **Nuevo**: log de edición inline |
| `src/components/personas/PersonaDetailSheet.tsx` | **Nuevo**: log de edición inline |
| `src/components/matriculas/DocumentosCarga.tsx` | **Nuevo**: log de upload de documentos |
| `src/components/cursos/ExportarListadoDialog.tsx` | **Nuevo**: log de exportación |
| `src/components/cursos/GenerarPdfsDialog.tsx` | **Nuevo**: log de generación masiva |
| `src/components/cursos/GeneracionMasivaDialog.tsx` | **Nuevo**: log de certificados masivos |
| `src/components/cartera/EditarPagoDialog.tsx` | Enriquecer con montos |
| `src/components/cartera/RegistrarPagoDialog.tsx` | Enriquecer con montos |
| `src/components/cartera/CrearFacturaDialog.tsx` | Enriquecer con datos factura |
| `src/components/cartera/EditarFacturaDialog.tsx` | Enriquecer con datos factura |
| `src/components/admin/UsuariosTab.tsx` | Enriquecer (incluir nombre de rol) |
| `src/components/admin/RolesTab.tsx` | Enriquecer (incluir permisos) |
| `src/components/LoginForm.tsx` | **Nuevo**: log de login |
| `src/components/cursos/EnrollmentsTable.tsx` | Enriquecer (nombre estudiante) |
| `src/pages/admin/UserActivityLogPage.tsx` | Agregar nuevas acciones al filtro y colores |
| `Docs/sistemaLogs.md` | Actualizar documentación |

### Principios que se mantienen

- **Fire-and-forget**: sin `await`, sin bloqueo
- **Independencia total**: si se quita un log, nada se rompe
- **Sin dependencias nuevas**: no se agregan librerías, edge functions ni interceptores
- **Misma tabla y schema**: `user_activity_logs` no cambia de estructura
- **Metadata JSONB flexible**: cada acción incluye datos específicos sin cambiar el schema

### Estimación

~30 archivos a modificar, la mayoría con cambios de 2-10 líneas por punto de instrumentación. Es un trabajo extenso pero mecánico y seguro.

