

## Plan: Reintento ilimitado de evaluaciones en el portal del estudiante

### Causa raíz

Hoy, cuando un aprendiz envía una evaluación desde `/estudiante`, el sistema marca la respuesta como `completado` en `formato_respuestas` y en `documentos_portal`. A partir de ahí:

1. **No puede volver a intentar si reprueba**: aunque existe el botón "Reintentar evaluación" en `BloqueEvaluationQuizRenderer`, el flujo en `DynamicPortalRenderer.handleQuizRetry` solo hace `setSubmitted(false)` sin limpiar respuestas incorrectas, y al re-enviar sobrescribe pero **no se vuelve a poder intentar** porque al recargar la página `existingResp.estado === 'completado'` reactiva el modo bloqueado.
2. **Solo muestra retry si reprobó**: si aprobó (≥ umbral) no tiene cómo repetir la evaluación aunque quiera mejorar el puntaje — el usuario pidió "cuantas veces lo necesite".
3. **No diferencia preguntas correctas de incorrectas en el reintento**: el usuario quiere repetir **solo las que quedaron mal**, no todas otra vez.
4. **El historial de intentos se está guardando mal**: se persiste un campo `_intentos_evaluacion` dentro del JSON `answers` en lugar de usar la columna real `intentos_evaluacion` de `formato_respuestas` (que ya existe en BD, tipo `jsonb`, default `[]`).

### Solución

#### 1. Permitir reintentos ilimitados (apruebe o repruebe)

En `BloqueEvaluationQuizRenderer.tsx`:
- Mostrar el botón **"Realizar nuevo intento"** siempre que `submitted && onRetry` exista (no solo cuando reprobó).
- Etiqueta dinámica: "Reintentar para aprobar" si reprobó, "Realizar nuevo intento" si aprobó.

En `DynamicPortalRenderer.tsx`:
- Después de submit con quiz, NO bloquear el formulario aunque `existingResp.estado === 'completado'`. Cambiar la condición `readOnly={isCompleted && !hasQuiz}` ya está correcta, pero falta que el botón principal "Enviar evaluación" se vuelva a mostrar tras reintentar. Hoy se oculta por `!isCompleted` y al recargar la página `submitted=true` → no aparece. Solución: para formatos con quiz, derivar `isCompleted` solo de `submitted` (estado local), no de `existingResp.estado`. Así, al hacer retry, `setSubmitted(false)` reactiva el botón.

#### 2. Reintento "solo las preguntas mal contestadas"

En `BloqueEvaluationQuizRenderer.tsx`:
- Al disparar `onRetry`, identificar las preguntas con `selected !== preg.correcta` y limpiar **solo esas respuestas** (las correctas se conservan visualmente y siguen contando).
- Las preguntas correctas se renderizan deshabilitadas con check verde fijo (`disabled` + estilo "bloqueado correcto"); las incorrectas vuelven a ser seleccionables.
- El cálculo de `result` en el siguiente intento sumará: correctas previas + nuevas correctas. Si el usuario marca diferente en una correcta previa (no podrá, está deshabilitada), se mantiene la respuesta original.

En `DynamicPortalRenderer.tsx`:
- `handleQuizRetry` debe recibir desde el bloque la lista de claves a limpiar. Cambiar la firma a `onQuizRetry?: (keysToReset: string[]) => void` y propagarla a través de `PortalFormatoRenderer` → `renderPortalBlock` → `BloqueEvaluationQuizRenderer`.
- Al ejecutarse, hace `setAnswers(prev => { const next = {...prev}; keysToReset.forEach(k => delete next[k]); return next; })` y `setSubmitted(false)`.

#### 3. Historial de intentos correcto

En `DynamicPortalRenderer.tsx`:
- Al hacer submit con quiz, antes de persistir la nueva respuesta, registrar el intento previo en `intentos_evaluacion` (columna real). Cada intento guarda: `{ timestamp, puntaje, correctas, total, aprobado, answers_snapshot }`.
- Eliminar el campo `_intentos_evaluacion` que se inyectaba dentro de `answers`.

Esto requiere extender `useSaveFormatoRespuesta` y `formatoRespuestaService.upsert` para aceptar opcionalmente `intentosEvaluacion: Record<string, unknown>[]` y mapearlo a `intentos_evaluacion` en el upsert. Sin migración SQL — la columna ya existe.

#### 4. Sin tocar el bloqueo de documentos dependientes

`enviarFormatoDinamico` seguirá marcando `documentos_portal.estado='completado'` en cada envío, lo cual desbloquea documentos dependientes (comportamiento esperado: aprobó al menos una vez). Si el último intento reprueba, igual queda como completado en el portal — esto es coherente con el modelo actual: el "envío" cuenta, y el puntaje histórico queda en `intentos_evaluacion`. Los administradores pueden ver el mejor / último puntaje desde el detalle de matrícula.

### Archivos tocados

| Archivo | Cambio |
|---|---|
| `src/modules/formatos/plugins/safa/blocks/portal/BloqueEvaluationQuizRenderer.tsx` | Botón retry siempre visible tras submit. Etiqueta dinámica según aprobación. Al hacer click identifica claves de preguntas incorrectas y las pasa al `onRetry(keysToReset)`. Preguntas correctas se renderizan deshabilitadas con check verde permanente en el siguiente intento. |
| `src/components/portal/PortalFormatoRenderer.tsx` | Cambia firma `onQuizRetry?: (keysToReset: string[]) => void` y la propaga. |
| `src/pages/estudiante/DynamicPortalRenderer.tsx` | `handleQuizRetry(keysToReset)` borra solo esas claves de `answers` y vuelve a `submitted=false`. Para quizzes, `isCompleted` deriva solo de `submitted` local (no de `existingResp.estado`) → botón "Enviar evaluación" reaparece. En `handleSubmit` con quiz, calcula nuevo intento y lo agrega a `intentosEvaluacion` antes de persistir. Elimina inyección de `_intentos_evaluacion` en `answers`. |
| `src/hooks/useFormatoRespuestas.ts` | `useSaveFormatoRespuesta` acepta opcionalmente `intentosEvaluacion`. |
| `src/modules/formatos/plugins/safa/respuestas/respuestaService.ts` | `upsert` recibe `intentosEvaluacion` opcional y lo mapea a la columna `intentos_evaluacion`. |

### Validación post-cambio

- Aprendiz reprueba con 60% (umbral 70%) → ve botón "Reintentar para aprobar". Hace clic → solo las preguntas que falló se limpian; las correctas quedan bloqueadas con check verde. Selecciona nuevas opciones, envía → puntaje recalculado (correctas previas + nuevas).
- Aprendiz aprueba con 80% → ahora también ve botón "Realizar nuevo intento". Puede repetir cuantas veces quiera.
- Al recargar la página después de enviar: si el formato tiene quiz, el formulario sigue editable y permite un nuevo intento (no queda en modo solo-lectura permanente).
- Cada envío añade una entrada en `formato_respuestas.intentos_evaluacion` con `{ timestamp, puntaje, correctas, total, aprobado }`. Verificable en BD con un `SELECT intentos_evaluacion FROM formato_respuestas WHERE matricula_id=... AND formato_id=...`.
- Los formatos sin quiz mantienen comportamiento actual: una vez enviados quedan en solo-lectura.
- El portal sigue marcando el documento como "completado" tras el primer envío, desbloqueando dependientes — sin regresiones en la lógica de bloqueo/dependencia.

### Sin impacto colateral

- Cero cambios en BD ni RLS (la columna `intentos_evaluacion` ya existe en `formato_respuestas`).
- Cero impacto en formatos sin bloque `evaluation_quiz`.
- Cero impacto en el renderer documental (`DynamicFormatoDocument` para PDF) ni en el editor de formatos.
- Los triggers `sync_portal_to_formato_respuestas` y `sync_formato_respuestas_to_portal` siguen funcionando igual: el último envío manda y queda como `completado`.
- El historial de intentos pasa de un campo "sucio" dentro de `answers` a la columna canónica, lo que limpia datos para futuros tableros administrativos.

