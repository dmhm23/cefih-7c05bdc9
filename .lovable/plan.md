## Plan: Parte 4 — Documento "Evaluación y Encuesta"

### Resumen

Crear la pagina `/estudiante/documentos/evaluacion` que carga dinamicamente el formato de evaluacion segun el `tipoFormacion` del curso, renderiza el cuestionario interactivo con puntaje automatico, la encuesta de satisfaccion integrada, y envia todo en un unico bloque.

---

### Archivos nuevos (1)


| Archivo                                   | Descripcion                              |
| ----------------------------------------- | ---------------------------------------- |
| `src/pages/estudiante/EvaluacionPage.tsx` | Pagina completa de evaluacion + encuesta |


### Archivos modificados (3)


| Archivo                                   | Cambio                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/App.tsx`                             | Agregar ruta `/estudiante/documentos/evaluacion` antes del wildcard                                                      |
| `src/services/portalEstudianteService.ts` | Agregar `getEvaluacionFormato(tipoFormacion)` que busca el formato con bloques `evaluation_quiz` y `satisfaction_survey` |
| `src/hooks/usePortalEstudiante.ts`        | Agregar hook `useEvaluacionFormato(matriculaId)`                                                                         |


---

### Detalle de implementacion

#### 1. Servicio: `getEvaluacionFormato`

Nuevo metodo que recibe `matriculaId`, resuelve el curso y su `tipoFormacion`, busca en `mockFormatos` el formato que tenga `evaluation_quiz` en sus bloques y cuyo `tipoCursoKeys` incluya ese tipo. Retorna `{ formato, persona, matricula, curso }`.

Actualmente solo existe `fmt-evaluacion-reentrenamiento` (para `reentrenamiento`). Para cursos sin formato de evaluacion, la pagina mostrara un mensaje "No hay evaluacion configurada para este tipo de curso".

#### 2. Pagina `EvaluacionPage`

**Layout mobile-first** (max-w-md):

- **Header**: Boton volver + titulo "Evaluacion y Encuesta"
- **Estado completado**: Si ya fue enviado, mostrar puntaje obtenido, respuestas de encuesta, y boton volver. No permitir reenvio.

**Seccion 1 — Cuestionario** (del bloque `evaluation_quiz`):

- Titulo "Evaluacion de Conocimientos"
- Cada pregunta como Card con RadioGroup de opciones
- Numeracion visible (1/15, 2/15...)
- Sin revelar respuestas correctas hasta enviar
- Validacion: todas las preguntas deben ser respondidas

**Seccion 2 — Encuesta de Satisfaccion** (del bloque `satisfaction_survey`):

- Titulo "Encuesta de Satisfaccion"
- Preguntas de escala como RadioGroup horizontal con opciones (Muy satisfecho, Satisfecho, etc.)
- Pregunta Si/No al final si existe `preguntaSiNo`
- Todas obligatorias

**Boton "Enviar evaluacion"**:

- Deshabilitado si faltan respuestas del quiz o encuesta
- Al enviar:
  - Calcula puntaje: (correctas / total) * 100
  - Determina aprobado/reprobado segun `umbralAprobacion`
  - Llama `enviarDocumento(matriculaId, 'evaluacion', { puntaje, respuestas: { quiz, encuesta }, metadata: { aprobado, totalPreguntas, correctas } })`
- Post envio: muestra resultado (puntaje + aprobado/reprobado) en Card antes de navegar

#### 3. Router en App.tsx

Agregar ruta especifica para `evaluacion` antes del wildcard `:documentoKey`, igual que se hizo con `info_aprendiz`.