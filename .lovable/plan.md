

## Plan: PARTE 6 — Monitoreo Operativo del Portal Estudiante

### Resumen

Reemplazar el placeholder "Monitoreo" en la tab existente de `PortalAdminPage` con una tabla de monitoreo masivo que muestre todas las matriculas con estado de documentos del portal, filtros por curso/nivel/estado, y un modal de detalle por matricula.

---

### Archivos nuevos

#### 1. `src/services/portalMonitoreoService.ts`
- `getMonitoreoData()` — cruza `mockMatriculas` + `mockPersonas` + `mockCursos` + `portalDocumentosCatalogo` para generar filas de monitoreo.
- Cada fila: `matriculaId`, `personaNombre`, `personaCedula`, `cursoNombre`, `cursoNumeroCurso`, `tipoFormacion`, `fechaInicio`, `fechaFin`, `portalHabilitado`, `documentosEstado: { key, nombre, estado, enviadoEn?, puntaje?, firmaBase64? }[]`.
- Filtrado server-side mock por curso, nivel, estado de documento pendiente.

#### 2. `src/hooks/usePortalMonitoreo.ts`
- `usePortalMonitoreo(filtros?)` — React Query hook que llama al service.

#### 3. `src/components/portal-admin/MonitoreoTable.tsx`
- Tabla con columnas: Estudiante (nombre + cedula) | Curso | Nivel | Estado por documento (chips de color por cada doc del catalogo) | Fecha envio | Puntaje.
- Toolbar con busqueda + filtros (FilterPopover): curso, nivel de formacion, documento pendiente.
- Click en fila abre `MonitoreoDetalleDialog`.

#### 4. `src/components/portal-admin/MonitoreoDetalleDialog.tsx`
- Dialog/Sheet que muestra detalle del portal para una matricula especifica:
  - Datos del estudiante (nombre, cedula).
  - Datos del curso (nombre, nivel, fechas).
  - Toggle portal habilitado.
  - Lista de documentos con: nombre, estado (badge), fecha envio, firma (imagen si existe), puntaje (si aplica).

---

### Archivos modificados

#### 5. `src/pages/portal-admin/PortalAdminPage.tsx`
- Reemplazar placeholder de tab "Monitoreo" con componente `<MonitoreoTable />`.

---

### Detalles tecnicos

- Reutiliza `DataTable`, `TableToolbar`, `FilterPopover`, `StatusBadge` existentes.
- Los chips de estado por documento usan colores: verde (completado), amarillo (pendiente), gris (bloqueado).
- La firma se muestra como imagen en miniatura en el detalle.
- Filtros usan `FilterConfig` con opciones derivadas de cursos y niveles existentes en mock.

