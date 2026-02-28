

## Plan: PARTE 8 — Escalabilidad: nuevos documentos habilitables

### Problema actual

Las rutas del portal estudiante están hardcodeadas: `/estudiante/documentos/info_aprendiz` y `/estudiante/documentos/evaluacion` apuntan a componentes específicos. Agregar un nuevo documento requiere crear una ruta nueva en `App.tsx` y un componente dedicado.

### Cambios

#### 1. Crear `src/pages/estudiante/DocumentoRendererPage.tsx` (nuevo)
- Página genérica que recibe `:documentoKey` de la URL.
- Consulta la config del documento (`useDocumentosPortal`) para obtener su `tipo`.
- Usa un registro de renderers por `TipoDocPortal` para despachar al componente correcto:
  - `firma_autorizacion` → `InfoAprendizPage` (componente existente, extraído como renderer)
  - `evaluacion` → `EvaluacionPage` (componente existente)
  - `formulario` → placeholder "Formulario en construcción"
  - `solo_lectura` → placeholder "Documento de solo lectura"
- Si el documento está bloqueado, redirige a `/estudiante/inicio`.
- Si no existe config para el key, muestra mensaje de error.

#### 2. Simplificar `src/App.tsx`
- Eliminar las rutas hardcodeadas de `info_aprendiz` y `evaluacion`.
- Dejar una sola ruta genérica: `/estudiante/documentos/:documentoKey` → `DocumentoRendererPage`.
- Eliminar el placeholder inline actual de "Documento en construcción".

#### 3. Ajustar `InfoAprendizPage` y `EvaluacionPage`
- Ambos ya reciben `matriculaId` desde el contexto de sesión, no necesitan cambios funcionales.
- `DocumentoRendererPage` simplemente renderiza el componente correcto basándose en el tipo.

#### 4. `PanelDocumentosPage` — sin cambios
- Ya se alimenta del catálogo/config dinámicamente, no tiene nada hardcodeado. Las cards ya son dinámicas.

### Resultado
- Agregar un nuevo documento solo requiere: (1) crearlo en el catálogo admin, (2) opcionalmente registrar un renderer si es un tipo nuevo.
- Los tipos existentes (`firma_autorizacion`, `evaluacion`) funcionan automáticamente para cualquier nuevo documento de ese tipo.

