

## Plan: Eliminar "Progreso de matrícula" y "Estado de la Matrícula" del panel lateral

### Cambio en `src/components/matriculas/MatriculaDetailSheet.tsx`

1. **Eliminar bloque de Progreso** (líneas 301-308): el `<div>` con la barra de progreso y el texto "Progreso de matrícula".
2. **Eliminar el `<Separator>`** que le sigue (línea 310).
3. **Eliminar bloque "Estado de la Matrícula"** (líneas 312-325): la `<DetailSection>` con el `<EditableField>` de estado.
4. **Eliminar el `<Separator>`** que le sigue (línea 327).
5. **Limpiar imports no utilizados**: `Progress`, `useCambiarEstadoMatricula`, `ESTADO_MATRICULA_LABELS`, `EstadoMatricula`, `FileCheck`, y la constante `ESTADO_OPTIONS` (si solo se usa ahí).
6. **Limpiar variables no utilizadas**: `completedSteps`, `progressPercent`, y cualquier lógica de `cambiarEstado` que ya no se use.

El contenido del panel comenzará directamente con la sección **Estudiante**.

