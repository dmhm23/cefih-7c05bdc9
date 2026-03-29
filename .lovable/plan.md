

## Plan: Bloques editables para Evaluación y Encuesta de Satisfacción

### Problema actual

Los bloques `evaluation_quiz` y `satisfaction_survey` se muestran en el canvas del editor como cajas genéricas con texto "Componente especializado" y en el inspector solo dice "configuración avanzada". No permiten ver ni editar las preguntas, opciones, respuestas correctas ni el umbral de aprobación.

### Solución

Convertir estos dos bloques en componentes completamente editables dentro del constructor visual, mostrando sus preguntas en el canvas y ofreciendo un inspector completo para gestionarlas.

### Cambios

#### 1. `BlockPreview.tsx` — Preview rico para `evaluation_quiz` y `satisfaction_survey`

**evaluation_quiz**: Mostrar cada pregunta como una Card compacta con número, texto de la pregunta, opciones como radio buttons deshabilitados, y un indicador visual de cuál es la respuesta correcta (icono verde). En la parte superior, badge con el umbral de aprobación (ej: "Mín. 70%").

**satisfaction_survey**: Mostrar cada pregunta de escala como Card con opciones deshabilitadas. Si hay pregunta Sí/No, mostrarla al final. Badge indicando "Encuesta — {n} preguntas".

Reemplazar el `case` genérico actual que agrupa estos tipos con renders individuales detallados.

#### 2. `InspectorFields.tsx` — Editor completo para `evaluation_quiz`

Cuando el bloque seleccionado es `evaluation_quiz`, el inspector muestra:

- **Umbral de aprobación** — Input numérico con sufijo "%" (valor actual de `props.umbralAprobacion`)
- **Lista de preguntas** — Cada pregunta como un bloque colapsable/expandible:
  - Texto de la pregunta (Input)
  - Opciones (lista editable con +/- opciones)
  - Selector de respuesta correcta (radio inline que marca cuál opción es la correcta)
  - Botón eliminar pregunta
- **Botón "Agregar pregunta"** al final
- Info: "Se aprueba con {umbral}% — {n} preguntas configuradas"

#### 3. `InspectorFields.tsx` — Editor completo para `satisfaction_survey`

Cuando el bloque es `satisfaction_survey`:

- **Escala de opciones** — Lista editable de opciones de escala (value + label), con agregar/eliminar
- **Preguntas de escala** — Lista de textos editables con agregar/eliminar
- **Pregunta Sí/No** — Toggle para habilitarla + Input para el texto
- Info: "{n} preguntas de escala + {siNo ? 1 : 0} pregunta Sí/No"

#### 4. `InspectorFields.tsx` — Editores para `health_consent` y `data_authorization`

Para completar la coherencia:

**health_consent**: Lista editable de preguntas con toggles para `hasDetail` y campo para `conditionalOn`.

**data_authorization**: Lista editable de `summaryItems` (textos) + textarea para `fullText`.

#### 5. `bloqueConstants.ts` — Sacar de `COMPLEX_TYPES`

Eliminar `evaluation_quiz` y `satisfaction_survey` de `COMPLEX_TYPES` (y opcionalmente `health_consent` y `data_authorization`) para que el inspector ya no los trate como caja negra. Agregar estos bloques al `BLOCK_PALETTE` en la sección "Especiales" para que se puedan arrastrar desde el catálogo.

#### 6. `BlockCatalog.tsx` — Agregar bloques especiales al catálogo

Agregar `evaluation_quiz`, `satisfaction_survey`, `health_consent`, `data_authorization` y `attendance_by_day` como bloques arrastrables en una sección "Especiales" del catálogo izquierdo.

### Reglas de evaluación (condicionales)

No se requiere un sistema de condicionales genérico nuevo. La lógica de evaluación ya existe en `EvaluacionPage.tsx` y funciona así:

- `umbralAprobacion` (porcentaje) está en los props del bloque `evaluation_quiz`
- El portal calcula: `correctas / total × 100 ≥ umbral → aprobado`
- El reintento ya está soportado

Lo que se necesita es que este `umbralAprobacion` sea **editable desde el inspector**, lo cual se cubre en el punto 2. No hay necesidad de un motor de condicionales; la regla del 70% es simplemente un número configurable en las props del bloque.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/formatos/editor/BlockPreview.tsx` | Previews ricos para quiz, survey, health, data_auth |
| `src/components/formatos/editor/InspectorFields.tsx` | Editores completos para los 4 bloques especiales |
| `src/data/bloqueConstants.ts` | Vaciar `COMPLEX_TYPES`, agregar al `BLOCK_PALETTE` |
| `src/components/formatos/editor/BlockCatalog.tsx` | Sección "Especiales" con los nuevos bloques |

### Lo que NO cambia
- `EvaluacionPage.tsx` — el portal sigue consumiendo la misma estructura de datos
- `QuizReviewCard.tsx` — sin cambios
- Tipos en `formatoFormacion.ts` — las interfaces `BloqueEvaluationQuiz` y `BloqueSatisfactionSurvey` ya tienen la estructura correcta
- `FormatoPreviewDocument.tsx` — sin cambios

