

## Optimización del Panel Lateral de Matrícula y Fix del Overflow en Documentos

### Diagnóstico

**1. Diferencias entre la página completa y el panel lateral:**

El panel lateral (`MatriculaDetailSheet`) tiene contenido que difiere de la página completa (`MatriculaDetallePage`) en varios aspectos:

- **Falta**: El panel no tiene `onDelete` ni `onFechaChange` en `DocumentosCarga` (la página sí los tiene).
- **Falta**: El panel usa un `EditableField` simple para Observaciones; la página usa `ComentariosSection`.
- **Redundante**: El panel tiene una sección "Checklist de Requisitos" separada (Documentos verificados / Evaluación / Encuesta) que ya está implícita en el bloque de Progreso al inicio. La página la muestra integrada en el progreso.
- **Diferencia**: La sección de Curso en el panel es solo un selector, mientras que la página tiene un sidebar completo con nombre, fechas, horas y entrenador.
- **Falta**: El panel no muestra los Formatos para Formación (que sí están en el sidebar de la página completa).
- **Campos extra innecesarios**: El panel tiene iconos en muchos campos que aumentan el espacio visual sin aporte real.

**2. Problema de overflow en Documentos (modo Individual):**

En el componente `DocumentosCarga`, la fila de cada documento tiene:
- Un `div` central (`flex-1 min-w-0`) con truncado de texto.
- Un `div` derecho (`flex items-center gap-1.5 shrink-0`) con el Badge de estado + botón de acción.
- El `renderFechaFields` incluye `whitespace-nowrap` en los labels, un `Input` con `w-32`, y se renderiza **dentro del div central** pero empuja el contenedor.

Además, el label "ARL" en el campo de fecha dice `"Inicio cobertura:"` en texto pleno. El panel lateral es más estrecho que la página completa, lo que provoca que estos elementos rompan el layout.

---

### Cambios a Realizar

#### Archivo 1: `src/components/matriculas/MatriculaDetailSheet.tsx`

**Optimizaciones alineando con la página completa:**

1. **Sección Curso**: Enriquecer para mostrar nombre del curso, fechas, horas y entrenador (igual que el sidebar de la página completa), más un link "Ver curso". Eliminar el selector de curso (cambiar el curso desde la página completa tiene más sentido).

2. **Eliminar sección "Checklist de Requisitos"**: Es redundante con la barra de progreso. En su lugar, mostrar el progreso más detallado con los 4 ítems directamente en el bloque de progreso inicial (como en la página completa).

3. **Agregar Formatos para Formación**: Agregar la sección de FormatosList que ya existe en la página completa pero falta en el panel lateral.

4. **Sección Documentos**: Pasar `onDelete` y `onFechaChange` para tener paridad con la página completa.

5. **Observaciones**: Reemplazar el `EditableField` simple por el `ComentariosSection` (igual que la página completa). Importar el componente.

6. **Eliminar iconos redundantes**: Quitar los iconos de los `EditableField` donde no aportan valor (son muchos y aumentan el ancho mínimo de cada celda en la grilla del panel).

7. **Importar** `FormatosList`, `ComentariosSection`, y los estados para manejar preview de formatos.

#### Archivo 2: `src/components/matriculas/DocumentosCarga.tsx`

**Fix del overflow en modo Individual dentro del panel lateral:**

1. **Campo de fecha "Inicio cobertura" (ARL)**: Cambiar el label `"Inicio cobertura:"` a solo `"Cobertura:"` con un `Tooltip` que al hacer hover muestre `"Inicio cobertura ARL"`. El Input de fecha ya tiene `w-32` pero el label con `whitespace-nowrap` sigue siendo largo.

2. **Campo de fecha "Fecha examen" (Examen Médico)**: Similar ajuste con label más corto `"Examen:"` y tooltip explicativo.

3. **Contenedor de fecha fields**: Cambiar `flex gap-2 mt-1` por `flex flex-wrap gap-1.5 mt-1` para permitir que los campos de fecha hagan wrap si no caben en una sola línea.

4. **Input de fecha**: Cambiar `w-32` por `w-28` para ganar espacio.

5. **Label ARL**: El campo principal del documento se llama "ARL" (sin el texto largo "Aseguradora de Riesgos Laborales"). Este nombre ya viene de `doc.nombre` definido en `documentoService.ts`. Verificar cómo se define el nombre y si necesita ajuste allí también.

6. **Overflow general**: Asegurar que el div raíz del componente tenga `overflow-hidden` o `min-w-0` para contener correctamente el contenido dentro del panel.

---

### Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Optimizar secciones: Curso, Checklist→Progreso, agregar Formatos, DocumentosCarga con onDelete/onFechaChange, ComentariosSection en Observaciones |
| `src/components/matriculas/DocumentosCarga.tsx` | Fix overflow: labels más cortos con tooltip, flex-wrap en fechas, min-w-0 en contenedor |

---

### Sección Técnica

**Por qué ocurre el overflow:**
El panel lateral del Sheet tiene un ancho fijo (típicamente `400-480px`). La fila del documento usa `flex` con `flex-1 min-w-0` en el centro, pero los elementos dentro (labels con `whitespace-nowrap` + `Input w-32`) tienen un ancho mínimo mayor al espacio disponible, forzando al contenedor a sobrepasar su límite. La solución es reducir el texto de los labels, permitir wrap en el contenedor de fechas, y asegurar que el contenedor padre no fije un ancho mínimo mayor al disponible.

**Tooltip para "ARL":**
Se usará `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent` de `@/components/ui/tooltip` (ya disponible en el proyecto) con un pequeño icono `Info` de `lucide-react` junto al label del campo de fecha, mostrando "Aseguradora de Riesgos Laborales" al hacer hover.

