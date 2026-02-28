

## Plan: PARTE 7 — Habilitación por matrícula (control fino)

### Resumen

Agregar controles interactivos al `MonitoreoDetalleDialog` existente para permitir toggle del portal y override de documentos habilitados por matrícula individual.

---

### Archivos nuevos

#### 1. `src/services/portalMatriculaService.ts`
- `togglePortalMatricula(matriculaId, habilitado)` — modifica `mockMatriculas[i].portalEstudiante.habilitado`.
- `resetDocumentoMatricula(matriculaId, documentoKey)` — resetea el estado de un documento a `pendiente` (solo si está en `completado`).

### Archivos modificados

#### 2. `src/hooks/usePortalMonitoreo.ts`
- Agregar mutations: `useTogglePortalMatricula` y `useResetDocumentoMatricula` que invalidan `portal-monitoreo` on success.

#### 3. `src/components/portal-admin/MonitoreoDetalleDialog.tsx`
- **Sección Portal**: Reemplazar el `Badge` estático de portal habilitado/deshabilitado por un `Switch` interactivo que llama a `togglePortalMatricula`.
- **Sección Documentos**: Para cada documento con estado `completado`, agregar un botón pequeño "Reabrir" (icono `RotateCcw`) que resetea el documento a pendiente tras confirmación (`ConfirmDialog`).
- Importar `Switch`, `ConfirmDialog`, `Button`, iconos necesarios.
- Recibir callback `onDataChange` para refrescar la fila tras mutaciones.

#### 4. `src/components/portal-admin/MonitoreoTable.tsx`
- Pasar callback `onDataChange` al `MonitoreoDetalleDialog` que ejecuta `refetch` del query de monitoreo para actualizar la tabla tras cambios en el detalle.

