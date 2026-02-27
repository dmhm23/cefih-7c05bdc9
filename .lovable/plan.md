

## Plan: Ajustes UI del Portal Estudiante

### 1. Badge "Completado" en verde (InfoAprendizPage + EvaluacionPage)

Cambiar las instancias de `Badge variant="default"` (azul) a una clase verde explícita (`bg-green-500 text-white` o similar) en ambas páginas donde se muestra el estado "Completado" o "Aprobado".

**Archivos**: `InfoAprendizPage.tsx` (líneas ~119, 129), `EvaluacionPage.tsx` (líneas ~121, 149)

### 2. Opciones de radio como tarjetas seleccionables (EvaluacionPage)

Reemplazar el patrón actual de `RadioGroupItem` + `Label` pequeños por bloques tipo tarjeta: cada opción ocupa el ancho completo, con padding generoso (`p-4`), borde redondeado, y estado seleccionado con borde primario + fondo sutil. Inspirado en la referencia (letra indicadora + texto, bordes redondeados, separación clara).

Se aplica a:
- Opciones del quiz (líneas ~279-286)
- Opciones de encuesta de escala (líneas ~317-324)
- Pregunta Sí/No (líneas ~339-346)

Patrón por opción:
```tsx
<label className={cn(
  "flex items-center gap-3 w-full p-4 rounded-xl border-2 cursor-pointer transition-colors",
  selected ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
)}>
  <span className="shrink-0 w-7 h-7 rounded-md border flex items-center justify-center text-xs font-semibold">
    {letter}
  </span>
  <span className="text-sm font-medium">{opcion}</span>
  <RadioGroupItem value={...} className="sr-only" />
</label>
```

### 3. Preguntas numeradas (EvaluacionPage)

En el header de cada pregunta del quiz, ya dice "Pregunta X de Y". Para encuesta de satisfacción y pregunta Sí/No, agregar numeración visible: `{idx + 1} →` antes del texto de la pregunta, similar a la referencia.

### 4. Consentimiento de Salud editable para estudiantes (InfoAprendizPage)

En `InfoAprendizPage.tsx`:
- Convertir `consentimientoData` de objeto fijo a estado local con `useState`, inicializado desde `matricula`.
- Quitar `readOnly` del componente `ConsentimientoSalud`.
- Cambiar `onChange={() => {}}` por una función que actualice el estado local.
- Incluir los datos de consentimiento en el payload de envío (`handleEnviar`).

**Archivos afectados**: 
| Archivo | Cambios |
|---|---|
| `src/pages/estudiante/EvaluacionPage.tsx` | Opciones como tarjetas seleccionables, preguntas numeradas, badges verdes |
| `src/pages/estudiante/InfoAprendizPage.tsx` | Badge verde, consentimiento editable con estado local |

