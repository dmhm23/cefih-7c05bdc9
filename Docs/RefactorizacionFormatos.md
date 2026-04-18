# Refactorización del Módulo de Formatos

> Documento técnico que describe la refactorización profunda del subsistema de formatos de SAFA, ejecutada en 8 fases y entregada en 3 ciclos (A, B, C). Estado: completada y en producción.

---

## 1. Contexto y objetivo

### Punto de partida

El subsistema de formatos era el corazón del producto (autorizaciones, consentimientos, evaluaciones, asistencias, encuestas), pero su código había crecido orgánicamente y presentaba acoplamientos profundos con el dominio SAFA:

- Tipos de bloques duplicados en varias capas (`@/types/formatoFormacion`, `@/services/formatoFormacionService`, hooks).
- Resolvers de tokens (`{{persona.nombreCompleto}}`, `{{curso.fechaInicio}}`...) hardcodeados en el motor.
- Cascada de firmas, sincronización con `portal_config_documentos` y persistencia de respuestas mezcladas dentro de los servicios.
- Dos renderers monolíticos (`PortalFormatoRenderer`, `DynamicFormatoDocument`) con switches gigantes por tipo de bloque.
- Imposible empaquetar el motor como librería independiente: dependía de `@/integrations/supabase`, `@/types/persona`, `@/types/matricula`, etc.

### Meta

Extraer un módulo `@formatos` **100 % genérico**, listo para publicarse como paquete npm independiente, con las siguientes garantías:

1. El **core** del módulo no conoce el dominio SAFA (no importa Persona, Matrícula, Curso, Supabase).
2. Toda especificidad del host (SAFA) entra por **Ports + Adapters** y **plugins**.
3. **Bloques extensibles** vía registry, no vía unión cerrada de tipos.
4. **Efectos secundarios** (sincronizar portal, propagar firmas) viajan por **eventos**, no por llamadas directas.
5. **Cero pérdida de datos**: los 7 formatos vivos, 6 respuestas y 3 firmas en producción se conservan intactos.

---

## 2. Diagnóstico inicial

Antes de tocar código, se auditó el estado real de cada capa:

| Capa | Estado | Acción |
|---|---|---|
| `formatos_formacion` (BD, 7 filas) | Sano: motor `bloques`, `key = formato_id::text`, sin componentes legacy | Conservar |
| `formato_respuestas` (6 filas reales) | Sano: estructura compatible con el módulo nuevo | Conservar |
| `firmas_matricula` (3 firmas) | Sano | Conservar |
| Tabla `versiones_formato` (legacy) | Reemplazada por `formato_versiones` (block-based) | Drop |
| Columna `legacy_component_id` | Sin uso | Drop |
| Seeds `a0000000-…` (formatos demo) | Obsoletos | Hard-delete |
| Código de servicios y hooks | Monolítico, acoplado | **Refactor profundo** |

**Decisión clave**: no recrear formatos desde cero. La BD ya estaba en el formato correcto; el problema era exclusivamente del código.

---

## 3. Arquitectura objetivo

```
src/modules/formatos/
├── core/                       # 100 % genérico — exportable como librería
│   ├── types/                  # Formato, Bloque, Respuesta, TokenContext
│   ├── editor/                 # useEditorStore (canvas + dirty state)
│   ├── engine/                 # renderTemplate, validateBlocks
│   └── registry/               # BlockRegistry, TokenResolverRegistry, EventBus
├── contracts/                  # Ports (interfaces)
│   ├── StoragePort
│   ├── BlockRegistryPort
│   ├── TokenResolverPort
│   └── EventBusPort
├── adapters/                   # Implementaciones concretas
│   ├── supabase/               # SupabaseStoragePort
│   └── safa-tokens/            # Resolvers SAFA (persona, matricula, curso, firma)
├── plugins/safa/               # Bloques de dominio + listeners SAFA
│   ├── blocks/portal/          # health_consent, evaluation_quiz, ...
│   ├── listeners/              # portalSyncListener, firmaCascadeListener
│   └── autoFields/             # Catálogo y resolución de auto-fields
├── gateway/                    # FormatoGateway: API pública estable
└── index.ts                    # Barrel: solo Gateway + tipos públicos
```

### Principios

- **El core no conoce el dominio**. No importa nada de `@/types/persona` ni `@/integrations/supabase`.
- **Ports** definen contratos; **adapters** los implementan para SAFA.
- **Plugins** registran bloques de dominio sin tocar el core.
- **Eventos** desacoplan efectos secundarios: `formato.created`, `respuesta.completed`, `signature.captured`.
- **Gateway** es la única superficie pública que debería consumir el host.

---

## 4. Fases ejecutadas

### Fase 1 — Limpieza de base de datos

- Hard-delete de los 6 formatos seed (`a0000000-…`) sin dependencias.
- Drop de la tabla `versiones_formato` (legacy, no usada por ningún consumidor activo).
- Drop de la columna `formatos_formacion.legacy_component_id`.
- Verificación: 7 formatos activos, 0 soft-deleted, 6 respuestas y 3 firmas intactas.

### Fase 2 — Contratos extensibles

- `BlockRegistryPort` enriquecido con tres ranuras opcionales:
  - `EditorComponent`: render del bloque dentro del editor visual.
  - `RendererComponent`: render del bloque en preview / portal / PDF.
  - `InspectorComponent`: panel de propiedades del bloque.
- `BlockDefinition` admite `defaultProps`, `validate`, `isInput` y categoría/icono para el catálogo.
- Resultado: cualquier host (SAFA u otro) puede registrar bloques nuevos sin tocar el core.

### Fase 3 — Migración de bloques de dominio SAFA

Los bloques específicos del negocio se movieron de los renderers monolíticos a su propio plugin:

```
plugins/safa/blocks/portal/
├── BloqueHealthConsentRenderer.tsx
├── BloqueEvaluationQuizRenderer.tsx
├── BloqueDataAuthorizationRenderer.tsx
└── BloqueSatisfactionSurveyRenderer.tsx
```

Cada uno se autorregistra mediante `registerSafaPlugins(blockRegistry)`.

### Fase 4 — Cascada de firmas event-driven

Antes: `portalDinamicoService.procesarEventoFirmaCompletada(...)` se invocaba manualmente desde múltiples puntos.

Después: `firmaCascadeListener` se suscribe al evento `respuesta.completed` del `EventBus` del gateway. Cuando un estudiante firma un formato origen:

1. El listener persiste la firma en `firmas_matricula`.
2. Recorre los formatos automáticos que reutilizan firmas y propaga la imagen base64.
3. Emite `signature.captured` para que otros listeners reaccionen si es necesario.

Registrado una sola vez al cargar el plugin SAFA.

### Fase 5 — Wrapper minimalista y migración de hooks

- `formatoFormacionService` quedó como facade delgado (~80 líneas) que delega 100 % al `formatosGateway`.
- `useFormatosFormacion` se reescribió contra el gateway directamente.
- Se borraron 14 archivos legacy (servicios, mappers y resolvers que ya no aportaban valor).

### Fase 6 — Eliminación de resolvers legacy

Se eliminaron del path raíz:

- `src/services/formatoFormacionService.ts` (legacy)
- `src/utils/resolveAutoField.ts`
- `src/utils/tokenSources.ts`
- `src/utils/autoFieldCatalog.ts`
- `src/constants/bloqueConstants.ts`
- `src/utils/renderTemplate.ts`

Sus equivalentes viven ahora dentro del módulo, en `plugins/safa/autoFields/` y `core/engine/`.

### Fase 7 — Store del editor al core

`useEditorStore` (Zustand) se movió a `core/editor/useEditorStore.ts`. El editor visual completo (canvas, inspector, catálogo de bloques) consume estado desde el módulo y ya no depende de hooks del host.

### Fase 8 — Verificación end-to-end

- `tsc --noEmit` → **0 errores**.
- Búsqueda exhaustiva de imports legacy → **0 referencias**.
- Eliminación física verificada de los 14 facades.
- Datos en producción: **7 formatos activos, 6 respuestas, 3 firmas, 0 borrados**.

---

## 5. Entregas (cronología)

### Entrega A — Migración estructural

- 33 imports redirigidos al nuevo módulo.
- 14 archivos legacy eliminados físicamente.
- Plugin SAFA con bloques portal, listeners y auto-fields ya conectado.
- Build verde.

### Entrega B — Eventos y registro extensible

- `BlockRegistryPort` extendido con `RendererComponent`, `EditorComponent`, `InspectorComponent`.
- `firmaCascadeListener` creado y suscrito a `respuesta.completed`.
- `portalDinamicoService` reescrito para delegar la persistencia y la cascada al `formatosGateway`.
- `formatoFormacionService` engancha los listeners en su bootstrap.

### Entrega C — Verificación

- Compilación TypeScript sin errores.
- Cero referencias a paths legacy en todo el repo.
- Salud de datos confirmada vía consultas a BD.
- Documentada deuda técnica restante (renderers monolíticos).

---

## 6. Archivos clave

### Creados

```
src/modules/formatos/
├── index.ts
├── README.md
├── package.json
├── core/
│   ├── types/index.ts
│   ├── editor/useEditorStore.ts
│   ├── engine/renderTemplate.ts
│   ├── engine/validateBlocks.ts
│   └── registry/{blockRegistry, tokenRegistry, eventBus}.ts
├── contracts/{StoragePort, BlockRegistryPort, TokenResolverPort, EventBusPort}.ts
├── adapters/
│   ├── supabase/createSupabaseStorage.ts
│   └── safa-tokens/registerSafaTokens.ts
├── plugins/safa/
│   ├── registerSafaPlugins.ts
│   ├── formatoFormacionService.ts
│   ├── portalDinamicoService.ts
│   ├── renderTemplate.ts
│   ├── types.ts
│   ├── blockUI.ts
│   ├── autoFields/{catalog, resolveAutoField, tokenSources}.ts
│   ├── blocks/portal/{HealthConsent, EvaluationQuiz, DataAuthorization, SatisfactionSurvey}Renderer.tsx
│   ├── listeners/{portalSyncListener, firmaCascadeListener}.ts
│   └── respuestas/respuestaService.ts
└── gateway/createFormatoGateway.ts
```

### Eliminados

- `src/services/formatoFormacionService.ts` (legacy)
- `src/services/portalDinamicoService.ts` (legacy)
- `src/utils/resolveAutoField.ts`
- `src/utils/tokenSources.ts`
- `src/utils/autoFieldCatalog.ts`
- `src/utils/renderTemplate.ts`
- `src/constants/bloqueConstants.ts`
- `src/types/formatoFormacion.ts` (re-exportado desde el plugin)
- 6 facades adicionales de servicios y mappers obsoletos.

### Migración de BD

- Drop de tabla `versiones_formato`.
- Drop de columna `formatos_formacion.legacy_component_id`.
- Hard-delete de seeds `a0000000-…`.

---

## 7. Estado actual

### Lo que funciona

- **Build TypeScript**: verde sin warnings críticos.
- **Módulo publicable**: `src/modules/formatos/` no importa nada del host fuera de `@/integrations/supabase` (encapsulado en el adapter). Listo para extraerse a npm.
- **Eventos**: `formato.created`, `formato.updated`, `formato.deleted`, `respuesta.upserted`, `respuesta.completed`, `respuesta.reopened`, `signature.captured`. Cualquier consumidor puede suscribirse vía `formatosGateway.events.on(...)`.
- **Cascada de firmas**: 100 % event-driven, sin llamadas directas.
- **Sincronización portal**: vía `portalSyncListener`, también event-driven.
- **Datos en producción**: intactos (7 formatos, 6 respuestas, 3 firmas).

### Deuda técnica restante

| Item | Estado | Justificación |
|---|---|---|
| `PortalFormatoRenderer` (~752 líneas) | Monolítico | Layout específico (flujo guiado por secciones colapsables) |
| `DynamicFormatoDocument` (~749 líneas) | Monolítico | Layout específico (grilla tipo PDF) |
| `RendererComponent` del registry | Expuesto pero no consumido aún | Ambos renderers comparten solo los bloques de dominio |

**Justificación de no atacarla todavía**: los dos renderers tienen layouts radicalmente diferentes (portal guiado vs documento PDF) y solo comparten los renderers de los bloques de dominio (que ya viven en el plugin). Reducirlos a ~100 líneas cada uno requiere extraer un `<FormatoRenderer mode="portal | document" />` que delegue al `RendererComponent` registrado, manteniendo la libertad de layout. Es trabajo adicional, no un bloqueo.

---

## 8. Cómo usar el módulo desde el host

### Importación canónica

```ts
import {
  formatosGateway,
  type Formato,
  type FormatoFormData,
} from '@/modules/formatos';
```

### Operaciones CRUD

```ts
const formatos = await formatosGateway.getFormatos();
const f = await formatosGateway.saveFormato(data);
await formatosGateway.updateFormato(f.id, { nombre: 'Nuevo' });
await formatosGateway.archiveFormato(f.id);
```

### Respuestas de matrícula

```ts
const r = await formatosGateway.submitRespuesta(
  matriculaId,
  formatoId,
  answers,
  'completado',
);
```

### Suscripción a eventos

```ts
formatosGateway.events.on('respuesta.completed', ({ subjectId, formatoId, answers }) => {
  // El host reacciona: enviar email, generar PDF, etc.
});

formatosGateway.events.on('signature.captured', ({ matriculaId, tipo }) => {
  // Auditoría externa, notificación, etc.
});
```

### Renderizar un template con tokens

```ts
const html = formatosGateway.renderTemplate(
  '<h1>Hola {{persona.nombreCompleto}}</h1>',
  { matriculaId },
);
```

### Registrar un bloque custom (otro host)

```ts
formatosGateway.blockRegistry.register({
  type: 'mi_bloque_custom',
  label: 'Mi bloque',
  category: 'custom',
  defaultProps: { texto: '' },
  RendererComponent: MiBloqueRenderer,
  EditorComponent: MiBloqueEditor,
  isInput: true,
});
```

---

## 9. Próximos pasos sugeridos

1. **Reducir los renderers monolíticos** (`PortalFormatoRenderer`, `DynamicFormatoDocument`) delegando cada tipo de bloque al `RendererComponent` registrado. Esto bajaría ambos archivos a ~100 líneas y consolidaría el motor de render.
2. **Extraer a paquete npm independiente** (`@cefih/formatos` o similar) usando `src/modules/formatos/package.json` como punto de partida. El core ya cumple los requisitos: cero imports al host fuera del adapter Supabase.
3. **Tests unitarios del core**: registry, eventBus, renderTemplate, validateBlocks. El core es 100 % puro y testeable sin mocks de BD.
4. **Documentar el contrato de eventos** públicamente para que terceros consumidores puedan integrarse.

---

## Resumen ejecutivo

La refactorización del módulo de formatos cumplió sus tres objetivos críticos:

- **Desacoplamiento**: el motor ya no conoce SAFA. Toda especificidad vive en `plugins/safa/` y se conecta vía Ports.
- **Extensibilidad**: nuevos bloques, tokens y efectos secundarios se añaden sin tocar el core.
- **Cero pérdida de datos**: los 7 formatos en producción, las 6 respuestas y las 3 firmas se preservaron sin migración manual.

El módulo está listo para empaquetarse como librería independiente. La única deuda técnica viva es la reducción de los dos renderers monolíticos, que es una optimización, no un bloqueo.
