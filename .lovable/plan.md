

## Plan: Desactivar temporalmente la sincronización de `codigo_estudiante`

### Confirmación del entendimiento

Sí, es claro. La sincronización que pediste hace ~2 días — la que recalcula `matriculas.codigo_estudiante` cada vez que cambia el curso, su nombre, fecha o el nivel — es la que está disparando el bug `duplicate key value violates unique constraint "uniq_matriculas_codigo_por_curso"` al agregar a Jeisson (y a cualquier estudiante cuya `created_at` sea anterior a alguna matrícula ya inscrita).

En lugar de seguir parchando `recalcular_codigos_curso`, vamos a **dejar la sincronización dormida** y volver al modelo previo: el código se calcula en memoria al renderizar, a partir del orden cronológico de las matrículas del curso. Los datos persistidos en `codigo_estudiante` se quedan donde están (no se borran), pero ya nadie los va a tocar.

### Cambios

**1. Migración SQL — neutralizar triggers y función de recálculo**

Una sola migración que:

- `DROP TRIGGER IF EXISTS trg_matriculas_resync_codigo_aiu ON public.matriculas;`
- `DROP TRIGGER IF EXISTS trg_matriculas_resync_codigo_au ON public.matriculas;`
- `DROP TRIGGER IF EXISTS trg_cursos_resync_codigos_au ON public.cursos;`
- `DROP TRIGGER IF EXISTS trg_niveles_resync_codigos_au ON public.niveles_formacion;`
- Reemplaza el cuerpo de `public.recalcular_codigos_curso(uuid)` por un **no-op** (`BEGIN RETURN; END;`) con un comentario `-- TEMPORALMENTE DESACTIVADO`. Así, si alguien lo invoca desde otra ruta, no falla ni renumera.
- Mantiene la columna `matriculas.codigo_estudiante`, su índice único parcial y las funciones puras `calcular_codigo_estudiante` / `extraer_consecutivo_nombre_curso` intactas (sólo dormimos los triggers; nada se elimina del esquema).

Esto elimina por completo el path que produce la colisión `uniq_matriculas_codigo_por_curso` al insertar/actualizar matrículas.

**2. Frontend — `useCodigosCurso` recalcula en memoria**

Reescribir `src/hooks/useCodigosCurso.ts` para que **calcule** los códigos en runtime usando la utilidad ya existente `calcularCodigosCurso` (de `src/utils/codigoEstudiante.ts`), tal como funcionaba antes de la sincronización:

- Toma las matrículas del curso (`useMatriculasByCurso`).
- Toma el nivel del curso (`useNivelesFormacion`) para leer `configuracionCodigoEstudiante`.
- Devuelve `{ matriculaId → código }` calculado por `calcularCodigosCurso(matriculas, config, curso)`.
- Fallback: si una matrícula ya tiene `codigoEstudiante` persistido y no hay config activa, lo devuelve tal cual.

No cambia la firma del hook, así que `CursoDetallePage`, `MatriculaDetallePage`, `EnrollmentsTable`, `CertificacionSection` y `exportCursoListado` siguen funcionando sin tocarse.

**3. Mejora colateral mínima en el modal (opcional pero recomendada)**

En `AgregarEstudiantesModal.tsx`, cambiar `} catch {` por `} catch (err: any) {` y mostrar `err?.message` en el toast. Sin esto, cualquier futuro error volverá a ser un “Error al guardar” opaco. Es 3 líneas y nos ahorra otro round de debugging a ciegas.

### Lo que **no** se hace

- No se borra la columna `codigo_estudiante` ni los datos ya persistidos (siguen ahí por si en el refactor futuro los queremos reutilizar).
- No se tocan las funciones puras (`calcular_codigo_estudiante`, `extraer_consecutivo_nombre_curso`).
- No se modifica el archivo de prueba creado para `login_portal_estudiante`.
- No se cambia el cálculo del **nombre** del curso (`autogenerar_nombre_curso` y `curso_consecutivos` siguen activos — eso es independiente).

### Riesgos y mitigación

- **Riesgo**: códigos persistidos en `matriculas.codigo_estudiante` quedan “congelados” con el último valor que les asignó el trigger antes del fix. **Mitigación**: el frontend ya no los lee directamente; los recalcula. Y el índice único parcial se mantiene, así que cualquier inserción manual incompatible seguiría siendo rechazada (improbable porque ya nadie los escribe).
- **Riesgo**: divergencia entre código calculado (frontend) y código persistido (BD). **Mitigación**: aceptable y temporal — el plan completo de refactor abordará esto. Mientras tanto, el frontend manda.
- **Riesgo**: que el certificado generado use un código distinto al que se mostraba antes. **Mitigación**: `certificadoGenerator` ya recibe `codigoEstudiante` desde `codigosCurso[matricula.id]`, que ahora será el calculado en memoria — mismo algoritmo que el SQL, mismo resultado.
- **Riesgo cero** sobre login del portal, formatos, cartera y matrícula — esos flujos no dependen de `codigo_estudiante`.

### Verificación post-fix

- Agregar a Jeisson (CC 1110488794) al curso `A-26-04-07` → debe completarse sin error.
- Listado del curso debe mostrar 6 estudiantes con códigos `…-0001` a `…-0006`, ordenados por `created_at`.
- Repetir en otro curso para confirmar que “agregar al final” también sigue funcionando.
- Confirmar que el certificado descargado usa el código mostrado en pantalla.

