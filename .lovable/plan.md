

## Plan: Reemplazo del Módulo de Gestión de Formatos — Plantillas HTML con Tokens

### Evaluación de viabilidad

**Estado actual**: El sistema usa un constructor de bloques declarativos (`@dnd-kit`) con ~18 tipos de bloque, un inspector lateral, y resolución de campos automáticos via `resolveAutoField.ts`. Hay 4 formatos legacy con componentes hardcodeados (InfoAprendiz, RegistroAsistencia, ParticipacionPtaAts, EvaluacionReentrenamiento) que se renderizan tanto desde el builder como desde componentes específicos en matrículas.

**Lo que se reemplaza**: El editor de bloques + drag & drop del `FormatoEditorPage.tsx`, la paleta de bloques, el `BloqueInspector`, y el `FormatoPreviewDocument.tsx` (preview con datos dummy).

**Lo que se preserva**: Los 4 formatos legacy y sus componentes de renderizado en matrículas (`DynamicFormatoDocument.tsx`, los 4 `*PreviewDialog.tsx`) siguen funcionando para matrículas existentes. El `resolveAutoField.ts` y `autoFieldCatalog.ts` se reutilizan como fuente de tokens.

**Veredicto**: Viable. El nuevo sistema reemplaza el editor (cómo se crean formatos) pero mantiene el consumo en matrículas intacto.

---

### Estrategia de migración

Los 4 formatos legacy se migran a plantillas HTML preconstruidas. Su `htmlTemplate` contendrá el HTML equivalente con tokens `{{persona.nombreCompleto}}`. El campo `bloques` se mantiene para compatibilidad con el renderizador de matrículas existente (`DynamicFormatoDocument.tsx`), pero el editor nuevo trabaja exclusivamente con `htmlTemplate`.

---

### Fase 1 — Modelo de datos y servicio (base)

#### 1.1 `src/types/formatoFormacion.ts` — Extensión
- Agregar campo `motorRender: 'bloques' | 'plantilla_html'` (default `'bloques'` para los 4 existentes)
- Agregar `htmlTemplate?: string`
- Agregar `cssTemplate?: string`
- Agregar `categoria: 'formacion' | 'evaluacion' | 'asistencia' | 'pta_ats' | 'personalizado'`
- Agregar `estado: 'borrador' | 'activo' | 'archivado'` (reemplaza `activo: boolean`)
- Agregar `usaEncabezadoInstitucional: boolean`
- Agregar `plantillaBaseId?: string`
- Agregar interface `FormatoVersion { id, formatoId, version, htmlTemplate, cssTemplate?, createdAt, creadoPor? }`
- Agregar interface `EncabezadoConfig` (logo, nombre centro, código, versión, fecha, paginación, alineación)
- Agregar `encabezadoConfig?: EncabezadoConfig`
- Mantener `bloques` como campo opcional para compatibilidad legacy
- Agregar `tokensUsados?: string[]` (tokens presentes en la plantilla)

#### 1.2 `src/data/tokenSources.ts` — Nuevo
- Catálogo de tokens con notación `{{grupo.campo}}` agrupados por: Persona, Curso, Empresa, Centro, Personal, Matrícula
- Función `getTokenCategories()` que retorna categorías con sus tokens
- Mapeo interno `tokenKey → AutoFieldKey` para reutilizar `resolveAutoField.ts`
- Cada token: `{ key: 'persona.nombreCompleto', label: 'Nombre completo', category: 'Persona', description?: string }`

#### 1.3 `src/utils/renderTemplate.ts` — Nuevo
- `renderTemplate(html, context)`: reemplazo de `{{grupo.campo}}` por valores con regex simple (sin Handlebars)
- `buildFormatoContext(persona, matricula, curso, empresa, entrenador, supervisor)`: construye el diccionario de contexto reutilizando `resolveAutoField.ts` internamente
- `detectUnresolvedTokens(renderedHtml)`: devuelve tokens sin resolver
- Sin dependencias externas

#### 1.4 `src/services/formatoFormacionService.ts` — Refactorizar
- Migrar los 4 formatos mock a incluir `motorRender: 'bloques'`, `categoria`, `estado: 'activo'`
- Agregar 3 plantillas HTML de ejemplo con `motorRender: 'plantilla_html'`:
  - "Constancia de Asistencia" (personalizado)
  - "Acta de Compromiso" (personalizado)
  - "Formato Libre Institucional" (personalizado)
- Agregar 3-4 plantillas base (templates preconstruidos que se pueden duplicar)
- Agregar métodos: `saveVersion()`, `getVersiones()`, `restoreVersion()`, `archive()`, `getPlantillasBase()`
- Mantener todos los métodos existentes (`getAll`, `getById`, `create`, `update`, `duplicate`, `getForMatricula`)

#### 1.5 `src/hooks/useFormatosFormacion.ts` — Extender
- Agregar hooks: `useFormatoVersiones(formatoId)`, `useSaveVersion()`, `useRestoreVersion()`, `useArchiveFormato()`, `usePlantillasBase()`

---

### Fase 2 — Editor de plantillas HTML

#### 2.1 `src/components/formatos/TemplateEditor.tsx` — Nuevo
- Editor TipTap con toolbar: negrita, cursiva, encabezados (H1-H3), listas, tabla simple, separador, alineación
- Toggle de modo: "Editor visual" ↔ "Código HTML" (textarea raw)
- Los tokens insertados se renderizan como `<span>` con estilo visual de badge inline (fondo azul claro)
- Toolbar de inserción rápida de bloques predefinidos: título, subtítulo, párrafo, tabla, firma, separador, checkbox, texto legal

#### 2.2 `src/components/formatos/TokenLibrary.tsx` — Nuevo
- Panel lateral derecho con tokens agrupados por categoría (tabs o acordeones)
- Buscador de tokens en la parte superior
- Clic en token → inserta `{{grupo.campo}}` en la posición del cursor del editor TipTap
- Cada token muestra nombre legible + clave técnica

#### 2.3 `src/components/formatos/EncabezadoConfigCard.tsx` — Nuevo
- Card con toggles para configurar el encabezado institucional: logo, nombre centro, código, versión, fechas
- Selector de alineación
- Preview en miniatura del encabezado

#### 2.4 `src/components/formatos/PlantillaBasePicker.tsx` — Nuevo
- Grid de plantillas base disponibles para duplicar como punto de partida
- Preview en miniatura de cada plantilla
- Se muestra al crear un nuevo formato tipo plantilla HTML

#### 2.5 `src/components/formatos/VersionHistoryDialog.tsx` — Nuevo
- Dialog con tabla de versiones: número, fecha, autor
- Botón "Restaurar" con confirmación

#### 2.6 `src/pages/formatos/FormatoEditorPage.tsx` — Reescribir
- Al crear nuevo formato, ofrecer elegir entre "Constructor de Bloques" (legacy) y "Plantilla HTML"
- Si `motorRender === 'plantilla_html'`: layout de 3 zonas:
  - **Barra superior**: nombre, estado, guardar, guardar versión, vista previa, publicar
  - **Panel central**: `TemplateEditor` (TipTap)
  - **Panel derecho**: `TokenLibrary` + `EncabezadoConfigCard`
- Si `motorRender === 'bloques'`: mantener el editor de bloques actual sin cambios (compatibilidad legacy)
- Configuración general (nombre, código, versión, alcance, firmas) en cards colapsables arriba del editor

---

### Fase 3 — Vista previa y exportación

#### 3.1 `src/components/formatos/TemplatePreviewDialog.tsx` — Nuevo
- Selector de contexto: elegir una matrícula para inyectar datos reales (usando `useMatriculas`, `usePersonas`, `useCursos`)
- Render del HTML con tokens reemplazados via `renderTemplate()`
- Alerta visual de tokens sin resolver
- Encabezado institucional renderizado si `usaEncabezadoInstitucional === true`
- Botón "Descargar PDF" via `window.print()` (patrón existente)

#### 3.2 `src/components/formatos/FormatoPreviewDialog.tsx` — Modificar
- Detectar `motorRender` del formato
- Si es `plantilla_html` → delegar a `TemplatePreviewDialog`
- Si es `bloques` → mantener lógica actual

---

### Fase 4 — Listado y navegación

#### 4.1 `src/pages/formatos/FormatosPage.tsx` — Modificar
- Agregar columna "Tipo" con badge: "Bloques" o "Plantilla"
- Agregar columna "Categoría" con badge por categoría
- Agregar filtro por categoría y por tipo (bloques/plantilla)
- Acción "Historial" en RowActions
- Acción "Archivar" (cambia estado a `'archivado'`, se oculta del listado principal)
- Reemplazar columna "Estado" para reflejar borrador/activo/archivado

---

### Dependencias nuevas
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-text-align` — editor rich text

### Archivos nuevos
| Archivo | Descripción |
|---------|-------------|
| `src/data/tokenSources.ts` | Catálogo de tokens `{{grupo.campo}}` |
| `src/utils/renderTemplate.ts` | Motor de render y contexto |
| `src/components/formatos/TemplateEditor.tsx` | Editor TipTap |
| `src/components/formatos/TokenLibrary.tsx` | Panel de tokens |
| `src/components/formatos/EncabezadoConfigCard.tsx` | Config encabezado |
| `src/components/formatos/PlantillaBasePicker.tsx` | Picker de plantillas base |
| `src/components/formatos/VersionHistoryDialog.tsx` | Historial de versiones |
| `src/components/formatos/TemplatePreviewDialog.tsx` | Preview con datos reales |

### Archivos modificados
| Archivo | Cambio |
|---------|--------|
| `src/types/formatoFormacion.ts` | Nuevos campos y interfaces |
| `src/services/formatoFormacionService.ts` | Nuevos métodos + mock data HTML |
| `src/hooks/useFormatosFormacion.ts` | Nuevos hooks |
| `src/pages/formatos/FormatoEditorPage.tsx` | Bifurcación por `motorRender` |
| `src/pages/formatos/FormatosPage.tsx` | Columnas y filtros nuevos |
| `src/components/formatos/FormatoPreviewDialog.tsx` | Delegación por motor |

### Lo que NO cambia
- `DynamicFormatoDocument.tsx` y su renderizado en matrículas
- Los 4 componentes legacy (`InfoAprendizDocument`, `RegistroAsistenciaDocument`, etc.)
- `resolveAutoField.ts` — se reutiliza internamente
- `autoFieldCatalog.ts` — se mantiene como fuente canónica
- `bloqueConstants.ts` — se mantiene para el modo bloques legacy
- `BloqueInspector.tsx` — se mantiene para el modo bloques legacy

