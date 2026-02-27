

## Plan: Reintento de evaluación reprobada con historial

### Cambios

#### 1. `src/types/portalEstudiante.ts`
- Agregar campo `intentos?: DocumentoPortalEstado[]` a `DocumentoPortalEstado` para almacenar historial de intentos reprobados.

#### 2. `src/services/portalEstudianteService.ts` — `enviarDocumento`
- Si `documentoKey === 'evaluacion'` y ya existe un registro previo reprobado (`metadata.aprobado === false`):
  - Mover el registro anterior al array `intentos[]` del nuevo registro.
  - El nuevo registro reemplaza al anterior (mantiene estado `completado` si aprueba, o `pendiente` si reprueba para permitir reintento).
- Si aprueba: estado = `completado`. Si reprueba: estado = `pendiente` (permite reintentar).
- Acumular todos los intentos previos en `intentos[]`.

#### 3. `src/pages/estudiante/EvaluacionPage.tsx` — Cambios principales

**Post-submit cuando reprueba** (reemplaza la vista actual de resultado):
- Mostrar puntaje y badge "Reprobado".
- Mostrar revisión de cada pregunta del quiz:
  - Respuesta del estudiante marcada con ✓ verde (correcta) o ✗ rojo (incorrecta).
  - Si incorrecta, mostrar cuál era la respuesta correcta.
- Botón "Reintentar evaluación" que:
  - Resetea `quizAnswers` a `{}` y `submitted`/`result` a falso.
  - Pre-carga `surveyAnswers` y `siNoAnswer` con las respuestas de encuesta del intento anterior.
  - Oculta la sección de encuesta (ya fue respondida), mostrando solo un chip informativo "Encuesta ya completada".

**Post-submit cuando aprueba**: Mantener vista actual (puntaje + "Aprobado" + volver).

**Vista "ya completado"**: Solo se muestra cuando el último intento fue aprobado (`metadata.aprobado === true`). Si fue reprobado, mostrar el formulario para reintentar.

**Lógica de envío en reintento**:
- Solo enviar datos del quiz. Reutilizar la encuesta del primer intento (`encuestaResp` del registro anterior).
- El servicio acumula los intentos en el array `intentos[]`.

### Resumen de archivos

| Archivo | Cambio |
|---|---|
| `src/types/portalEstudiante.ts` | Agregar `intentos?: DocumentoPortalEstado[]` |
| `src/services/portalEstudianteService.ts` | Lógica de acumulación de intentos reprobados; estado `pendiente` si reprueba |
| `src/pages/estudiante/EvaluacionPage.tsx` | Vista de revisión post-reprobación, botón reintentar, pre-carga de encuesta, ocultamiento de encuesta en reintentos |

