

## Análisis: Reglas de negocio de diligenciamiento en la gestión de formatos

### Estado actual de la configuración

En `FormatoConfigSheet` (panel "Ajustes del formato") existen estos controles:

| Campo | Tipo | Función actual |
|---|---|---|
| Categoría | Select | formación, evaluación, asistencia, pta_ats, personalizado |
| Alcance de asignación | Select | Por tipo de curso / Por nivel de formación |
| Tipos de curso | Chips | Selección múltiple de tipos aplicables |
| Visible en Matrícula | Switch | Determina si aparece en la ficha de matrícula |
| Visible en Curso | Switch | Determina si aparece en la vista del curso |
| Activo | Switch | Habilita/deshabilita el formato |

### Lo que falta

Según tus reglas de negocio, hay **tres conceptos de visibilidad/diligenciamiento** que no están completos:

1. **Visible en Portal Estudiante** — No existe. No hay un campo `visibleEnPortalEstudiante` que indique que este formato debe ser diligenciado por el estudiante desde su portal. Actualmente el portal usa lógica hardcodeada por `legacyComponentId`.

2. **Modo de diligenciamiento** — No existe. No hay forma de configurar **quién** o **cómo** se diligencia:
   - Manual por el estudiante (evaluación, info aprendiz, consentimiento)
   - Automático por el sistema (asistencia diaria se llena según días del curso)
   - Administrativo (lo llena el entrenador/admin)

3. **Descripciones contextuales** — Los switches actuales no explican su propósito. "Visible en Matrícula" no aclara que se refiere a ver el estado del formato (borrador/completo), y "Visible en Curso" no tiene uso funcional real.

### Plan: Agregar configuración completa de reglas de diligenciamiento

**1. Agregar campos al modelo y store**

En `FormatoConfig` (`useFormatoEditorStore.ts`) y `FormatoFormacion` (`types/formatoFormacion.ts`):

```text
+ visibleEnPortalEstudiante: boolean    // ¿Aparece en el portal para que el estudiante lo diligencie?
+ modoDiligenciamiento: 'manual_estudiante' | 'manual_admin' | 'automatico_sistema'
```

- `manual_estudiante`: el estudiante lo diligencia desde el portal
- `manual_admin`: lo diligencia el entrenador/admin desde la matrícula o curso
- `automatico_sistema`: el sistema lo llena automáticamente (ej: asistencia por días)

**2. Actualizar `FormatoConfigSheet`**

Reorganizar la sección de Visibilidad con descripciones claras:

```text
VISIBILIDAD Y DILIGENCIAMIENTO
─────────────────────────────────
☐ Visible en Matrícula
  "El formato aparece en la ficha de matrícula mostrando su estado (borrador/completo)"

☐ Visible en Curso
  "El formato aparece en la vista del curso para consulta administrativa"

☐ Visible en Portal Estudiante
  "El estudiante puede ver y diligenciar este formato desde su portal"

Modo de diligenciamiento: [Select]
  • Manual — Estudiante: "Lo diligencia el estudiante desde el portal"
  • Manual — Administrativo: "Lo diligencia el entrenador o administrador"
  • Automático — Sistema: "Se genera automáticamente según datos del curso (ej: asistencia por días)"
```

**3. Actualizar schema de validación**

En `formatoSchema.ts`, agregar:
- `visibleEnPortalEstudiante: z.boolean()`
- `modoDiligenciamiento: z.enum(['manual_estudiante', 'manual_admin', 'automatico_sistema'])`

**4. Actualizar `FormatoEditorPage` (persistencia)**

Incluir los nuevos campos al construir el objeto `FormatoFormacion` para guardar/actualizar.

**5. Actualizar mocks existentes**

En `formatoFormacionService.ts`, asignar valores coherentes a los formatos existentes:
- Info Aprendiz → `manual_estudiante`, `visibleEnPortalEstudiante: true`
- Registro Asistencia → `automatico_sistema`, `visibleEnPortalEstudiante: false`
- Evaluación → `manual_estudiante`, `visibleEnPortalEstudiante: true`
- Participación PTA/ATS → `manual_estudiante`, `visibleEnPortalEstudiante: true`

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/types/formatoFormacion.ts` | Agregar `visibleEnPortalEstudiante`, tipo `ModoDiligenciamiento` |
| `src/stores/useFormatoEditorStore.ts` | Agregar campos a `FormatoConfig` y defaults |
| `src/schemas/formatoSchema.ts` | Agregar validaciones |
| `src/components/formatos/editor/FormatoConfigSheet.tsx` | Nuevo select + switch + descripciones |
| `src/pages/formatos/FormatoEditorPage.tsx` | Persistir nuevos campos |
| `src/services/formatoFormacionService.ts` | Actualizar mocks con valores correctos |

