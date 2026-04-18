

## Plan: Migración 100% al nuevo módulo `@/modules/formatos`

### Mi recomendación (importante leer antes)

**No recrear los formatos desde cero.** Los 7 formatos vivos en BD ya están en el formato correcto (motor `bloques`, `key = formato_id::text`, sin componentes legacy). El módulo nuevo los lee/escribe sin transformación. Recrearlos:
- destruiría 6 respuestas reales y 3 firmas de estudiantes,
- generaría re-trabajo manual de ~6 horas,
- no aporta nada técnico (la "limpieza" real está en el código, no en los datos).

Lo que sí está sucio es la **capa de código alrededor**: wrapper duplicado, tipos paralelos, renderers monolíticos de 750 líneas, resolvers hardcoded, store legacy. Eso sí lo eliminamos.

---

### Diagnóstico

| Capa | Estado | Acción |
|---|---|---|
| Datos en BD (7 formatos vivos) | Sanos, ya en formato nuevo | **Conservar** |
| 4 formatos seed soft-deleted (`a0000000-…`) | Borrados, sin uso | **Hard-delete** |
| 2 respuestas huérfanas al seed `…01` | Apuntan a formato a eliminar | **Hard-delete** (datos de prueba) |
| Tabla `versiones_formato` | 0 registros | **DROP** |
| Wrapper `formatoFormacionService.ts` | Capa duplicada sobre el gateway | **Eliminar** |
| Tipos `@/types/formatoFormacion.ts` | Duplicados de `core/types` | **Eliminar** y migrar imports al gateway |
| Hook `useFormatosFormacion.ts` | Usa wrapper | **Reescribir** sobre `formatosGateway` directo |
| `resolveAutoField.ts` + `autoFieldCatalog.ts` + `tokenSources.ts` | Switch hardcoded de 50 casos | **Eliminar** — ya migrado a `safa-tokens/` |
| `bloqueConstants.ts` | Catálogo estático de bloques | **Eliminar** — el `BlockRegistry` es la fuente |
| `useFormatoEditorStore.ts` | Store del editor con tipos legacy | **Mover** a `modules/formatos/core/editor/store/` |
| `portalDinamicoService.ts` | Cascada de firmas client-side | **Eliminar** — se reemplaza con listener del evento `respuesta.completed` dentro del módulo |
| Renderers `DynamicFormatoDocument` (747 L) y `PortalFormatoRenderer` (750 L) | Switches gigantes acoplados al dominio | **Refactor profundo**: cada bloque registra su propio renderer en el plugin SAFA |
| Renderers de bloques (`BloqueHealthConsentRenderer`, etc.) | Ya están separados parcialmente | **Mover** a `plugins/safa/blocks/` y registrar en el `BlockRegistry` |

---

### Fases

**Fase 1 — Limpieza de datos (BD)**
- Hard-delete de los 4 formatos seed `a0000000-…`
- Hard-delete de las 2 respuestas huérfanas (matrícula de prueba que diligenció el seed)
- Migración para borrar tabla `versiones_formato` (0 registros, sin uso)
- Migración para borrar columna `formatos_formacion.legacy_component_id` (todos NULL)
- Migración para borrar columnas `legacy_component_id`, `motor_render = 'plantilla_html'` ya no se usa — verificar antes de borrar

**Fase 2 — Extender el `BlockRegistry` con renderers por bloque**
- Ampliar `BlockRegistryPort` con `editorComponent?` y `rendererComponent?` opcionales por bloque
- Registrar en `plugins/safa/registerSafaPlugins.ts` el renderer de cada uno de los 25 tipos de bloque (los 4 ya tienen componente: HealthConsent, EvaluationQuiz, DataAuthorization, SatisfactionSurvey; los demás se extraen de los switches)
- Crear `core/renderer/FormatoRenderer.tsx` genérico que itera bloques y delega al `rendererComponent` registrado
- Cada renderer recibe `(bloque, value, onChange, ctx)` — `ctx` viene del `tokenContext` SAFA

**Fase 3 — Reemplazar renderers monolíticos**
- `PortalFormatoRenderer.tsx` → wrapper de 100 líneas que construye `tokenContext` SAFA y llama al `FormatoRenderer` core
- `DynamicFormatoDocument.tsx` → idem para vista documental
- Eliminar los 4 archivos `Bloque*Renderer.tsx` de `matriculas/formatos/bloques/` (movidos a `plugins/safa/blocks/`)

**Fase 4 — Cascada de firmas dentro del módulo**
- Mover lógica de `procesarEventoFirmaCompletada` a un listener interno del módulo: `events.on('respuesta.completed', ...)` que detecte bloques `signature_capture` con `tipoFirmante` y propague a otros formatos automáticos
- Eliminar `portalDinamicoService.ts` completo
- `usePortalEstudiante` y `DynamicPortalRenderer` consumen `formatosGateway` directo

**Fase 5 — Eliminar capa wrapper**
- Reescribir `useFormatosFormacion.ts` para llamar a `formatosGateway` directamente (el handler `formato.visibilityChanged` se mueve a un listener registrado en `modules/formatos/index.ts` o en `App.tsx` como bootstrap)
- `formatoFormacionService.ts` → eliminar
- `@/types/formatoFormacion.ts` → eliminar; todos los consumidores importan de `@/modules/formatos`
- Migrar imports en los ~40 archivos consumidores con un script de reemplazo

**Fase 6 — Eliminar resolvers legacy**
- `resolveAutoField.ts`, `autoFieldCatalog.ts`, `tokenSources.ts`, `bloqueConstants.ts`, `renderTemplate.ts` (utils) → eliminar
- Verificar que `safa-tokens/registerSafaTokens.ts` cubre todos los namespaces previos
- Migrar los componentes del editor (`InspectorFields`, `BlockCatalog`, etc.) a leer del `BlockRegistry` y `TokenRegistry`

**Fase 7 — Mover store del editor al módulo**
- `useFormatoEditorStore.ts` → `src/modules/formatos/core/editor/useEditorStore.ts`
- Tipos del store usan `Bloque` del core (no de `@/types/formatoFormacion`)

**Fase 8 — Verificación end-to-end**
- Crear un formato nuevo desde el editor
- Asignarlo a un nivel y publicarlo en portal
- Diligenciar como estudiante con firma
- Verificar cascada a formato automático
- Verificar conteo correcto en panel admin

---

### Estructura final

```text
src/modules/formatos/
├── core/
│   ├── types/          # Formato, Bloque, Respuesta
│   ├── editor/         # store + componentes UI editor
│   ├── renderer/       # FormatoRenderer genérico
│   ├── engine/         # tokens, validación
│   └── registry/       # BlockRegistry (con renderers), TokenRegistry, EventBus
├── contracts/          # Ports
├── adapters/
│   ├── supabase/       # único lugar con import de supabase
│   └── safa-tokens/    # resolvers persona/curso/firma...
├── plugins/safa/
│   ├── blocks/         # renderers SAFA por tipo de bloque
│   ├── listeners/      # cascada de firmas
│   └── registerSafaPlugins.ts
├── gateway/            # FormatoGateway
└── index.ts            # bootstrap singleton

src/  (lo que queda fuera)
├── pages/formatos/     # FormatosPage, FormatoEditorPage (consumen gateway)
├── pages/estudiante/   # DynamicPortalRenderer (consume gateway)
└── components/portal/PortalFormatoRenderer.tsx  # wrapper SAFA delgado
```

---

### Archivos eliminados

`src/services/formatoFormacionService.ts`, `src/services/portalDinamicoService.ts`, `src/services/formatoRespuestaService.ts`, `src/types/formatoFormacion.ts`, `src/utils/resolveAutoField.ts`, `src/utils/renderTemplate.ts`, `src/data/autoFieldCatalog.ts`, `src/data/tokenSources.ts`, `src/data/bloqueConstants.ts`, `src/components/matriculas/formatos/bloques/Bloque*Renderer.tsx` (4), `src/stores/useFormatoEditorStore.ts` (movido).

---

### Migraciones SQL

1. `DELETE FROM formato_respuestas WHERE formato_id IN ('a0000000-…01','…02','…03','…04')`
2. `DELETE FROM formatos_formacion WHERE id LIKE 'a0000000-0000-4000-8000-%'`
3. `DROP TABLE IF EXISTS versiones_formato`
4. `ALTER TABLE formatos_formacion DROP COLUMN legacy_component_id`

---

### Riesgos

- Refactor de los 2 renderers de 750 líneas es el cambio más delicado. Se hace bloque por bloque y se prueba cada uno antes de borrar el legacy.
- Los ~40 consumidores que importan de `@/types/formatoFormacion` se migran con búsqueda/reemplazo automatizado; el TypeScript build los detecta todos.
- Las 6 respuestas reales en BD se conservan intactas; el módulo nuevo las lee con la misma estructura.

---

### Entrega incremental

Fases 1+5+6 (limpieza + wrapper + resolvers) son independientes y se pueden hacer en una primera entrega. Fases 2+3 (renderers) son lo más grande — segunda entrega. Fases 4+7+8 cierran el ciclo.

