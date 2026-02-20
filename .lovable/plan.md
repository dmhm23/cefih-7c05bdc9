## Plan: Rediseño del Formato de Evaluación — Resultados, Preguntas y Encuesta de Satisfacción

### Diagnóstico del estado actual

El componente `EvaluacionReentrenamientoDocument` en `modo="resultados"` presenta:

- Un bloque de resultado grande y pesado visualmente (puntaje en 6xl, contenedor con borde doble, mucho padding).
- Una tabla de resumen estadístico separada y verbosa.
- **Ninguna visualización de las preguntas y respuestas del estudiante** — porque actualmente no se persisten las respuestas individuales, solo `evaluacionPuntaje` y `evaluacionCompletada`.
- **Sin encuesta de satisfacción** — el campo `encuestaCompletada` existe en el tipo pero no hay preguntas ni respuestas asociadas al modelo.

Para implementar los requerimientos, se necesita:

1. Añadir campos de persistencia en el tipo `Matricula` y `mockData`.
2. Rediseñar el bloque de resultado en modo admin.
3. Agregar la sección de preguntas/respuestas (tabla) usando las respuestas guardadas.
4. Agregar la encuesta de satisfacción al final del documento.

---

### Cambios en el modelo de datos

#### `src/types/matricula.ts` — nuevos campos

```ts
// Evaluación de reentrenamiento — respuestas individuales
evaluacionRespuestas?: number[];          // índice de opción seleccionada por pregunta (15 elementos)

// Encuesta de satisfacción
encuestaRespuestas?: string[];            // 4 respuestas de escala + 1 Sí/No (5 elementos)
// encuestaCompletada ya existe
```

Las respuestas de la evaluación se guardan ahora como un array de índices (`number[]`), uno por cada una de las 15 preguntas. El índice corresponde al índice de la opción seleccionada dentro del array `opciones` de cada pregunta (mismo que usa `correcta`). `undefined` significa pregunta no respondida.

#### `src/data/mockData.ts` — actualizar mock m2 y m4

Las matrículas con `evaluacionCompletada: true` (m2 con puntaje 85, m4 con puntaje 92) deben tener `evaluacionRespuestas` y `encuestaRespuestas` para que la vista administrativa muestre datos reales.

Para m2 (85% = 12.75 ≈ 13 correctas de 15):

```ts
evaluacionRespuestas: [0, 2, 1, 2, 0, 1, 2, 0, 1, 2, 0, 0, 1, 0, 1],
// 13 correctas (respuestas incorrectas en preguntas 3, 15 o similares)
encuestaRespuestas: ["muy_satisfecho", "satisfecho", "muy_satisfecho", "satisfecho", "si"],
```

Para m4 (92% = 13.8 ≈ 14 correctas de 15):

```ts
evaluacionRespuestas: [0, 2, 1, 2, 0, 1, 2, 0, 1, 2, 0, 0, 1, 0, 1],
// 14 correctas
encuestaRespuestas: ["muy_satisfecho", "muy_satisfecho", "muy_satisfecho", "muy_satisfecho", "si"],
```

#### `src/services/matriculaService.ts` — sin cambios

El método `update` ya acepta `Partial<MatriculaFormData>` y hace spread, así que los nuevos campos se persisten automáticamente. Sin modificaciones necesarias.

---

### Cambios en `EvaluacionReentrenamientoDocument.tsx`

#### 1. Actualizar la firma `onSubmit`

Para incluir las respuestas individuales:

```ts
onSubmit?: (data: {
  evaluacionCompletada: boolean;
  evaluacionPuntaje: number;
  evaluacionRespuestas: number[];
}) => void;
```

#### 2. Rediseño del bloque de resultado en `modo="resultados"`

Reemplazar `ResultadoConsolidado` con un diseño compacto horizontal:

```
┌─────────────────────────────────────────────────────────────┐
│  Resultado de la evaluación      13/15           ✓ Aprobado │
│  Respuestas correctas           86.67%                       │
└─────────────────────────────────────────────────────────────┘
```

**Estructura HTML:**

- Un grid de 2 columnas (label gris a la izquierda / valor a la derecha).
- Fondo blanco, sin bordes marcados, con un separador sutil.
- Columna derecha:
  - `X/Y` en verde semibold, tamaño `text-2xl`.
  - Porcentaje debajo en `text-sm text-muted-foreground`.
  - Badge de estado inline o debajo del porcentaje.

Eliminar la tabla de resumen estadístico separada — esa información queda integrada en el bloque compacto.

#### 3. Nueva sección: tabla de preguntas y respuestas

Solo visible en `modo="resultados"` cuando `evaluacionCompletada = true` y `evaluacionRespuestas` tiene datos.

**Encabezado de tabla:**


| Pregunta (2 cols) | Respuesta seleccionada | Calificación |
| ----------------- | ---------------------- | ------------ |


**Comportamiento por fila:**

- Columna "Pregunta": número + texto de la pregunta (span de 2 cols en términos de peso visual, pero en la tabla son columnas normales).
- Columna "Respuesta seleccionada": texto de la opción que seleccionó el estudiante.
- Columna "Calificación": ícono `CheckCircle2` (verde, 24px) si es correcta o `XCircle` (rojo, 24px) si es incorrecta. Sin texto.

**Estilo de la tabla:**

- Minimalista, sin saturación de colores.
- `border-b` entre filas, sin fondo alternado.
- Filas de preguntas incorrectas: texto de "Respuesta seleccionada" en color destructive/60.
- Sin colores de fondo en las filas.

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
      <th className="pb-2 text-left w-8">#</th>
      <th className="pb-2 text-left">Pregunta</th>
      <th className="pb-2 text-left w-48">Respuesta seleccionada</th>
      <th className="pb-2 text-center w-16">Calificación</th>
    </tr>
  </thead>
  <tbody>
    {PREGUNTAS.map((p, idx) => {
      const respIdx = evaluacionRespuestas?.[idx];
      const esCorrecto = respIdx === p.correcta;
      return (
        <tr key={p.id} className="border-b last:border-0">
          <td className="py-2.5 text-muted-foreground">{p.id}</td>
          <td className="py-2.5">{p.texto}</td>
          <td className={`py-2.5 ${!esCorrecto ? "text-destructive/70" : ""}`}>
            {respIdx !== undefined ? p.opciones[respIdx] : "—"}
          </td>
          <td className="py-2.5 text-center">
            {esCorrecto
              ? <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto" />
              : <XCircle className="h-6 w-6 text-destructive mx-auto" />}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>
```

#### 4. Nueva sección: Encuesta de Satisfacción

Se añade al final del documento, en ambos modos (`resultados` y `diligenciamiento`).

**En `modo="diligenciamiento"` (futuro estudiante):**

- RadioGroups interactivos con las 4 opciones de escala.
- Pregunta Sí/No con RadioGroup de 2 opciones.
- Estado local `encuestaRespuestas: string[]`.
- El botón "Enviar" incluye también la encuesta al payload de `onSubmit`.

**En `modo="resultados"` (admin):**

- Tabla de solo lectura con las respuestas guardadas en `matricula.encuestaRespuestas`.
- Si no hay respuestas, muestra "Encuesta pendiente de diligenciar".

**Preguntas hardcodeadas:**

```ts
const ENCUESTA_ESCALA = [
  "¿Qué tan satisfecho se encuentra con la capacitación y entrenamiento en trabajo en alturas recibida?",
  "¿Qué tan satisfecho se encuentra con el servicio al cliente recibido por parte de todo el personal de la empresa?",
  "¿Qué tan satisfecho se encuentra con la amabilidad y el trato recibido por parte del personal?",
  "¿Qué tan satisfecho se encuentra con la calidad del servicio brindado durante todo el proceso?",
];

const OPCIONES_ESCALA = ["Muy satisfecho", "Satisfecho", "Poco satisfecho", "Insatisfecho"];
// valores internos: "muy_satisfecho", "satisfecho", "poco_satisfecho", "insatisfecho"

const ENCUESTA_SI_NO = "¿Volvería a contratar y recomendaría el servicio recibido?";
// valores internos: "si", "no"
```

---

### Cambios en `EvaluacionReentrenamientoPreviewDialog.tsx`

- Actualizar `handleSubmit` para incluir `evaluacionRespuestas` en el `updateMatricula.mutate()`.
- Actualizar `PRINT_STYLES`:
  - Agregar estilos para la tabla de preguntas (`.tabla-preguntas`).
  - El bloque de resultado compacto se adapta para print (no hay cambio de tamaño extremo).
  - Asegurar que el ícono check/X se renderiza en print (usar caracteres Unicode como fallback: `✓` / `✗` si los SVG no se imprimen bien en algunos navegadores).

---

### Resumen de archivos a modificar


| Archivo                                                                         | Tipo de cambio                                                                        |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/types/matricula.ts`                                                        | Agregar `evaluacionRespuestas?: number[]` y `encuestaRespuestas?: string[]`           |
| `src/data/mockData.ts`                                                          | Agregar `evaluacionRespuestas` y `encuestaRespuestas` en m2 y m4                      |
| `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx`      | Rediseñar bloque resultado, agregar tabla preguntas, agregar encuesta de satisfacción |
| `src/components/matriculas/formatos/EvaluacionReentrenamientoPreviewDialog.tsx` | Actualizar `handleSubmit` para incluir respuestas, mejorar `PRINT_STYLES`             |


**Sin cambios en**: `MatriculaDetallePage`, `MatriculaDetailSheet`, `matriculaService`, `FormatosList`, ni ningún otro archivo.

---

### Consideraciones para la futura Vista del Estudiante

- El `onSubmit` del documento pasará a incluir `evaluacionRespuestas` (array de índices) y `encuestaRespuestas` (array de strings), con la misma interfaz desacoplada.
- La Vista del Estudiante solo necesita conectar ese callback a su propio endpoint — sin modificar el renderer.
- La sección de encuesta en `modo="diligenciamiento"` está disponible desde ya para cuando se active.