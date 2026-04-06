
Diagnóstico

- Confirmé que sí existen matrículas disponibles para asignar:
  - hay 2 matrículas activas sin curso,
  - ambas tienen `empresa_nivel_formacion = b62b5715-b6d5-4fe6-ae18-fd1c0def3bed`,
  - una corresponde a la CC `1110495867`.
- Confirmé que el curso actual `1a1026aa-e557-4719-93ad-64c8caac3c8f` tiene:
  - `nivel_formacion_id = NULL`
  - `tipo_formacion = formacion_inicial`
- El modal hoy no las muestra porque mezcla 2 vocabularios distintos:
  - el curso llega al modal como `trabajador_autorizado`
  - los niveles cargados desde base de datos llegan como `formacion_inicial`
  - por eso `nivelesValidos` queda vacío y aparece “No hay matrículas disponibles...”.

Hallazgo clave

El problema no está solo en el modal; hay una inconsistencia estructural en Cursos/Niveles:

1. `CursoFormPage` usa el selector de nivel, pero guarda ese UUID dentro de `tipoFormacion`.
2. `cursoService.create/update` interpreta `tipoFormacion` como enum de tipo, no como UUID, y por eso no guarda `nivel_formacion_id`.
3. `nivelFormacionService.create` hardcodea `tipo_formacion = 'formacion_inicial'`, así que hoy los niveles quedaron mal clasificados en la base.
4. `cursoService.agregarEstudiantes()` sigue siendo placeholder y no asigna realmente el `curso_id`.

Plan

1. Separar correctamente “nivel” y “tipo” en Cursos
- Hacer que el formulario de curso trabaje con `nivelFormacionId` como valor real del selector.
- Guardar siempre `nivel_formacion_id` al crear/editar curso.
- Derivar `tipo_formacion` a partir del nivel seleccionado, en vez de reutilizar `tipoFormacion` para dos cosas distintas.

2. Corregir el modal “Agregar Estudiantes al Curso”
- Cambiar la lógica para que filtre por un UUID de nivel real.
- Prioridad de resolución:
  - primero `curso.nivelFormacionId`
  - si está vacío, usar un fallback legacy por nombre exacto del nivel para cursos viejos
- Dejar de comparar `trabajador_autorizado` contra `formacion_inicial`, que es lo que hoy rompe el filtro.

3. Evitar que el problema se siga reproduciendo
- Quitar el hardcode de `formacion_inicial` en niveles.
- Permitir guardar el `tipo_formacion` correcto en niveles.
- Reparar los niveles existentes que quedaron mal clasificados.

4. Completar la asignación real del estudiante al curso
- Implementar `cursoService.agregarEstudiantes()` para actualizar `matriculas.curso_id`.
- Mantener sincronización de fechas/documentos según la lógica existente de matrícula.

5. Compatibilidad para cursos ya creados
- Ajustar vistas del módulo de cursos para mostrar el nivel usando `nivelFormacionId` primero y el valor legacy solo como respaldo.
- Si un curso viejo no tiene nivel resolvible, mostrar un mensaje claro para obligar a corregirlo antes de matricular.

Detalles técnicos

- Archivos principales:
  - `src/pages/cursos/CursoFormPage.tsx`
  - `src/services/cursoService.ts`
  - `src/types/curso.ts`
  - `src/components/cursos/AgregarEstudiantesModal.tsx`
  - `src/components/cursos/CourseInfoCard.tsx`
  - `src/components/cursos/CursoDetailSheet.tsx`
  - `src/components/cursos/CourseHeader.tsx`
  - `src/components/cursos/CursosListView.tsx`
  - `src/pages/niveles/NivelFormPage.tsx`
  - `src/services/nivelFormacionService.ts`
  - `src/types/nivelFormacion.ts`
- Base de datos:
  - no hace falta cambiar esquema,
  - sí conviene una migración de datos para corregir `tipo_formacion` en niveles existentes.
- Resultado esperado:
  - las 2 matrículas disponibles volverán a aparecer,
  - incluyendo la de la CC `1110495867`,
  - los cursos nuevos quedarán bien guardados,
  - y la asignación al curso sí persistirá de verdad.
