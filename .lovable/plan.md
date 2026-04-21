

## Plan: Limpiar resumen de calificación + persistir vista calificada al refrescar el portal

### Problema 1 — Resumen con metadatos innecesarios

`ResumenCalificacionQuiz` (dentro de `BloqueEvaluationQuizRenderer.tsx`) muestra:
- "· Intento del 21 de abril de 2026"
- "Calificación recalculada con la versión vigente del cuestionario"

Ambos elementos deben eliminarse. El resumen quedará minimalista: badge APROBADO/NO APROBADO + puntaje + "8 de 10 respuestas correctas".

### Problema 2 — Vista calificada se pierde al refrescar el portal

#### Causa raíz

En `DynamicPortalRenderer.tsx` (líneas 41–42), al hidratar respuestas existentes hay un comentario explícito:

> "for quizzes we DON'T set submitted=true on hydration so the student can always run a new attempt"

Esto provoca que tras refrescar:
- `submitted = false` → el quiz se renderiza **interactivo** (modo por defecto).
- `answers` sí se hidrata con las selecciones previas → las opciones aparecen marcadas como si el estudiante estuviera a punto de enviar.
- Aparece el botón "Enviar evaluación".
- No se pintan los badges ✓/✗ ni el resumen APROBADO/NO APROBADO.

El resultado es confuso: parece un formulario a medio diligenciar, no una evaluación ya completada.

#### Solución óptima

Hidratar el portal en **modo graded-readonly** (la misma vista que ya funciona en Matrículas/PDF) cuando el estudiante regresa después de haber completado al menos un intento. Para reintentar, se ofrece un botón explícito que limpia el estado y reinicia el flujo interactivo.

Comportamiento por escenario en `/estudiante`:

| Estado en BD | Vista que se muestra al cargar |
|---|---|
| Sin `formato_respuestas` o sin `intentos_evaluacion` | Modo interactivo (igual que hoy) |
| `intentos_evaluacion` con al menos un intento | **Modo graded-readonly** con resumen + ✓/✗ + botón "Realizar nuevo intento" |
| Acaba de hacer submit en esta sesión (`submitted=true`) | Modo graded-readonly (ya funciona) |

### Cambios técnicos

#### 1. `BloqueEvaluationQuizRenderer.tsx` — limpiar resumen

En el subcomponente `ResumenCalificacionQuiz`:
- Eliminar el bloque que arma `fecha` desde `timestamp` y el segmento `· Intento del {fecha}` del párrafo de correctas/total.
- Eliminar completamente el `<p>` con la nota "Calificación recalculada con la versión vigente del cuestionario" (y el flag `reconstruido` deja de usarse en UI).
- Mantener intacto el resto: badge APROBADO/NO APROBADO, puntaje grande, línea "X de Y respuestas correctas".

#### 2. `DynamicPortalRenderer.tsx` — hidratar como graded-readonly cuando hay intentos

a) Reemplazar el flag `submitted` simple por una distinción entre:
- `justSubmitted` (booleano local) — true solo cuando el usuario acaba de enviar en esta sesión.
- `viewingGraded` (derivado) — true si `justSubmitted` o si `existingResp?.intentosEvaluacion?.length > 0`.

b) Calcular el `intentoVigente` al hidratar (último aprobado, fallback al último):
```ts
const intentos = existingResp?.intentosEvaluacion ?? [];
const intento = intentos.findLast((i: any) => i?.aprobado) ?? intentos.at(-1);
```

c) Pasar `viewingGraded` como `submitted` al `PortalFormatoRenderer` (compat con la prop existente) y adicionalmente propagar el modo graded-readonly + intentoVigente hacia el quiz.

d) Ocultar el botón "Enviar evaluación" cuando `viewingGraded` es true.

e) Reemplazar el botón "Volver al inicio" por dos acciones cuando `viewingGraded` es true:
- **"Realizar nuevo intento"** (variant outline): limpia `answers` (quita las claves del quiz y los `_result`), pone `justSubmitted=false`, y deja al usuario en modo interactivo listo para responder otra vez.
- **"Volver al inicio"** (variant ghost): navega a `/estudiante/inicio`.

#### 3. `PortalFormatoRenderer.tsx` — propagar el modo y el intento al quiz

a) Aceptar dos props nuevas opcionales: `quizMode?: 'interactive' | 'graded-readonly'` y `intentosVigentesByBloqueId?: Record<string, IntentoVigente | null>`.

b) En el `case 'evaluation_quiz'`:
```tsx
<BloqueEvaluationQuizRenderer
  ...
  mode={quizMode ?? 'interactive'}
  intentoVigente={intentosVigentesByBloqueId?.[bloque.id] ?? null}
/>
```

c) `DynamicPortalRenderer` arma el mapa `intentosVigentesByBloqueId` recorriendo `existingResp.intentosEvaluacion` y extrayendo, por cada `bloqueId` presente en `resultados`, el último intento aprobado (o último a secas) con su `{ puntaje, correctas, total, aprobado, timestamp }`.

#### 4. Reset al "Realizar nuevo intento"

Handler dentro de `DynamicPortalRenderer`:
```ts
const handleNewAttempt = () => {
  setAnswers(prev => {
    const next: Record<string, unknown> = {};
    // Conservar claves no-quiz (firmas, otros campos) intactas
    Object.entries(prev).forEach(([k, v]) => {
      const isQuizKey = formato.bloques.some(b =>
        b.type === 'evaluation_quiz' &&
        (k.startsWith(`${b.id}_q`) || k === `${b.id}_result`)
      );
      if (!isQuizKey) next[k] = v;
    });
    return next;
  });
  setJustSubmitted(false);
  setViewingGradedOverride(false); // fuerza modo interactivo aunque haya intentos previos
};
```

Se introduce `viewingGradedOverride` (booleano de sesión) para que un click en "Nuevo intento" no rebote inmediatamente al modo graded-readonly por la presencia de intentos en BD.

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/modules/formatos/plugins/safa/blocks/portal/BloqueEvaluationQuizRenderer.tsx` | Eliminar `fecha`/timestamp y la nota "Calificación recalculada…" del `ResumenCalificacionQuiz`. |
| `src/pages/estudiante/DynamicPortalRenderer.tsx` | Calcular `viewingGraded` (con override por "nuevo intento"); construir `intentosVigentesByBloqueId`; pasar `quizMode` e `intentos…` al renderer; reemplazar botón final por "Realizar nuevo intento" + "Volver al inicio"; ocultar "Enviar evaluación" en modo graded. |
| `src/components/portal/PortalFormatoRenderer.tsx` | Aceptar props `quizMode` e `intentosVigentesByBloqueId`; reenviarlas al `BloqueEvaluationQuizRenderer`. |

### Validación post-cambio

#### Problema 1
- Abrir formato calificado desde Matrículas → resumen muestra solo `APROBADO 80%` + `8 de 10 respuestas correctas`. Sin fecha, sin nota de recalculado.
- PDF idem.

#### Problema 2
- Estudiante completa y aprueba evaluación → ve modo graded. **Refresca el navegador** → sigue viendo modo graded (resumen + ✓/✗ + opciones bloqueadas). Sin botón "Enviar".
- Click en "Realizar nuevo intento" → opciones se limpian, vuelve modo interactivo, botón "Enviar evaluación" aparece, puede responder y enviar de nuevo.
- Después del nuevo envío, ve resumen actualizado del último intento.
- Refresca otra vez → modo graded con el último intento.
- Estudiante que nunca ha respondido → sigue viendo modo interactivo desde el primer load (sin regresión).
- Formatos sin `evaluation_quiz` → comportamiento idéntico al actual (sin cambio).

#### Verificación de no-regresión
- Modo graded en Matrículas/PDF sigue funcionando idéntico (solo se limpia su contenido visual).
- Hidratación de respuestas no-quiz (firmas, inputs) intacta.
- `intentos_evaluacion` en BD no se modifica por hidratación; solo se lee.
- El handler de "Nuevo intento" solo limpia claves del quiz; conserva firmas y otros campos.

### Sin impacto colateral

- Cero cambios en BD, triggers, RLS o servicios.
- Cero cambios en `DynamicFormatoDocument` ni en estilos de impresión.
- Cero cambios en el editor de formatos.
- Cambio aditivo en `PortalFormatoRenderer` (props nuevas opcionales con defaults seguros).

