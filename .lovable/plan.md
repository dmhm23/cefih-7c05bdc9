## Plan: Reflejar la calificación del quiz dentro del formato de evaluación (vista admin / PDF)

### Objetivo

Cuando un aprendiz responde una evaluación tipo `evaluation_quiz` en el portal y la envía, esa **misma vista calificada** (con badges ✓/✗ por opción, opciones correctas resaltadas y opciones incorrectas marcadas) debe verse igual al abrir el formato desde **Matrículas → Detalle → Formato** y al abrirlo como vista previa, **imprimirlo o descargarlo como PDF**. La única diferencia es que arriba de la primera pregunta aparece un **resumen de calificación** (puntaje, badge APROBADO/NO APROBADO).

### Comportamiento sobre reintentos

- El formato **siempre** muestra **el último intento aprobado**.
- Si nunca hay un intento aprobado, muestra el último intento (reprobado).
- Los intentos anteriores se descartan visualmente — el formato no muestra historial. El array `intentos_evaluacion` puede mantenerse en BD como log auditable, pero el renderer solo lee el “vigente”.

### Por qué un solo cambio en el renderer y no un bloque nuevo

El bloque `evaluation_quiz` ya existe, ya tiene la lógica visual de pintar correcta/incorrecta (la usa el portal cuando `submitted=true`), y ya guarda los datos necesarios en `formato_respuestas.answers` (selecciones del estudiante) y en `intentos_evaluacion` (puntaje, correctas, total, aprobado).

La forma óptima es **enseñarle al renderer documental (`DynamicFormatoDocument`) y al renderer del bloque a entrar en “modo calificado de solo lectura”** cuando detecten que existe un intento registrado, reutilizando el mismo componente que pinta el portal post-submit. Sin tablas nuevas, sin migraciones, sin bloques adicionales, sin acoplamiento entre módulos.

### Arquitectura propuesta

```
formato_respuestas
├─ answers              ← selecciones del estudiante (ya existe)
└─ intentos_evaluacion  ← [{timestamp, resultados, aprobado, ...}] (ya existe)
                          el renderer toma el último con aprobado=true,
                          o el último a secas si ninguno aprobó

         ↓ leído por

DynamicFormatoDocument (vista admin/PDF)
         ↓
    BloqueEvaluationQuizRenderer
         · modo: "graded-readonly"
         · pinta selecciones, ✓/✗, opciones bloqueadas
         · muestra ResumenCalificacion ARRIBA de la 1ª pregunta
```

### Cambios técnicos

#### 1. Nuevo modo `graded-readonly` en `BloqueEvaluationQuizRenderer.tsx`

Hoy el componente tiene dos modos implícitos:

- **Edición** (`!submitted`): el aprendiz puede seleccionar opciones.
- **Calificado post-submit** (`submitted=true`): muestra ✓/✗ y bloquea opciones.

Se agrega una prop `mode?: 'interactive' | 'graded-readonly'` (default `interactive`). En `graded-readonly`:

- Todas las opciones se renderizan deshabilitadas.
- Se muestra el feedback visual ya implementado (verde = correcta, rojo = incorrecta seleccionada, badge ✓/✗).
- No se renderiza el botón “Reintentar”.
- En lugar del banner de resultado al final, se muestra el **ResumenCalificacion arriba de la primera pregunta**.

Esto reutiliza ~90% del código existente. Cero duplicación.

#### 2. Nuevo subcomponente `ResumenCalificacionQuiz` (interno al renderer)

Vive dentro del mismo archivo `BloqueEvaluationQuizRenderer.tsx` para no fragmentar. Renderiza una tarjeta con:

- Badge grande “APROBADO” (verde) / “NO APROBADO” (rojo).
- Puntaje grande (ej. `80%`).
- Línea secundaria: `8 de 10 respuestas correctas · Intento del 21 de abril de 2026`.

Se posiciona **antes del primer `<div>` de pregunta** dentro del `map` del componente. Estilos con tokens semánticos (`bg-accent`, `text-foreground`, `border-border`) para que se vea consistente light/dark y se imprima bien en PDF.

#### 3. `DynamicFormatoDocument.tsx` — detectar y aplicar el modo

En el `case 'evaluation_quiz'` del switch de bloques:

1. Lee `respuesta?.intentosEvaluacion` (ya disponible en el contexto del documento porque el componente recibe la `formatoRespuesta`).
2. Calcula el **intento vigente**: `intentos.findLast(i => i.aprobado) ?? intentos.at(-1)`.
3. Si existe intento vigente: renderiza `<BloqueEvaluationQuizRenderer mode="graded-readonly" intentoVigente={...} answers={respuesta.answers} bloque={bloque} />`.
4. Si no existe intento (formato sin presentar): renderiza el bloque en estado vacío con leyenda “Evaluación pendiente”.

#### 4. Reutilización en el portal (sin cambio funcional)

El portal seguirá mostrando lo que ya muestra. Solo se asegura que cuando el portal entra en modo post-submit, también pueda usar `mode="graded-readonly"` opcionalmente, pero **no es obligatorio para esta historia**: el portal mantiene su flujo interactivo + retry. Cero regresión.

#### 5. PDF / impresión

`DynamicFormatoDocument` ya está conectado al sistema de impresión (`PRINT_STYLES`). Se añaden las reglas CSS necesarias para que el `ResumenCalificacionQuiz` y los badges ✓/✗ del modo calificado se rendericen con colores planos imprimibles (sin gradientes, fondos sólidos sutiles, bordes definidos). Mantiene fidelidad visual entre pantalla y PDF.

### Compatibilidad con datos preexistentes

#### Tres escenarios:

**A. Evaluaciones nuevas (post-cambio)**: cada submit guarda `intentos_evaluacion` enriquecido. El renderer las pinta perfecto.

**B. Evaluaciones legacy con `intentos_evaluacion` poblado pero sin marca de aprobación clara**: el renderer aplica el fallback `intentos.at(-1)` y deriva `aprobado` comparando puntaje vs `umbralAprobacion` del bloque. Cero pérdida de datos.

**C. Evaluaciones legacy con `intentos_evaluacion = []` pero `formato_respuestas.estado = 'completado'**`: el renderer reconstruye un intento sintético al vuelo desde `answers`:

1. Recorre las claves `<bloqueId>_q<id>` en `answers`.
2. Compara contra `preg.correcta` del bloque actual.
3. Calcula `correctas`, `total`, `puntaje`, `aprobado`.
4. Usa `completado_at` como timestamp.
5. Lo trata como intento vigente para renderizar.

Esta reconstrucción es **solo de lectura** — no se persiste, no toca BD, no modifica `answers`. Si el formato fuente fue editado (preguntas diferentes), igual reconstruye con la definición actual y muestra una nota discreta: *“Calificación recalculada con la versión vigente del cuestionario”*. Honestidad sobre el cómputo.

#### Garantías de seguridad sobre datos viejos

- Cero `UPDATE` sobre `formato_respuestas` durante el render.
- Cero migración SQL.
- Cero borrado de información.
- Si la reconstrucción falla por cualquier motivo, el bloque se renderiza vacío con leyenda “Evaluación registrada — detalle no disponible” en lugar de romper la página.

### Archivos modificados


| Archivo                                                                            | Cambio                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/modules/formatos/plugins/safa/blocks/portal/BloqueEvaluationQuizRenderer.tsx` | Nueva prop `mode`. En `graded-readonly`: bloquea inputs, oculta botón retry, monta `ResumenCalificacionQuiz` arriba de la primera pregunta. Subcomponente interno `ResumenCalificacionQuiz`.                            |
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx`                    | En `case 'evaluation_quiz'`: calcular intento vigente (`findLast aprobado` con fallback al último), reconstruir desde `answers` si `intentos_evaluacion` está vacío, renderizar el bloque con `mode="graded-readonly"`. |
| `src/components/matriculas/formatos/DynamicFormatoPreviewDialog.tsx`               | Asegurar que se pasa la `formatoRespuesta` completa al `DynamicFormatoDocument` (probablemente ya lo hace; verificar).                                                                                                  |
| Archivo de estilos de impresión (donde vivan `PRINT_STYLES`)                       | Agregar reglas para `.quiz-graded-summary`, `.quiz-option-correct`, `.quiz-option-incorrect`, `.quiz-option-disabled` con colores planos imprimibles.                                                                   |


### Validación post-cambio

#### Flujos nuevos

- Aprendiz responde y aprueba con 80% → admin abre el formato desde Matrícula → ve resumen verde “APROBADO 80% · 8 de 10 · 21 abr 2026” arriba de la pregunta 1, y cada pregunta muestra la opción que marcó con badge ✓/✗.
- Imprime el PDF → idéntica vista, colores planos, todo legible.
- Aprendiz reintenta y aprueba con 90% → al refrescar el formato, el resumen ahora dice 90% y las opciones reflejan las del último intento aprobado. El intento de 80% queda solo en el log.
- Aprendiz nunca aprueba (mejor intento 60%) → se muestra el último intento con resumen rojo “NO APROBADO 60%”.

#### Flujos retroactivos

- Evaluación legacy con `intentos_evaluacion` poblado: se renderiza tomando el último vigente; se muestra correctamente con todo el detalle visual.
- Evaluación legacy con `intentos_evaluacion = []` pero `estado = 'completado'`: se reconstruye al vuelo, se muestra resumen + detalle, con leyenda discreta sobre el recálculo si el formato fuente fue editado.
- Evaluación pendiente (sin enviar): bloque vacío con leyenda “Evaluación pendiente”.

#### Verificaciones de no-regresión

- El portal del estudiante sigue funcionando exactamente igual: interactivo, con retry sobre incorrectas, con persistencia de intentos. Cero cambio funcional ahí.
- Los formatos sin bloque `evaluation_quiz` no se ven afectados.
- El editor de formatos no requiere cambios — se sigue insertando el `evaluation_quiz` igual que siempre.
- El sistema de certificación sigue rigiéndose por `formato_respuestas.estado = 'completado'` — el cambio es solo de presentación.

### Decisiones explícitas y trade-offs

1. **“Último aprobado” vs “mejor”**: se eligió último aprobado porque es coherente con el modelo donde el último envío manda (lo mismo hace `documentos_portal`). Si más adelante se quiere “mejor histórico”, basta con cambiar la función de selección del intento vigente — un solo punto.
2. **Sin bloque nuevo `evaluation_summary**`: se descartó porque agrega superficie al editor sin valor para este caso. El propio `evaluation_quiz` ya sabe pintarse calificado.
3. **Sin tabla nueva**: toda la información viaja en `formato_respuestas` que ya está modelada.
4. **Sin migración**: cero riesgo operativo, despliegue inmediato, rollback trivial (revertir código).
5. **Resumen arriba de la 1ª pregunta**: el componente que monta el resumen vive dentro del mismo `evaluation_quiz`, así que su posición es estable y no depende de que el admin lo agregue manualmente al diseñar el formato.

### Sin impacto colateral

- Cero cambios en el editor de formatos.
- Cero cambios en triggers ni RLS.
- Cero cambios en flujo de certificación, cartera, matrícula, portal.
- Cero acoplamiento nuevo entre módulos.
- Cambio aditivo: si la prop `mode` no se pasa, el renderer se comporta exactamente como hoy.