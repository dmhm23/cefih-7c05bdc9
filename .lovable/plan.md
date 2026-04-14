

# Plan: Unificar nivel de formación y corregir creación de documentos

## Diagnóstico confirmado

Se identificaron **dos problemas raíz**:

### Problema 1: Enum desalineado con la configuración de niveles
La tabla `niveles_formacion` tiene `documentos_requeridos` con valores como `arl` y `planilla_seguridad_social`, pero el enum `tipo_documento_matricula` usa `certificado_arl` (no `arl`) y no incluye `planilla_seguridad_social`. Cuando `crearDocumentosMatricula` intenta insertar estos documentos, el INSERT falla silenciosamente y no se crea ningún documento (ni siquiera los válidos como `cedula`).

**Evidencia**: Las 3 matrículas más recientes tienen 0 documentos en `documentos_matricula`, a pesar de tener `nivel_formacion_id` correctamente persistido.

### Problema 2: Duplicidad `empresa_nivel_formacion` / `nivel_formacion_id`
Ambos campos almacenan el mismo UUID. Las vistas leen de `empresaNivelFormacion` mientras la lógica de documentos lee de `nivelFormacionId`. Esto genera confusión y riesgo de desincronización.

---

## Fase 1: Corregir enum y datos de niveles (base de datos)

### 1.1 Ampliar el enum `tipo_documento_matricula`
Agregar los valores faltantes: `arl`, `planilla_seguridad_social`, `curso_previo`, `consolidado`.

### 1.2 Normalizar `documentos_requeridos` en niveles existentes
Si algún nivel usa `arl` como clave pero el catálogo espera `certificado_arl`, decidir cuál es la fuente correcta. Dado que el enum ahora incluirá `arl`, no es necesario renombrar los datos existentes.

### Verificación Fase 1
Consultar `SELECT unnest(enum_range(NULL::tipo_documento_matricula))` y confirmar que incluye todos los valores usados en `niveles_formacion.documentos_requeridos`.

---

## Fase 2: Unificar en `nivel_formacion_id` (código)

### 2.1 `src/services/matriculaService.ts`
- Agregar `nivel_formacion_id` a `uuidFields` en `formToRow`.
- En `rowToMatricula`: asegurar que `nivelFormacionId` se mapee desde `nivel_formacion_id` del row (ya lo hace `snakeToCamel`, solo confirmar).

### 2.2 `src/pages/matriculas/MatriculaFormPage.tsx`
- En el `onSubmit`, dejar de enviar `empresaNivelFormacion` como campo independiente. En su lugar, enviar solo `nivelFormacionId` con el valor seleccionado del nivel. El campo `empresa_nivel_formacion` en BD se seguirá llenando temporalmente para compatibilidad (mismo valor), hasta que se retire.

### 2.3 Vistas que leen `empresaNivelFormacion` — cambiar a `nivelFormacionId`
Archivos a actualizar (lectura del campo para mostrar el label del nivel):
- `src/components/matriculas/MatriculaDetailSheet.tsx` (líneas 266-268 y 417-419)
- `src/pages/matriculas/MatriculasPage.tsx` (líneas 358-361)
- `src/pages/personas/PersonaDetallePage.tsx` (línea 290)
- `src/components/personas/PersonaDetailSheet.tsx` (línea 321)
- `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx` (línea 532)
- `src/components/matriculas/formatos/InfoAprendizDocument.tsx`
- `src/utils/resolveAutoField.ts` (líneas 100-102)
- `src/components/cursos/AgregarEstudiantesModal.tsx` (líneas 79-80)

En cada caso, cambiar `m.empresaNivelFormacion` → `m.nivelFormacionId`.

### 2.4 Función de BD `get_formatos_for_matricula`
Actualizar para leer `nivel_formacion_id` como fuente primaria en vez de resolver desde `empresa_nivel_formacion`. Mantener fallback temporal.

### Verificación Fase 2
- Crear una matrícula nueva desde el formulario y verificar que `nivel_formacion_id` se persiste correctamente.
- Confirmar que las vistas (lista, detalle, panel lateral) muestran el nivel de formación.

---

## Fase 3: Corregir creación de documentos

### 3.1 `src/services/documentoService.ts`
En `getDocumentosRequeridos`, el catálogo `CATALOGO_LABELS` no incluye `arl` ni `planilla_seguridad_social`. Agregar las entradas faltantes para que el mapeo tipo→nombre funcione correctamente.

### 3.2 Sincronización al abrir detalle
Ya implementada en `MatriculaDetallePage.tsx` y `MatriculaDetailSheet.tsx`. Solo confirmar que usa `matricula.nivelFormacionId` (ya lo hace).

### Verificación Fase 3
- Abrir el detalle de la matrícula de Camilo Galeano → la sincronización debe crear los documentos faltantes (examen_medico, certificado_eps, arl, planilla_seguridad_social).
- Crear una matrícula nueva con nivel "Trabajador autorizado" → debe tener 5 documentos desde el inicio.

---

## Fase 4: Limpieza (opcional, sin riesgo)

### 4.1 Backfill de matrículas sin documentos
Ejecutar la sincronización para las matrículas existentes que tienen `nivel_formacion_id` pero 0 documentos. Esto ocurre automáticamente al abrir cada detalle, pero puede hacerse proactivamente.

### Verificación Fase 4
Consultar `SELECT m.id FROM matriculas m WHERE m.nivel_formacion_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM documentos_matricula dm WHERE dm.matricula_id = m.id)` → debe retornar 0 filas.

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Ampliar enum `tipo_documento_matricula` + actualizar `get_formatos_for_matricula` |
| `src/services/matriculaService.ts` | Agregar `nivel_formacion_id` a `uuidFields` |
| `src/services/documentoService.ts` | Ampliar `CATALOGO_LABELS` con claves faltantes |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Usar `nivelFormacionId` en submit |
| `src/pages/matriculas/MatriculasPage.tsx` | Leer `nivelFormacionId` |
| `src/components/matriculas/MatriculaDetailSheet.tsx` | Leer `nivelFormacionId` |
| `src/pages/personas/PersonaDetallePage.tsx` | Leer `nivelFormacionId` |
| `src/components/personas/PersonaDetailSheet.tsx` | Leer `nivelFormacionId` |
| `src/components/cursos/AgregarEstudiantesModal.tsx` | Leer `nivelFormacionId` |
| `src/components/matriculas/formatos/EvaluacionReentrenamientoDocument.tsx` | Leer `nivelFormacionId` |
| `src/components/matriculas/formatos/InfoAprendizDocument.tsx` | Leer `nivelFormacionId` |
| `src/utils/resolveAutoField.ts` | Leer `nivelFormacionId` |

## Impacto
- Sin cambios en `DocumentosCarga.tsx`, `driveService.ts`, storage ni estructura de `documentos_matricula`.
- La columna `empresa_nivel_formacion` sigue existiendo en BD pero deja de ser la fuente de lectura en el frontend.
- Todas las matrículas existentes ya tienen `nivel_formacion_id` poblado (verificado en BD).

