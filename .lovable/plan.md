

## Plan: Corregir carga automática de formatos en matrículas sin curso asignado

### Problema

La consulta de formatos usa `curso?.tipoFormacion` como clave para obtener los formatos aplicables. Cuando una matrícula se crea sin curso asignado (ahora es opcional), `curso` es `null` y `useFormatosMatricula(undefined)` no ejecuta la query — por lo que no aparece ningún formato.

### Solución

Usar el nivel de formación disponible, priorizando el del curso si existe, pero cayendo al `empresaNivelFormacion` de la propia matrícula como fallback.

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Cambiar `useFormatosMatricula(curso?.tipoFormacion)` → `useFormatosMatricula(curso?.tipoFormacion \|\| matricula?.empresaNivelFormacion)` |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Mismo cambio: `useFormatosMatricula(curso?.tipoFormacion \|\| matricula?.empresaNivelFormacion)` |

### Detalle técnico

Línea ~86 en `MatriculaDetallePage.tsx`:
```typescript
// Antes
const { data: formatosDinamicos } = useFormatosMatricula(curso?.tipoFormacion);

// Después
const { data: formatosDinamicos } = useFormatosMatricula(curso?.tipoFormacion || matricula?.empresaNivelFormacion);
```

Mismo patrón en `MatriculaDetailSheet.tsx` (línea ~116).

Esto garantiza que los formatos se resuelvan tanto cuando hay curso asignado como cuando solo se definió el nivel de formación en la matrícula.

