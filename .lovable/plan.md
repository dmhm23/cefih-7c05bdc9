

## Plan: Reflejar evaluaciones calificadas dentro de los formatos de formación (con compatibilidad retroactiva)

### Problema actual

Las evaluaciones viven aisladas en `formato_respuestas.intentos_evaluacion`, pero ningún otro formato de formación puede reflejar el resultado obtenido por el aprendiz (puntaje, preguntas correctas/incorrectas). El motor ya tiene la primitiva (`formato_prev:<formatoId>:<fieldKey>`), pero solo devuelve strings planos, no estructuras de calificación.

### Decisión funcional sobre reintentos

**“Intento vigente con historial completo accesible”**:
- El formato de formación muestra **siempre el último intento** del aprendiz como dato vigente.
- El historial completo de intentos queda **visible como sección colapsable**.
- Reportes y certificados leen el vigente — coherente con el modelo actual donde `documentos_portal` queda `completado` con el último envío.

Esta opción conserva trazabilidad legal completa, no inventa reglas (“mejor resultado”), y se alinea con cómo ya está armada `intentos_evaluacion` en BD.

### Arquitectura de la solución

Un nuevo bloque dedicado `evaluation_summary`, residente en el plugin SAFA (no en el core), insertable desde el catálogo del editor en cualquier formato de formación.

```text
┌─ Formato EVALUACIÓN (existente) ──────────────┐
│  bloque evaluation_quiz → guarda en           │
│  formato_respuestas.intentos_evaluacion[]     │
└────────────────┬──────────────────────────────┘
                 │  (lectura por formato_id)
                 ▼
┌─ Formato REGISTRO DE FORMACIÓN ───────────────┐
│  bloque evaluation_summary                    │
│  props: { formatoEvaluacionId: <uuid> }       │
│  → renderiza puntaje, correctas, incorrectas, │
│    historial de intentos                      │
└───────────────────────────────────────────────┘
```

### Cambios técnicos

#### 1. Estructura enriquecida por intento (forward-compatible)

Cada nueva entrada de `intentos_evaluacion[]` incluye `preguntas[]` con texto, opciones, índice correcto, índice respondido y flag `esCorrecta`:

```jsonc
{
  "timestamp": "2026-04-21T15:30:00Z",
  "schema_version": 2,
  "resultados": {
    "<bloqueQuizId>": {
      "puntaje": 80, "correctas": 8, "total": 10, "aprobado": true,
      "preguntas": [
        { "id": 1, "texto": "...", "opciones": ["A","B","C","D"],
          "correcta": 2, "respondida": 2, "esCorrecta": true }
      ]
    }
  }
}
```

Se añade el discriminador `schema_version: 2` para distinguir entradas nuevas de viejas. Cero migración SQL — `intentos_evaluacion` ya es `jsonb`.

#### 2. Nuevo bloque `evaluation_summary`

- **Tipo nuevo** en `src/modules/formatos/plugins/safa/types.ts`: `BloqueEvaluationSummary` con props `{ formatoEvaluacionId, mostrarHistorial, mostrarDetallePreguntas }`.
- **Catálogo del editor** (`BlockCatalog.tsx`): nuevo item “Resumen de evaluación”, categoría `special`, ícono `ClipboardCheck`.
- **Inspector** (`InspectorFields.tsx`): `Select` que lista formatos del catálogo con al menos un `evaluation_quiz`; toggles para historial y detalle.

#### 3. Renderer dual (portal + documental)

**Archivo nuevo**: `src/modules/formatos/plugins/safa/blocks/portal/BloqueEvaluationSummaryRenderer.tsx`

Lee `respuestasPrevias` del contexto, busca la respuesta del `formatoEvaluacionId`, toma el último `intentos_evaluacion[]`. Renderiza:
1. Cabecera: badge APROBADO/NO APROBADO, puntaje, correctas/total, fecha.
2. Tabla de preguntas con ✓/✗.
3. Sección colapsable “Historial de intentos” si hay >1.

Se integra en `DynamicFormatoDocument.tsx` (PDF) y `PortalFormatoRenderer.tsx` (portal).

#### 4. Tokens auto inline

Se añaden 4 keys especiales a `formato_prev:`:
- `_puntaje` → `"80%"`
- `_correctas` → `"8/10"`
- `_aprobado` → `"Sí"` / `"No"`
- `_fecha_intento` → `"21/04/2026"`

Permiten incrustar el resultado en cualquier párrafo: “Resultado: {{formato_prev:<id>:_puntaje}}”.

**Archivos**: `resolveAutoField.ts` y `catalog.ts`.

### Compatibilidad retroactiva con evaluaciones ya diligenciadas

Esta es la sección clave: **los formatos ya enviados antes de este cambio NO tienen `preguntas[]` ni `schema_version`**. Hay que garantizar que sigan funcionando y, donde sea posible, se enriquezcan automáticamente.

#### Estrategia: legacy-aware renderer + enriquecimiento perezoso (lazy hydration)

**A. Renderer tolerante a esquemas viejos** (`BloqueEvaluationSummaryRenderer.tsx`):

Detecta el esquema por intento:
- **schema v2 (nuevo)**: tiene `preguntas[]` → renderiza tabla completa con detalle.
- **schema v1 (legacy)**: solo tiene `puntaje, correctas, total, aprobado` → renderiza solo la **cabecera** (puntaje + badge + fecha) y muestra placeholder en la sección de detalle: *“Detalle de preguntas no disponible para intentos anteriores a esta versión”*.
- **Sin intentos** o `intentos_evaluacion = []` pero con `formato_respuestas.estado = 'completado'`: ejecuta el **enriquecimiento perezoso** descrito abajo.

Cero excepciones, cero pantallas en blanco, cero datos perdidos. Las respuestas viejas se ven igual de válidas que las nuevas, solo con menos detalle.

**B. Enriquecimiento perezoso al abrir el formato**:

Cuando un admin/aprendiz abre por primera vez un `formato_respuestas` que tiene `estado = 'completado'` pero `intentos_evaluacion = []` (caso típico de evaluaciones diligenciadas antes del cambio), el renderer dispara una **reconstrucción on-the-fly** desde el campo `answers`:

1. Carga el formato fuente (por `formatoEvaluacionId`) para conocer la definición actual de preguntas y respuestas correctas.
2. Recorre `answers` del `formato_respuestas` legacy — los keys del quiz siguen el patrón `quiz_<bloqueId>_<idx>` (ya consistente desde hace meses).
3. Reconstruye un único intento sintético con `schema_version: 2`, `timestamp = completado_at`, y `preguntas[]` reconstruidas comparando `answers[key]` vs `preg.correcta`.
4. Persiste ese intento sintético una sola vez en `intentos_evaluacion` (UPSERT), agregando un flag `reconstruido: true` para auditoría.

Esto se ejecuta **solo si**:
- `intentos_evaluacion.length === 0`,
- `estado === 'completado'`,
- `answers` contiene al menos un key con prefijo `quiz_`,
- El formato fuente sigue existiendo y conserva los `evaluation_quiz` originales.

Si alguna condición no se cumple (formato fuente eliminado, preguntas modificadas, etc.) se cae al modo legacy (solo cabecera) sin error.

**C. Limitación honesta — no se inventan datos**:

Si las preguntas del quiz fuente fueron editadas después del envío original, la reconstrucción NO se ejecuta (riesgo de inconsistencia: la pregunta correcta hoy podría no ser la misma que el día del intento). En ese caso el bloque muestra: *“Resultado registrado: APROBADO 80% (intento previo a la versión enriquecida; detalle no reconstruible porque la evaluación fuente fue modificada).”* Honestidad sobre lo que sabemos y lo que no.

**D. Backfill opcional desde admin** (futuro, no en este PR):

La función de reconstrucción se exporta también como utilidad invocable desde un script admin (`/admin/herramientas/reconstruir-intentos`) para procesar respuestas viejas en lote si en algún momento se requiere — fuera del alcance de este cambio, pero la arquitectura lo permite sin reescritura.

#### Sin riesgo para datos existentes

- **Cero UPDATEs sobre `answers`** en respuestas legacy. El campo `answers` queda intacto.
- **Cero borrado** de información existente.
- El enriquecimiento solo escribe `intentos_evaluacion` cuando está vacío — nunca sobrescribe intentos ya registrados.
- Si la reconstrucción falla por cualquier razón, se hace catch silencioso y se renderiza el modo legacy. La página nunca se rompe.
- El flag `reconstruido: true` deja trazabilidad de qué intentos son sintéticos vs originales — útil para reportes y auditoría.

### Manejo de reintentos

El bloque siempre lee el último `intentos_evaluacion[]`. Cada reintento agrega una nueva entrada (lógica ya implementada). Los formatos de formación se actualizan automáticamente al re-renderizarse — sin invalidación manual, sin cron, sin reglas adicionales.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/modules/formatos/plugins/safa/types.ts` | `BloqueEvaluationSummary`; agregar a `TipoBloque` y unión `Bloque`. |
| `src/pages/estudiante/DynamicPortalRenderer.tsx` | Al construir cada `intentoEntry`, inyectar `preguntas[]` y `schema_version: 2`. |
| `src/modules/formatos/plugins/safa/blocks/portal/BloqueEvaluationSummaryRenderer.tsx` | **NUEVO**. Renderer dual portal/documental con detección de esquema (v1 legacy vs v2 nuevo) + enriquecimiento perezoso. |
| `src/modules/formatos/plugins/safa/utils/reconstruirIntentoLegacy.ts` | **NUEVO**. Función pura que reconstruye un intento v2 sintético a partir de `answers` + definición del quiz. Reutilizable. |
| `src/modules/formatos/plugins/safa/blocks/portal/index.ts` | Exportar nuevo renderer. |
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | `case 'evaluation_summary'` en `renderBloque`. |
| `src/components/portal/PortalFormatoRenderer.tsx` | Clasificar `evaluation_summary` como `info` y renderizar. |
| `src/components/formatos/editor/BlockCatalog.tsx` | Nuevo item “Resumen de evaluación”. |
| `src/components/formatos/editor/InspectorFields.tsx` | Panel de propiedades del bloque. |
| `src/modules/formatos/plugins/safa/autoFields/resolveAutoField.ts` | 4 keys especiales en `formato_prev:`. Cuando lee de un intento legacy, deriva `_puntaje`/`_correctas`/`_aprobado`/`_fecha_intento` desde la cabecera v1 (siempre disponibles). |
| `src/modules/formatos/plugins/safa/autoFields/catalog.ts` | `buildFormatoPrevioOptions` agrega los 4 tokens. |

### Validación post-cambio

#### Flujos nuevos (esquema v2)
- Aprendiz responde 6/10 → `REGISTRO DE FORMACIÓN` muestra cabecera roja “NO APROBADO 60%” + tabla detallada con ✓/✗ por pregunta.
- Reintenta y obtiene 9/10 → cabecera verde 90%, historial colapsable con los 2 intentos.
- PDF impreso del registro contiene el resumen en alta fidelidad.
- Token inline `{{formato_prev:<id>:_puntaje}}` → `90%`.

#### Flujos retroactivos (datos preexistentes)

- **Evaluación legacy con `intentos_evaluacion = []` pero `estado = 'completado'`** y formato fuente intacto: al abrir el `REGISTRO DE FORMACIÓN`, el bloque dispara reconstrucción, persiste un intento sintético `{ schema_version: 2, reconstruido: true, ... }`, y muestra detalle completo. Verificable con `SELECT intentos_evaluacion FROM formato_respuestas WHERE matricula_id=...` — debe contener un elemento con `reconstruido: true` y `timestamp = completado_at`.
- **Evaluación legacy donde el formato fuente fue editado** (preguntas distintas a las del momento del envío): no se reconstruye; se muestra cabecera con puntaje original + leyenda explicativa. La respuesta original no se toca.
- **Evaluación legacy con intentos v1 ya registrados** (puntaje sí pero sin `preguntas[]`): se muestra cabecera con badge + puntaje + fecha; sección de detalle muestra placeholder “Detalle no disponible para intentos anteriores”. Si el aprendiz reintenta, el nuevo intento se persiste como v2 con detalle completo; los viejos quedan intactos como v1.
- **Tokens inline en formatos legacy**: `{{formato_prev:<id>:_puntaje}}` resuelve correctamente porque puntaje, correctas, aprobado y timestamp están disponibles tanto en v1 como en v2.
- **Formato sin evaluación enlazada o sin presentar**: placeholder “Pendiente de evaluación”.

#### Verificación de integridad

- Comparar `SELECT count(*) FROM formato_respuestas WHERE estado='completado'` antes y después del despliegue → debe ser idéntico. Cero pérdidas.
- `SELECT count(*) FROM formato_respuestas WHERE intentos_evaluacion @> '[{"reconstruido": true}]'` permite medir cuántas respuestas legacy se han enriquecido en producción a lo largo del tiempo.

### Sin impacto colateral

- **Cero migración SQL**: `intentos_evaluacion` ya es `jsonb` con default `[]`.
- **Cero cambio en bloqueos del portal**: triggers `sync_portal_to_formato_respuestas` y `sync_formato_respuestas_to_portal` siguen idénticos.
- **Cero cambio en certificación**: la elegibilidad sigue rigiéndose por `formato_respuestas.estado = 'completado'`. El bloque es solo presentación.
- **Cero duplicación de lógica de calificación**: el quiz calcula al hacer submit; el summary solo lee y formatea.
- **Cero acoplamiento al core**: todo vive en el plugin SAFA.
- **Cero pérdida de datos legacy**: respuestas viejas siguen siendo válidas; el enriquecimiento es aditivo y no destructivo, y solo se ejecuta cuando es seguro hacerlo.

