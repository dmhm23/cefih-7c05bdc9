

# Plan: Evaluación sin resultados prematuros + Persistencia de respuestas + Reintento

## Problemas identificados

1. **Resultados visibles antes del envío**: `BloqueEvaluationQuizRenderer` muestra el resultado (porcentaje, aprobado/no aprobado) en tiempo real apenas se responden todas las preguntas. Debe ocultarse hasta después del envío.

2. **Respuestas no se cargan al reingresar**: `DynamicPortalRenderer` inicializa `answers` como `{}` y nunca consulta `formato_respuestas` para cargar datos previos. Esto causa que documentos ya completados aparezcan vacíos (excepto firmas que se cargan por separado).

3. **Sin flujo de reintento**: Tras enviar, el estudiante es redirigido a `/estudiante/inicio` sin opción de ver resultados ni reintentar.

## Cambios propuestos

### 1. `BloqueEvaluationQuizRenderer.tsx` — Ocultar resultados hasta envío

- Agregar nueva prop `submitted?: boolean` al componente
- El bloque de resultado (`result && ...`) solo se muestra cuando `submitted === true`
- Cuando `submitted` es true Y el resultado existe, mostrar además la revisión pregunta por pregunta (correcto/incorrecto con colores)
- Cuando `submitted` es true Y no aprobó, habilitar botón "Reintentar evaluación" que resetea las respuestas del quiz manteniendo las anteriores pre-llenadas
- El cálculo del resultado (`_result` en answers) sigue funcionando internamente para que el sistema lo persista al enviar

### 2. `DynamicPortalRenderer.tsx` — Cargar respuestas previas

- Importar `useFormatoRespuesta` de `useFormatoRespuestas.ts`
- Consultar `formato_respuestas` para `(matriculaId, formatoId)`
- Si existe una respuesta previa con `estado === 'completado'`, inicializar `answers` con los datos guardados y marcar `submitted = true`
- Si la respuesta tiene `estado === 'reabierto'` o `'pendiente'`, cargar answers pero mantener `submitted = false`
- Pasar `submitted` al renderer para controlar visibilidad de resultados
- **No redirigir tras envío** si hay quiz: quedarse en la página, actualizar estado a `submitted = true` para mostrar resultados

### 3. `PortalFormatoRenderer.tsx` — Propagar `submitted` a bloques quiz

- Agregar prop `submitted?: boolean` al componente
- Pasarla al renderizado de `evaluation_quiz` blocks

### 4. Flujo de reintento en quiz

- Cuando el estudiante ve resultado "NO APROBADO" + `submitted = true`:
  - Mostrar botón "Reintentar evaluación"
  - Al hacer clic: resetear `submitted = false`, mantener respuestas actuales pre-llenadas para que el estudiante las pueda modificar
  - Registrar intento en `intentos_evaluacion` del `formato_respuestas` (array JSONB que ya existe en la tabla)
  - Permitir reenvío

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/matriculas/formatos/bloques/BloqueEvaluationQuizRenderer.tsx` | Agregar prop `submitted`, ocultar resultado hasta submitted=true, mostrar revisión detallada |
| `src/pages/estudiante/DynamicPortalRenderer.tsx` | Cargar answers previos de `formato_respuestas`, manejar estado `submitted`, no redirigir si hay quiz, flujo de reintento |
| `src/components/portal/PortalFormatoRenderer.tsx` | Agregar y propagar prop `submitted` a bloques evaluation_quiz |

## Detalle técnico del flujo

```text
Estudiante abre documento
  ├─ ¿Tiene formato_respuesta completado? 
  │    ├─ Sí → cargar answers, submitted=true, readOnly parcial
  │    └─ No → answers={}, submitted=false
  │
  ├─ Llena quiz (resultado oculto)
  │
  ├─ Clic "Enviar documento"
  │    ├─ Persistir en formato_respuestas + documentos_portal
  │    ├─ Si tiene quiz: quedarse, submitted=true → mostrar resultado
  │    └─ Si no tiene quiz: redirigir a /estudiante/inicio
  │
  └─ Si NO APROBÓ:
       ├─ Mostrar revisión (correctas/incorrectas por pregunta)
       ├─ Botón "Reintentar evaluación"
       │    ├─ Guardar intento previo en intentos_evaluacion[]
       │    ├─ submitted=false, mantener answers pre-llenadas
       │    └─ Estudiante corrige y reenvía
       └─ El ciclo se repite
```

