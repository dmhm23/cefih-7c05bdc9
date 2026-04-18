
El usuario pide crear `Docs/RefactorizacionFormatos.md` documentando todo el proceso de refactorización del módulo de formatos. Es una tarea de creación de documentación (no requiere refactor de código). Necesito plan + aprobación para entrar en modo default y escribir el archivo.

Tengo todo el contexto en la conversación: 8 fases del plan original, 3 entregas (A, B, C), archivos creados/borrados, decisiones arquitectónicas.

## Plan: Crear `Docs/RefactorizacionFormatos.md`

### Contenido del documento (estructura)

**1. Contexto y objetivo**
- Punto de partida: módulo de formatos acoplado al dominio SAFA, con renderers monolíticos, tipos duplicados, resolvers hardcoded.
- Meta: extraer un módulo `@formatos` 100% genérico, listo para publicar como librería npm, sin romper datos existentes (7 formatos vivos, 6 respuestas, 3 firmas).

**2. Diagnóstico inicial**
- Tabla de capas con su estado: datos sanos vs código sucio.
- Decisión: conservar datos en BD, refactor solo la capa de código.

**3. Arquitectura objetivo**
- Diagrama ASCII de `src/modules/formatos/` (core, contracts, adapters, plugins/safa, gateway).
- Principios: core no conoce dominio; ports + adapters; bloques extensibles via registry; efectos secundarios via eventos.

**4. Fases ejecutadas**
- Fase 1 — Limpieza de BD (hard-delete de seeds, drop de `versiones_formato`, drop de `legacy_component_id`).
- Fase 2 — `BlockRegistryPort` extendido con `RendererComponent`/`EditorComponent`/`InspectorComponent`.
- Fase 3 — Migración de bloques de dominio (`HealthConsent`, `EvaluationQuiz`, `DataAuthorization`, `SatisfactionSurvey`) a `plugins/safa/blocks/portal/`.
- Fase 4 — Cascada de firmas como listener event-driven (`firmaCascadeListener` suscrito a `respuesta.completed`).
- Fase 5 — Eliminación de wrapper `formatoFormacionService`, `useFormatosFormacion` reescrito sobre `formatosGateway`.
- Fase 6 — Eliminación de resolvers legacy (`resolveAutoField`, `tokenSources`, `autoFieldCatalog`, `bloqueConstants`, `renderTemplate`).
- Fase 7 — Store del editor movido a `core/editor/useEditorStore.ts`.
- Fase 8 — Verificación end-to-end.

**5. Entregas (cronología)**
- Entrega A: 33 imports migrados, 14 facades borrados físicamente.
- Entrega B: BlockRegistry extendido + listener de firmas event-driven + delegación al gateway.
- Entrega C: Verificación (build verde, 0 referencias legacy, datos sanos).

**6. Archivos clave**
- Creados: `gateway/`, `contracts/`, `adapters/supabase/`, `adapters/safa-tokens/`, `plugins/safa/`, `core/editor/useEditorStore.ts`, `firmaCascadeListener.ts`, `portalSyncListener.ts`, 4 renderers de bloques portal.
- Eliminados: 14 archivos legacy listados.

**7. Estado actual**
- Lo que funciona (build verde, módulo publicable, eventos desacoplados).
- Deuda técnica restante: `PortalFormatoRenderer` (~752 líneas) y `DynamicFormatoDocument` (~749 líneas) siguen monolíticos. `BlockRegistry.RendererComponent` está expuesto pero no consumido por estos renderers. Justificación: sus layouts (portal guiado vs PDF grilla) son radicalmente distintos y comparten solo los renderers de dominio.

**8. Cómo usar el módulo**
- Snippet de código mostrando `import { formatosGateway } from '@/modules/formatos'`.
- Ejemplo de listener: `formatosGateway.events.on('respuesta.completed', ...)`.

**9. Próximos pasos sugeridos**
- Reducir los 2 renderers monolíticos delegando al `RendererComponent` por bloque.
- Extraer el módulo a paquete npm independiente.

### Acción única
Crear el archivo `Docs/RefactorizacionFormatos.md` (~400 líneas, todo en español, sin emojis).
