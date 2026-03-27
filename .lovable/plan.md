

## Plan: Ajustes al panel deslizable de Cursos (`CursoDetailSheet.tsx`)

### Cambio 1 — Eliminar sección "Estado del Curso"

Eliminar las líneas 162-185 (el `<Separator />`, el `<DetailSection title="Estado del Curso">` completo con el `EditableField` de estado y el texto de "en_progreso").

También eliminar imports no usados: `FileCheck` de lucide-react, `ESTADO_CURSO_LABELS`, `EstadoCurso`, las constantes `ESTADO_OPTIONS` y la función `getEstadoBadgeVariant`. Limpiar la lógica de `handleSave` que maneja `cambiarEstado` por separado.

### Cambio 2 — Fusionar capacidad con "Estudiantes Inscritos"

Eliminar el bloque compacto de capacidad actual (líneas 150-162) y mover esa información como encabezado de la sección "Estudiantes Inscritos" (línea 268). El resultado será:

```
DetailSection title="Estudiantes Inscritos (3/25)"
  ├─ Barra: "3 inscritos · 22 cupos disponibles"
  ├─ Lista de estudiantes (hasta 5)
  └─ "+N estudiantes más"
```

El título de la sección mostrará `Estudiantes Inscritos (n/max)` y dentro, una línea compacta con el icono `Users` mostrará cupos disponibles. Se elimina el bloque superior separado.

### Archivos afectados
| Archivo | Cambio |
|---|---|
| `src/components/cursos/CursoDetailSheet.tsx` | Eliminar sección Estado, fusionar capacidad con Estudiantes |

