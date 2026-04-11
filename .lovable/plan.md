

# Plan: Reestructuración del módulo de formatos — Eliminar legacy, unificar persistencia

## Diagnóstico

### Estado actual del sistema

**4 formatos legacy** existen en `formatos_formacion` con `legacy_component_id` (info_aprendiz, registro_asistencia, participacion_pta_ats, evaluacion_reentrenamiento). Aunque tienen `motor_render = 'bloques'`, sus bloques JSON están vacíos o incompletos. En la práctica, se renderizan con **componentes React hardcodeados** (488 líneas `InfoAprendizDocument.tsx`, etc.).

**El flujo en matrícula** (líneas 523-548 de `MatriculaDetailSheet.tsx`):
- Al hacer clic en un formato, si `LEGACY_IDS.has(id)` → abre el componente hardcodeado (InfoAprendizPreviewDialog, etc.)
- Si no es legacy → abre `DynamicFormatoPreviewDialog` que renderiza bloques
- **Ninguno de los dos flujos persiste respuestas en `formato_respuestas`**

**El estado de los formatos** (`resolveFormatoEstado.ts`) se calcula leyendo campos directos de la matrícula (`matricula.autorizacionDatos`, `matricula.firmaCapturada`, `matricula.evaluacionCompletada`). No consulta `formato_respuestas`.

**El portal de estudiantes** tiene 2 documentos configurados en `portal_config_documentos` (info_aprendiz, evaluacion), ambos con `formato_id = NULL`. Persiste en `documentos_portal` pero no en `formato_respuestas`.

**Los triggers de sincronización** creados recientemente NO se activan porque `formato_id` es NULL en `portal_config_documentos`.

**`InfoAprendizDocument.tsx`** (legacy) guarda datos directamente en columnas de `matriculas` (autoevaluacionRespuestas, restriccionMedica, etc.) vía `onAutoSave` que llama `updateMatricula`. Esto mezcla datos de formulario con datos de matrícula.

### Problemas raíz

1. Los formatos legacy no tienen bloques configurados → el constructor visual no los puede renderizar
2. `formato_respuestas` está vacío → la elegibilidad de certificados falla
3. La persistencia está fragmentada: columnas de matrícula, documentos_portal, formato_respuestas (vacío)
4. Los triggers de sincronización no se activan por falta de vínculo `formato_id`
5. `resolveFormatoEstado` lee de matrícula en vez de `formato_respuestas`

---

## Plan de implementación

### Fase 1: Poblar los formatos legacy con bloques reales

Actualizar los 4 registros en `formatos_formacion` para que tengan su estructura completa de bloques JSON, replicando lo que hoy renderizan los componentes hardcodeados.

**Formato "Información del Aprendiz"** — bloques:
- section_title "Datos Personales"
- auto_fields: nombre, documento, tipo_documento, genero, fecha_nacimiento, pais_nacimiento, nivel_educativo, rh, telefono, email, contacto_emergencia_nombre, contacto_emergencia_telefono
- section_title "Vinculación Laboral"
- auto_fields: empresa_nombre, empresa_nit, empresa_cargo, tipo_vinculacion, area_trabajo, sector_economico, eps, arl
- health_consent (preguntas de salud)
- data_authorization (autorización de datos)
- signature_aprendiz

**Formato "Registro de Asistencia"** — bloques:
- auto_fields: nombre_curso, tipo_formacion_curso, fecha_inicio_curso, fecha_fin_curso
- attendance_by_day
- signature_aprendiz, signature_entrenador_auto

**Formato "Participación PTA-ATS"** — bloques:
- auto_fields relevantes del curso y persona
- paragraph con texto legal
- signature_aprendiz, signature_entrenador_auto, signature_supervisor_auto

**Formato "Evaluación de Reentrenamiento"** — bloques:
- evaluation_quiz con preguntas y umbral de aprobación
- satisfaction_survey
- signature_aprendiz

**Acción**: Migración SQL que actualiza `bloques` y elimina `legacy_component_id` de los 4 registros.

| Archivo | Acción |
|---------|--------|
| Nueva migración SQL | UPDATE formatos_formacion SET bloques = [...], legacy_component_id = NULL |

### Fase 2: Persistencia unificada en formato_respuestas

Crear un servicio centralizado para guardar/leer respuestas de formatos.

**Nuevo archivo** `src/services/formatoRespuestaService.ts`:
- `getByMatricula(matriculaId)` — obtener todas las respuestas
- `getByMatriculaAndFormato(matriculaId, formatoId)` — obtener una respuesta
- `upsertRespuesta(matriculaId, formatoId, answers, estado)` — guardar/actualizar
- `calcularEstado(formato, answers)` — resolver si está completo, incluyendo cálculo de evaluación

**Nuevo hook** `src/hooks/useFormatoRespuestas.ts`:
- `useFormatoRespuestas(matriculaId)` — query de respuestas
- `useSaveRespuesta()` — mutation de guardado

| Archivo | Acción |
|---------|--------|
| `src/services/formatoRespuestaService.ts` | Nuevo — CRUD de formato_respuestas |
| `src/hooks/useFormatoRespuestas.ts` | Nuevo — hooks React Query |

### Fase 3: Renderizado dinámico unificado con soporte de edición

Ampliar `DynamicFormatoDocument.tsx` para que:
1. Reciba `answers` (respuestas guardadas) y `onAnswerChange` (callback para edición)
2. Renderice los bloques complejos que hoy solo muestran placeholder: `health_consent`, `data_authorization`, `evaluation_quiz`, `satisfaction_survey`
3. Soporte modo lectura (preview) y modo edición (diligenciamiento)
4. Calcule automáticamente puntaje de evaluación cuando haya un bloque `evaluation_quiz`

**Componentes de bloque a implementar**:
- `BloqueHealthConsent` — preguntas Sí/No con detalle condicional
- `BloqueDataAuthorization` — radio acepto/no acepto + texto legal
- `BloqueEvaluationQuiz` — preguntas con opciones, cálculo de puntaje, umbral
- `BloqueSatisfactionSurvey` — escala + pregunta Sí/No

| Archivo | Acción |
|---------|--------|
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | Ampliar para recibir answers/onChange y renderizar bloques complejos |
| `src/components/matriculas/formatos/bloques/` | Nuevos: BloqueHealthConsent, BloqueDataAuthorization, BloqueEvaluationQuiz, BloqueSatisfactionSurvey |

### Fase 4: Reemplazar legacy en MatriculaDetailSheet

Eliminar la bifurcación `LEGACY_IDS.has(id)` en `MatriculaDetailSheet.tsx`. Todos los formatos se abren con `DynamicFormatoPreviewDialog`, que ahora carga answers de `formato_respuestas` y permite editar/guardar.

Eliminar las importaciones y uso de:
- `InfoAprendizPreviewDialog`
- `RegistroAsistenciaPreviewDialog`
- `ParticipacionPtaAtsPreviewDialog`
- `EvaluacionReentrenamientoPreviewDialog`

Reemplazar `resolveFormatoEstado` para que consulte `formato_respuestas` en vez de columnas de matrícula.

| Archivo | Acción |
|---------|--------|
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Eliminar bifurcación legacy, usar solo DynamicFormatoPreviewDialog |
| `src/components/matriculas/formatos/DynamicFormatoPreviewDialog.tsx` | Ampliar para cargar/guardar answers desde formato_respuestas |
| `src/utils/resolveFormatoEstado.ts` | Reescribir para consultar formato_respuestas |

### Fase 5: Vincular portal con formatos y simplificar sincronización

1. Actualizar `portal_config_documentos` con los `formato_id` correspondientes:
   - `info_aprendiz` → `a0000000-0000-4000-8000-000000000001`
   - `evaluacion` → `a0000000-0000-4000-8000-000000000004`

2. Con el vínculo establecido, los triggers bidireccionales ya funcionarán automáticamente.

3. Actualizar `InfoAprendizPage.tsx` y `EvaluacionPage.tsx` del portal para que persistan en `formato_respuestas` directamente (además de `documentos_portal` que se sincroniza vía trigger).

| Archivo | Acción |
|---------|--------|
| Migración SQL | UPDATE portal_config_documentos SET formato_id = ... |
| `src/pages/estudiante/InfoAprendizPage.tsx` | Persistir en formato_respuestas |
| `src/pages/estudiante/EvaluacionPage.tsx` | Persistir en formato_respuestas |

### Fase 6: Soporte en constructor visual

Agregar al catálogo de bloques y al inspector:
- **Secciones colapsables**: propiedad `collapsible: boolean` y `defaultOpen: boolean` en bloques `section_title`
- **Configuración de evaluación**: en bloques `evaluation_quiz`, exponer `umbralAprobacion` en el inspector

| Archivo | Acción |
|---------|--------|
| `src/types/formatoFormacion.ts` | Agregar props `collapsible`, `defaultOpen` a BloqueSectionTitle |
| `src/components/formatos/editor/InspectorFields.tsx` | Campos para collapsible/defaultOpen/umbralAprobacion |
| `src/data/bloqueConstants.ts` | Actualizar labels si necesario |

### Fase 7: Limpieza

Eliminar archivos legacy que ya no se usan:
- `src/components/matriculas/formatos/InfoAprendizDocument.tsx` (488 líneas)
- `src/components/matriculas/formatos/InfoAprendizPreviewDialog.tsx` (207 líneas)
- `src/components/matriculas/formatos/RegistroAsistenciaDocument.tsx`
- `src/components/matriculas/formatos/RegistroAsistenciaPreviewDialog.tsx`
- `src/components/matriculas/formatos/ParticipacionPtaAtsDocument.tsx`
- `src/components/matriculas/formatos/ParticipacionPtaAtsPreviewDialog.tsx`
- `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx`
- `src/components/matriculas/formatos/EvaluacionReentrenamientoPreviewDialog.tsx`

Limpiar columnas legacy de matrícula (no eliminar columnas por compatibilidad, pero dejar de usarlas en nuevo código): `autoevaluacionRespuestas`, `evaluacionCompetenciasRespuestas`, `evaluacionCompletada`, `encuestaRespuestas`, `encuestaCompletada`, `autorizacionDatos`, etc.

---

## Resumen de archivos

| Archivo | Acción |
|---------|--------|
| 2 migraciones SQL | Poblar bloques, vincular portal_config_documentos |
| `src/services/formatoRespuestaService.ts` | **Nuevo** — CRUD formato_respuestas |
| `src/hooks/useFormatoRespuestas.ts` | **Nuevo** — hooks React Query |
| `src/components/matriculas/formatos/bloques/` | **Nuevos** — 4 componentes de bloque complejo |
| `src/components/matriculas/formatos/DynamicFormatoDocument.tsx` | Ampliar con answers, edición, bloques complejos |
| `src/components/matriculas/formatos/DynamicFormatoPreviewDialog.tsx` | Ampliar con carga/guardado |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Eliminar bifurcación legacy |
| `src/utils/resolveFormatoEstado.ts` | Reescribir para usar formato_respuestas |
| `src/pages/estudiante/InfoAprendizPage.tsx` | Persistir en formato_respuestas |
| `src/pages/estudiante/EvaluacionPage.tsx` | Persistir en formato_respuestas |
| `src/types/formatoFormacion.ts` | Agregar props collapsible/defaultOpen |
| `src/components/formatos/editor/InspectorFields.tsx` | Campos collapsible/defaultOpen |
| 8 archivos legacy | **Eliminar** |

## Orden de ejecución sugerido

Dado el volumen, sugiero dividir en 3-4 entregas:
1. **Fases 1-2**: Bloques + servicio de persistencia (backend first)
2. **Fases 3-4**: Renderizado unificado + reemplazo en matrícula
3. **Fases 5-6**: Portal + constructor visual
4. **Fase 7**: Limpieza

## Qué quedaría pendiente

**Backend**:
- Migración para deprecar columnas legacy de matrícula (no urgente, mantener compatibilidad)
- Posible RPC para calcular elegibilidad de certificados server-side en vez de client-side

**UI**:
- Ajustes visuales en el renderizado de bloques complejos (health_consent, quiz, etc.) para que se vean idénticos al legacy
- Modo "impresión" del formato dinámico con los bloques complejos (CSS para PDF)
- Vista del portal de estudiantes para formatos nuevos (más allá de info_aprendiz y evaluación)

