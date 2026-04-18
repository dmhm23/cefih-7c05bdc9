

## Plan de refactorización: Módulo de Formatos como librería desacoplada

### Diagnóstico de acoplamiento actual

**Acoplamientos rígidos identificados:**

1. **Tipos de bloque cerrados** (`TipoBloque` en `formatoFormacion.ts`): 25+ tipos hard-coded incluyendo bloques específicos del dominio (`health_consent`, `evaluation_quiz`, `satisfaction_survey`, `attendance_by_day`, `signature_aprendiz/entrenador/supervisor`). Imposible añadir un bloque sin tocar el core.

2. **Catálogo de auto-fields hard-coded** (`resolveAutoField.ts` + `autoFieldCatalog.ts`): un `switch` con 50+ casos vinculados a entidades del dominio (`Persona`, `Matricula`, `Curso`, `Personal`). El módulo importa tipos de negocio directamente.

3. **Servicio acoplado a Supabase y al esquema** (`formatoFormacionService.ts`): usa `supabase` directamente, mapea columnas snake/camel, conoce `portal_config_documentos`, `firmas_matricula`, `formato_respuestas`, `matriculas`, `niveles_formacion`.

4. **Renderers acoplados al dominio**:
   - `PortalFormatoRenderer.tsx` (750 líneas) y `DynamicFormatoDocument.tsx` (747 líneas) importan `Persona`, `Matricula`, `Curso`, `Personal`.
   - Lógica de firma reutilizable y herencia entre formatos vive en el renderer.

5. **Auto-sync con módulos externos** dentro del servicio: `syncPortalConfig` escribe en `portal_config_documentos`. `procesarEventoFirmaCompletada` (en `portalDinamicoService`) busca formatos por `eventos_disparadores` y escribe `formato_respuestas` para otros formatos.

6. **Triggers SQL acoplados al dominio**: `autogenerar_formato_respuestas`, `sync_formato_respuestas_to_portal`, `sync_portal_to_formato_respuestas`, `get_formatos_for_matricula` conocen `matriculas`, `cursos`, `niveles_formacion`, `portal_config_documentos`.

7. **Editor acoplado a hooks del dominio** (`FormatoConfigSheet.tsx` usa `useNivelesFormacion`).

---

### Arquitectura objetivo

```text
+------------------------------------------------------+
|              APP (host: SAFA u otro)                 |
|  Adapters de dominio (Persona, Matrícula, Curso...)  |
+----------------------|--------|----------------------+
                       v        ^
              +-------------------------+
              |   FormatBuilder Gateway |  (interfaz pública estable)
              +-------------------------+
                       |        ^
                       v        |
+------------------------------------------------------+
|         @formatos/core  (librería independiente)     |
|  - Editor (bloques, canvas, inspector)               |
|  - Renderer (semántico + documental)                 |
|  - Motor de tokens / autocompletado                  |
|  - Validación, versionado, dependencias              |
|  - Tipos genéricos, sin referencias a dominio        |
+------------------------------------------------------+
                       |        ^
                       v        |
              +-------------------------+
              |   StorageAdapter (port) |  (CRUD + eventos)
              +-------------------------+
                  ^               ^
       Supabase impl         InMemory / REST / otros
```

**Principio**: el módulo no conoce `Persona`, `Matrícula`, `Supabase`, `Portal`, `Cartera`. Solo conoce: `Formato`, `Bloque`, `Respuesta`, `TokenContext`, `EventBus`, `StorageAdapter`.

---

### Fases priorizadas

#### Fase A — Definir contratos (Gateway + Ports)
Crear `src/modules/formatos/contracts/` con:
- `FormatoGateway`: API pública (`getFormatos`, `getFormatoById`, `saveFormato`, `submitRespuesta`, `subscribeEvents`).
- `StoragePort`: interfaz CRUD que oculta Supabase (`fetchFormato`, `persistFormato`, `fetchRespuesta`, `persistRespuesta`).
- `TokenResolverPort`: interfaz `(token: string, context: unknown) => string | null` — sin tipos de dominio.
- `BlockRegistryPort`: registro extensible de tipos de bloque (`register(type, definition)`).
- `EventBusPort`: emisor/suscriptor de eventos del módulo (`formato.created`, `respuesta.completed`, `signature.captured`).

#### Fase B — Core puro (sin dominio)
- Mover editor (`editor/*`), tipos base (`Bloque`, `Formato`, `Respuesta`), validaciones, versionado a `src/modules/formatos/core/`.
- Refactorizar `TipoBloque` de unión cerrada a registro extensible: cada bloque declara su `schema`, `editorComponent`, `rendererComponent`, `defaultProps`.
- Bloques específicos del dominio (`health_consent`, `evaluation_quiz`, `signature_aprendiz`, `attendance_by_day`) salen del core y se registran como **plugins de dominio** en `src/modules/formatos/plugins/safa/`.

#### Fase C — Token engine extensible
- Reemplazar el `switch` de `resolveAutoField` por un **registry de resolvers**: cada namespace (`persona.*`, `curso.*`, `firma.*`) registra su resolver. El core solo orquesta.
- Adaptadores SAFA: `src/modules/formatos/adapters/safa-tokens/` registra resolvers para `persona`, `matricula`, `curso`, `personal`, `firma`.

#### Fase D — Storage adapter Supabase
- Implementar `SupabaseStoragePort` en `src/modules/formatos/adapters/supabase/`. Único lugar que importa `@/integrations/supabase/client`.
- Mover `rowToFormato`, `formToRow`, queries de `formato_respuestas` y `firmas_matricula` aquí.

#### Fase E — Eventos en lugar de side-effects ocultos
- Eliminar `syncPortalConfig` del servicio. Reemplazar por evento `formato.visibilityChanged` que el host (SAFA) escucha y decide si sincronizar `portal_config_documentos`.
- Eliminar `procesarEventoFirmaCompletada` del cliente. Reemplazar por evento `signature.captured` que el host maneja (idealmente vía trigger SQL en el host, no en la librería).
- Triggers SQL del dominio (`sync_formato_respuestas_to_portal`, etc.) salen del paquete: viven en migraciones del host SAFA, no del módulo.

#### Fase F — Renderers desacoplados
- `FormatoRenderer` core recibe `(formato, respuesta, tokenContext, blockRegistry)` y renderiza. No importa `Persona` ni `Matricula`.
- `PortalFormatoRenderer` y `DynamicFormatoDocument` se vuelven **wrappers SAFA** que construyen el `tokenContext` desde el dominio y pasan al renderer core.

#### Fase G — Empaquetado opcional
- Estructurar `src/modules/formatos/` con `package.json` interno y `index.ts` exportando solo el Gateway y tipos públicos.
- Listo para extraer a paquete npm (`@safa/formatos`) cuando se quiera.

---

### Estructura de carpetas resultante

```text
src/modules/formatos/
├── core/                    # 100% genérico, sin dominio
│   ├── types/               # Formato, Bloque, Respuesta, Token
│   ├── editor/              # Canvas, Inspector, BlockCatalog
│   ├── renderer/            # FormatoRenderer (semántico + doc)
│   ├── engine/              # token resolution, validation, dependencies
│   └── registry/            # BlockRegistry, TokenResolverRegistry
├── contracts/               # Ports (interfaces)
│   ├── StoragePort.ts
│   ├── TokenResolverPort.ts
│   ├── BlockRegistryPort.ts
│   └── EventBusPort.ts
├── adapters/                # implementaciones concretas
│   ├── supabase/            # StoragePort + Supabase
│   └── safa-tokens/         # resolvers para Persona/Matrícula/Curso
├── plugins/                 # bloques de dominio
│   └── safa/                # health_consent, evaluation_quiz, signature_*
├── gateway/                 # FormatoGateway: API pública del módulo
└── index.ts                 # exporta solo Gateway + tipos públicos
```

El resto de la app consume **solo** `import { FormatoGateway } from '@/modules/formatos'`.

---

### Plan de migración incremental (no big-bang)

1. **Fase A + B (estructura + contratos)**: crear carpetas, mover archivos sin cambiar lógica. Re-exports temporales en ubicaciones antiguas para no romper imports.
2. **Fase C (tokens)**: registry funcionando en paralelo al `switch`. Migrar resolvers uno a uno.
3. **Fase D (storage)**: introducir `StoragePort`. `formatoFormacionService` se vuelve un wrapper sobre el adapter Supabase.
4. **Fase E (eventos)**: emitir eventos sin quitar el side-effect. Cuando el host los maneje, eliminar el side-effect del core.
5. **Fase F (renderers)**: renderer core nuevo + wrappers SAFA. Deprecar los renderers acoplados gradualmente.
6. **Fase G (empaquetado)**: solo cuando A-F estén estables.

Cada fase es entregable independiente y reversible.

---

### Beneficios

- **Escalabilidad**: añadir un bloque nuevo = registrar plugin, sin tocar el core.
- **Testabilidad**: core puro testeable con `InMemoryStoragePort`.
- **Reutilización**: módulo extraíble a otros proyectos cambiando solo adapters.
- **Mantenibilidad**: bug en sincronización de portal se arregla en el host, no en el motor de formatos.
- **Resuelve los problemas previos**: la cascada de firmas y la sincronización portal pasan a ser responsabilidad del host (vía eventos o triggers SQL del host), eliminando la fragilidad cliente-side actual.

---

### Riesgos y mitigación

- **Riesgo**: regresiones en flujos críticos (matrícula, portal, certificación).  
  **Mitigación**: migración por re-export, tests de integración antes de cada fase, feature flag para alternar entre `formatoFormacionService` viejo y nuevo Gateway.

- **Riesgo**: triggers SQL del dominio quedan huérfanos.  
  **Mitigación**: documentar en `Docs/sincronizacionPortalFormatos.md` qué triggers son responsabilidad del host SAFA vs del módulo.

- **Esfuerzo estimado**: ~6 fases incrementales. Sugiero arrancar con **Fase A + B** (estructura + mover archivos sin lógica nueva) para validar la arquitectura antes de invertir en C-G.

---

### Pregunta antes de implementar

¿Cómo quieres arrancar?

- **Opción 1 (recomendada)**: Ejecutar **solo Fase A + B** primero — crear la estructura, mover archivos al nuevo namespace `src/modules/formatos/`, definir contratos, sin cambiar lógica todavía. Permite validar el diseño antes de invertir en el resto.
- **Opción 2**: Ejecutar **Fase A → D** completas (estructura + tokens + storage adapter) en una sola tanda. Más impacto, mayor riesgo.
- **Opción 3**: Plan completo A-G secuencial (varias entregas).

