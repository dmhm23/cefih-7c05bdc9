
# Plan: Corregir filtrado de estudiantes al asignar a curso

## Problema raíz

La comparación en `AgregarEstudiantesModal` falla porque compara tipos incompatibles:

- **Curso** pasa `tipoFormacion` = `"trabajador_autorizado"` (string enum del frontend)
- **Matrícula** almacena `empresaNivelFormacion` = `"b62b5715-b6d5-4fe6-ae18-fd1c0def3bed"` (UUID del nivel de formación)

La condición `m.empresaNivelFormacion === nivelFormacion` nunca es verdadera porque un UUID nunca iguala a un string como `"trabajador_autorizado"`.

## Solución

Exponer `nivel_formacion_id` (UUID) desde el curso y usarlo para filtrar en el modal.

### Paso 1: Agregar `nivelFormacionId` al tipo `Curso` y al mapping

En `src/types/curso.ts`, agregar campo opcional `nivelFormacionId?: string`.
En `src/services/cursoService.ts`, mapear `row.nivel_formacion_id` al nuevo campo en `mapCursoRow`.

### Paso 2: Pasar el UUID al modal

En `src/components/cursos/EnrollmentsTable.tsx`, cambiar:
```
nivelFormacion={curso.tipoFormacion}
```
a:
```
nivelFormacion={curso.nivelFormacionId || curso.tipoFormacion}
```

Esto asegura que el modal reciba el UUID del nivel de formación, que es el mismo formato que usa `empresaNivelFormacion` en las matrículas.

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/types/curso.ts` | Agregar `nivelFormacionId?: string` |
| `src/services/cursoService.ts` | Mapear `nivel_formacion_id` en `mapCursoRow` |
| `src/components/cursos/EnrollmentsTable.tsx` | Pasar `curso.nivelFormacionId` al modal |

**Total: 3 archivos editados, 0 migraciones**
