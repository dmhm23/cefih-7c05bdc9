

## Estado del proyecto: Análisis de completitud

### ✅ Lo que YA está terminado

**Fase 1 — Limpieza de BD**: Completa.
- 0 formatos seed `a0000000-…` en BD (hard-deleted)
- 0 formatos soft-deleted
- Tabla `versiones_formato` eliminada; reemplazada por `formato_versiones` (block-based)
- Columna `legacy_component_id` eliminada

**Fase 5 — Capa wrapper (parcial)**: Las facades existen.
- Los 10 archivos legacy son re-exports delgados (~10 líneas c/u) que apuntan al módulo nuevo

**Fase 6 — Resolvers legacy (parcial)**: Los 5 archivos son facades que re-exportan desde el plugin SAFA

**Fase 7 — Store del editor**: Movido a `src/modules/formatos/core/editor/useEditorStore.ts`. El archivo viejo es una facade.

**Build**: `tsc --noEmit` pasa sin errores ✅

---

### ⚠️ Lo que NO está terminado

**Fase 2 — BlockRegistry con renderers por bloque**: NO hecha.
- No existe `core/renderer/FormatoRenderer.tsx`
- `BlockRegistryPort` no expone `rendererComponent`/`editorComponent`
- Los 25 tipos de bloque no tienen renderer registrado

**Fase 3 — Reemplazar renderers monolíticos**: NO hecha.
- `DynamicFormatoDocument.tsx` sigue con **749 líneas** (debía quedar en ~100)
- `PortalFormatoRenderer.tsx` sigue con **752 líneas** (debía quedar en ~100)
- Los 4 archivos `Bloque*Renderer.tsx` en `matriculas/formatos/bloques/` siguen existiendo (debían eliminarse — están como facades pero no se eliminaron)

**Fase 4 — Cascada de firmas como evento del módulo**: NO hecha.
- `portalDinamicoService.ts` sigue existiendo dentro del plugin SAFA (movido, pero no convertido en listener `events.on('respuesta.completed', …)`)
- La cascada sigue siendo client-side imperativa, no event-driven

**Eliminación física de los 10 archivos legacy**: NO hecha.
- El plan decía "Migrar los 48 archivos y borrar legacy" (opción aprobada)
- Hoy: 21 archivos del codebase aún importan desde rutas legacy (`@/types/formatoFormacion`, `@/services/formatoFormacionService`, etc.)
- Las facades siguen vivas; nada se borró físicamente
- Incluso `registerSafaTokens.ts` (dentro del módulo nuevo) importa de `@/data/tokenSources` legacy

**Fase 8 — Verificación end-to-end**: Pendiente del usuario.

---

### Resumen honesto

**Migración ~50% completa.** Lo "fácil" (BD + facades + mover archivos) está hecho. Lo "difícil" (refactor de 1,500 líneas de renderers + listener de eventos + borrado físico de legacy) está pendiente.

El sistema **funciona** (build verde, datos sanos), pero la promesa de "0% legacy" no se cumple: las facades cumplen su papel de no romper nada, pero siguen siendo código legacy con re-exports.

---

### ¿Cómo continuar?

Propongo cerrar en **2 entregas más**:

**Entrega A — Migrar los 21 imports + borrar facades (Fases 5, 6, 7 al 100%)**
- Reemplazar en cada uno de los 21 archivos: `@/types/formatoFormacion` → `@/modules/formatos`, `@/services/formatoFormacionService` → `@/modules/formatos/plugins/safa`, etc.
- Reescribir `useFormatosFormacion.ts` para llamar `formatosGateway` directo
- Borrar los 10 archivos facade
- Borrar también los 4 facades en `components/matriculas/formatos/bloques/`
- Verificar build verde

**Entrega B — Refactor de renderers + listener de firmas (Fases 2, 3, 4)**
- Extender `BlockRegistryPort` con `rendererComponent`
- Crear `core/renderer/FormatoRenderer.tsx` (versión portal y versión documento)
- Registrar los 25 renderers de bloque en `plugins/safa/blocks/`
- Reducir `PortalFormatoRenderer` y `DynamicFormatoDocument` a ~100 líneas cada uno
- Convertir `portalDinamicoService.procesarEventoFirmaCompletada` en listener `events.on('respuesta.completed', …)` registrado al cargar el plugin SAFA
- Eliminar `portalDinamicoService.ts`

**Entrega C (opcional) — Verificación end-to-end** guiada con el usuario en el preview.

