
## Plan: Formato de Evaluación Reentrenamiento (FIH04-019) en Formatos para Formación

### Diagnóstico del sistema actual

El motor de formatos funciona así hoy:

1. **Registro** — `FormatosList` en `MatriculaDetailSheet` y `MatriculaDetallePage` recibe un array hardcodeado de 3 formatos con id string y estado calculado en línea.
2. **Estado** — calculado inline: `(!matricula.autorizacionDatos || !matricula.firmaCapturada) ? "borrador" : "completo"`.
3. **Preview** — cada formato tiene un `*PreviewDialog` propio que abre un `Dialog` con `window.print()` para descarga PDF.
4. **Documento renderer** — componente puro que recibe `{ persona, matricula, curso }` y renderiza HTML estilado.
5. **Persistencia de respuestas** — `matricula.autoevaluacionRespuestas` y `matricula.evaluacionCompetenciasRespuestas` ya existen en el tipo `Matricula`. Para la evaluación nueva se usarán campos análogos: `evaluacionCompletada: boolean` y `evaluacionPuntaje?: number` que ya existen en `Matricula`.

**Lo que no existe aún**: un formato de evaluación real con preguntas, puntaje, resultado aprueba/no aprueba y estado derivado del puntaje.

---

### Decisiones de diseño

- **Sin nuevas rutas ni tipos de formato nuevos** — el nuevo formato se agrega al array existente de `FormatosList` como cuarta entrada.
- **Estado del formato evaluación** — `"completo"` cuando `matricula.evaluacionCompletada === true`, `"borrador"` en caso contrario. Reutiliza el campo existente.
- **Persistencia** — al enviar la evaluación se llama `updateMatricula` con `{ evaluacionCompletada: true, evaluacionPuntaje: puntaje }` usando el hook existente `useUpdateMatricula`.
- **Preguntas hardcodeadas** — 15 preguntas de selección única (Verdadero/Falso o A/B/C/D) con respuestas correctas definidas en la constante del documento. El umbral de aprobación es 70%.
- **Renderer** — sigue el patrón exacto de `RegistroAsistenciaDocument` y `InfoAprendizDocument`: componente puro, `DocumentHeader` reutilizado, estilos inline + clases CSS para print.
- **Dialog de preview** — sigue el patrón de `InfoAprendizPreviewDialog`: `Dialog` con `ScrollArea`, botón imprimir, `useRef` para contenido.
- **Interactividad en preview** — igual que `InfoAprendizDocument`: RadioGroups visibles en pantalla, ocultos en print; texto plano visible en print.
- **Preparado para Vista del Estudiante** — el renderer no asume contexto admin, recibe props puras `{ persona, matricula, curso }` y un callback `onSubmit` opcional para desacoplar la lógica de guardado.

---

### Archivos a crear

#### 1. `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx`

Renderer puro del documento. Contenido:

- **Encabezado**: `DocumentHeader` con código `FIH04-019`, versión `004`, subsistema `SSTA`, fecha creación `03/24`, fecha edición `03/24`.
- **Sección datos del estudiante**: fecha, tipo/número documento, nombre completo, nivel de formación (autocompletados desde `persona` y `matricula`).
- **15 preguntas hardcodeadas** de la evaluación de Reentrenamiento Trabajo en Alturas (preguntas de Verdadero/Falso y selección única relevantes a la Res. 4272/2021, uso de EPP, sistemas de anclaje, etc.).
- **Modo pantalla**: `RadioGroup` interactivo por pregunta (opciones: Verdadero / Falso o A/B/C según corresponda).
- **Modo print**: texto plano de la respuesta seleccionada, oculta los controles interactivos con clase CSS `.screen-only-eval { display: none } .print-only-eval { display: block }`.
- **Botón "Enviar evaluación"** (solo visible si `!matricula.evaluacionCompletada`): calcula puntaje, determina aprueba (≥70%) / no aprueba, llama `onSubmit({ evaluacionCompletada: true, evaluacionPuntaje: puntaje })`.
- **Resultado** (visible si `matricula.evaluacionCompletada`): muestra puntaje y badge "Aprobado" / "No aprobado" con colores emerald/destructive.
- **Props interface**:
  ```ts
  interface Props {
    persona: Persona | null;
    matricula: Matricula;
    curso: Curso | null;
    // Callback desacoplado — el contexto admin lo conecta a updateMatricula,
    // la futura Vista del Estudiante puede conectarlo a su propio endpoint.
    onSubmit?: (data: { evaluacionCompletada: boolean; evaluacionPuntaje: number }) => void;
  }
  ```

#### 2. `src/components/matriculas/formatos/EvaluacionReentrenamientoPreviewDialog.tsx`

Dialog de preview, siguiendo el patrón de `InfoAprendizPreviewDialog`:

```tsx
// Patrón del Dialog
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
    <DialogHeader>
      <DialogTitle>Vista Previa — Evaluación Reentrenamiento (FIH04-019)</DialogTitle>
      <Button onClick={handlePrint}><Download /> Descargar PDF</Button>
    </DialogHeader>
    <ScrollArea>
      <div ref={documentRef}>
        <EvaluacionReentrenamientoDocument
          persona={persona}
          matricula={matricula}
          curso={curso}
          onSubmit={handleSubmit} // Conectado a updateMatricula
        />
      </div>
    </ScrollArea>
  </DialogContent>
</Dialog>
```

`handleSubmit` llama `updateMatricula.mutate(...)` igual que hace `handleAutoSave` en `InfoAprendizPreviewDialog`.

Los `PRINT_STYLES` incluyen las mismas reglas CSS de `.screen-only-eval / .print-only-eval` del InfoAprendiz.

---

### Archivos a modificar

#### 3. `src/pages/matriculas/MatriculaDetallePage.tsx`

Agregar el cuarto formato al array de `FormatosList` (línea ~746):

```tsx
{
  id: "evaluacion_reentrenamiento",
  nombre: "Evaluación Reentrenamiento (FIH04-019)",
  estado: matricula.evaluacionCompletada ? "completo" : "borrador",
},
```

Importar `EvaluacionReentrenamientoPreviewDialog` y agregarlo al final junto a los otros tres dialogs de preview.

#### 4. `src/components/matriculas/MatriculaDetailSheet.tsx`

Mismo cambio que en `MatriculaDetallePage` — agregar el cuarto formato al array de `FormatosList` (línea ~556) e importar + usar `EvaluacionReentrenamientoPreviewDialog`.

---

### Preguntas de la evaluación (15 preguntas hardcodeadas)

Serán preguntas representativas sobre Reentrenamiento Trabajo en Alturas conforme a la Res. 4272/2021. Ejemplo de estructura interna:

```ts
const PREGUNTAS = [
  {
    id: 1,
    texto: "La Resolución 4272 de 2021 establece los requisitos mínimos de seguridad para el trabajo en alturas en Colombia.",
    opciones: ["Verdadero", "Falso"],
    correcta: 0, // índice de la opción correcta
  },
  {
    id: 2,
    texto: "Se considera trabajo en alturas toda actividad que se realice a más de...",
    opciones: ["1 metro", "1.5 metros", "2 metros", "3 metros"],
    correcta: 2,
  },
  // ... 13 preguntas más
];
```

---

### Flujo de estado del formato

```text
matricula.evaluacionCompletada = false  →  estado: "borrador"  →  el formato muestra las preguntas con RadioGroups
                                                                    el botón "Enviar" es visible
Usuario responde y hace clic "Enviar"
  → se calcula puntaje (correctas / total * 100)
  → updateMatricula({ evaluacionCompletada: true, evaluacionPuntaje: puntaje })
  → toast de éxito

matricula.evaluacionCompletada = true   →  estado: "completo"  →  el formato muestra resultado y respuestas en modo lectura
                                                                    el botón "Enviar" está oculto
```

---

### Archivos a crear/modificar (resumen)

| Acción | Archivo |
|--------|---------|
| Crear | `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx` |
| Crear | `src/components/matriculas/formatos/EvaluacionReentrenamientoPreviewDialog.tsx` |
| Modificar | `src/pages/matriculas/MatriculaDetallePage.tsx` — agregar 4to formato en lista + dialog |
| Modificar | `src/components/matriculas/MatriculaDetailSheet.tsx` — agregar 4to formato en lista + dialog |

**Sin cambios en**: `src/types/matricula.ts` (campos `evaluacionCompletada` y `evaluacionPuntaje` ya existen), `src/services/matriculaService.ts`, `src/data/mockData.ts`, `FormatosList.tsx`, `DocumentHeader.tsx`.
