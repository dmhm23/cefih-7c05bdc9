

## Mejoras en Documento Informacion del Aprendiz

### 1. Autoguardado de Autoevaluacion con toast

**Problema:** Las respuestas de la autoevaluacion se manejan solo con `useState` local y se pierden al cerrar el modal.

**Solucion:**
- Agregar campos `autoevaluacionRespuestas` y `evaluacionCompetenciasRespuestas` al tipo `Matricula` en `src/types/matricula.ts`
- En `InfoAprendizDocument.tsx`, recibir un callback `onAutoSave` desde el padre
- Inicializar el estado desde `matricula.autoevaluacionRespuestas` (o valores por defecto)
- Al cambiar cualquier respuesta, llamar `onAutoSave` con los datos actualizados
- En `InfoAprendizPreviewDialog.tsx`, usar el hook `useUpdateMatricula` para persistir y mostrar toast con `sonner` ("Cambios guardados")
- Usar un debounce simple (setTimeout 500ms) para no disparar guardados en cada clic rapido

### 2. Nueva seccion "Evaluacion de Competencias"

**Ubicacion:** Debajo de la autoevaluacion en `InfoAprendizDocument.tsx`

**Preguntas:**
- Sabe seguir y acatar instrucciones?
- Sabe trabajar en equipo?
- Sabe que es acto y condicion insegura?
- Que tanta disposicion tiene para desarrollar la presente formacion?
- Se considera usted habilidoso para la resolucion de problemas?

**Opciones:** Malo, Aceptable, Excelente, N/A (default: Excelente)

**Implementacion:** Misma estructura de tabla con RadioGroup que la autoevaluacion. Mismo mecanismo de autoguardado.

### 3. Consentimiento de salud editable

**Problema:** Actualmente muestra los datos de la matricula como texto estatico (Si/No).

**Solucion:**
- Convertir cada pregunta de salud en un Switch o RadioGroup editable dentro del documento
- Los campos de detalle (restriccionMedicaDetalle, etc.) se muestran como inputs editables cuando la respuesta es "Si"
- Al cambiar cualquier valor, disparar el mismo `onAutoSave` con los datos actualizados
- Toast de confirmacion igual que en autoevaluacion

### 4. Saltos de pagina en PDF

**Solucion:** Agregar la clase CSS `page-break` a cada `SectionTitle` y en `PRINT_STYLES` usar:
```css
.section-title { page-break-inside: avoid; }
.section-title + * { page-break-inside: avoid; }
.section-group { break-inside: avoid; }
```
Envolver cada seccion (titulo + contenido) en un `div.section-group` con `break-inside: avoid` para que CSS evite partir secciones entre paginas.

### 5. Autoevaluacion en PDF como texto (estilo salud)

**Problema:** En el PDF, los radio buttons de la autoevaluacion no se ven bien. Se quiere que se vean como el consentimiento de salud: pregunta a la izquierda, respuesta a la derecha.

**Solucion:** En `handlePrint` de `InfoAprendizPreviewDialog.tsx`, antes de copiar el innerHTML, generar una version alternativa del HTML para las tablas de autoevaluacion:
- Agregar clases `auto-eval-print` a las tablas
- En `PRINT_STYLES`, ocultar las tablas con radio buttons y mostrar una version texto
- Alternativamente: en el componente, renderizar ambas vistas (radio buttons para preview, texto para print) y usar clases CSS para mostrar/ocultar segun contexto

La solucion mas limpia: en `InfoAprendizDocument.tsx`, debajo de cada tabla de radio buttons, agregar un div con clase `print-only-eval` que muestre las respuestas en formato texto (como salud). En la vista previa se oculta con `hidden`, y en `PRINT_STYLES` se muestra. La tabla de radios se oculta en print con `screen-only-eval`.

### Detalle tecnico - Archivos modificados

**A. `src/types/matricula.ts`**
- Agregar a la interfaz `Matricula`:
  - `autoevaluacionRespuestas?: string[]` (array de "si"|"no"|"na")
  - `evaluacionCompetenciasRespuestas?: string[]` (array de "malo"|"aceptable"|"excelente"|"na")
  - `consentimientoEditable` campos ya existen (restriccionMedica, alergias, etc.)

**B. `src/components/matriculas/formatos/InfoAprendizDocument.tsx`**
- Agregar prop `onAutoSave?: (data: Record<string, unknown>) => void`
- Inicializar estados desde matricula en vez de defaults fijos
- Llamar `onAutoSave` en cada cambio de autoevaluacion, competencias y salud
- Agregar nueva seccion de competencias con tabla similar a autoevaluacion
- Hacer consentimiento de salud editable con Switch components
- Agregar inputs para detalles cuando la respuesta es Si
- Envolver cada seccion en `div.section-group`
- Agregar vistas duplicadas print-only para autoevaluacion y competencias en formato texto

**C. `src/components/matriculas/formatos/InfoAprendizPreviewDialog.tsx`**
- Importar `useUpdateMatricula` y `toast` de sonner
- Crear funcion `handleAutoSave` que llama a la mutacion y muestra toast
- Pasar `onAutoSave` a `InfoAprendizDocument`
- Actualizar `PRINT_STYLES`:
  - Agregar `.section-group { break-inside: avoid; }`
  - Agregar `.screen-only-eval { display: none; }` para ocultar radios en print
  - Agregar `.print-only-eval { display: block; }` con estilos tipo health-row
  - Estilos para Switch en print

