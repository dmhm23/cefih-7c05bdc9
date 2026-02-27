

## Plan: PARTE 5 — Modulo Admin: Configuracion del Portal Estudiante

### Resumen

Crear un nuevo modulo administrativo en `/portal-estudiante` con dos sub-secciones: **Configuracion** (catalogo de documentos, reglas por nivel, dependencias) y preparacion para el **Monitoreo** (PARTE 6). Se integra en la navegacion principal del sidebar.

---

### Archivos nuevos

#### 1. `src/types/portalAdmin.ts`
- Tipo `PortalDocumentoConfigAdmin` extendiendo `DocumentoPortalConfig` con campo `habilitadoPorNivel: Record<TipoFormacion, boolean>` para controlar que documentos aplican a cada nivel.
- Tipo `PortalConfigGlobal` con `portalActivoPorDefecto: boolean` y `documentos: PortalDocumentoConfigAdmin[]`.

#### 2. `src/data/portalAdminConfig.ts`
- Mock inicial con los 2 documentos existentes (`info_aprendiz`, `evaluacion`) mapeados a todos los niveles de formacion.
- Exportar array mutable para CRUD en mock.

#### 3. `src/services/portalAdminService.ts`
- `getConfigGlobal()` — retorna configuracion completa.
- `saveDocumentoConfig(doc)` — crear/editar documento en catalogo.
- `deleteDocumentoConfig(key)` — eliminar documento del catalogo.
- `togglePortalGlobal(activo)` — toggle global.
- `updateOrdenDocumentos(keys[])` — reordenar.
- `updateDependencias(key, dependeDe[])` — actualizar dependencias.
- `updateHabilitacionNivel(key, nivel, activo)` — toggle por nivel.

#### 4. `src/hooks/usePortalAdmin.ts`
- Hooks con React Query: `usePortalAdminConfig`, `useSaveDocumentoConfig`, `useDeleteDocumentoConfig`, `useTogglePortalGlobal`, `useUpdateOrdenDocumentos`.

#### 5. `src/pages/portal-admin/PortalAdminPage.tsx`
- Pagina principal con layout `MainLayout`.
- Tabs: "Configuracion" (default) | "Monitoreo" (placeholder para PARTE 6).
- Header con titulo "Portal Estudiante — Administracion" y toggle global activo/inactivo.

#### 6. `src/components/portal-admin/DocumentosCatalogoTable.tsx`
- Tabla con columnas: Orden | Nombre | Tipo | Requiere Firma | Depende de | Niveles habilitados | Acciones.
- Drag-and-drop para reordenar (usando `@dnd-kit/sortable` ya instalado).
- Acciones por fila: Editar, Eliminar.
- Boton "Agregar documento" en toolbar.

#### 7. `src/components/portal-admin/DocumentoConfigDialog.tsx`
- Dialog para crear/editar un documento del catalogo.
- Campos: `key` (solo creacion), nombre, tipo (select: firma_autorizacion, evaluacion, formulario, solo_lectura), requiere firma (switch), depende de (multi-select de keys existentes).
- Seccion "Habilitado por nivel": checkboxes para cada `TipoFormacion` (Reentrenamiento, Jefe de Area, Trabajador Autorizado, Coordinador T.A.).

#### 8. `src/components/portal-admin/NivelesHabilitacionGrid.tsx`
- Grid visual que muestra la matriz documentos x niveles con toggles.

---

### Archivos modificados

#### 9. `src/components/layout/AppSidebar.tsx`
- Agregar item "Portal Estudiante" con icono `Smartphone` apuntando a `/portal-estudiante`.

#### 10. `src/App.tsx`
- Importar `PortalAdminPage`.
- Agregar ruta `/portal-estudiante` con `WithLayout`.

#### 11. `src/data/portalEstudianteConfig.ts`
- Actualizar `PORTAL_DOCUMENTOS_CONFIG` para que se alimente del catalogo admin (importar desde `portalAdminConfig`).

#### 12. `src/services/portalEstudianteService.ts`
- Modificar `getPortalConfig()` y `getDocumentosEstado()` para que consulten la configuracion admin y filtren por el `tipoFormacion` del curso de la matricula.

---

### Detalles tecnicos

- **Patron de datos**: El catalogo admin es la fuente de verdad. El portal publico filtra segun el nivel del curso.
- **Reordenamiento**: Usa `@dnd-kit/sortable` (ya instalado) en la tabla del catalogo.
- **Persistencia mock**: Array mutable en `portalAdminConfig.ts`, manipulado por `portalAdminService.ts`.
- **Tipos de documento**: Se reutiliza `TipoDocPortal` existente (`firma_autorizacion | evaluacion | formulario | solo_lectura`).
- **Niveles**: Se reutiliza `TipoFormacion` del tipo `Curso` para los checkboxes de habilitacion.

