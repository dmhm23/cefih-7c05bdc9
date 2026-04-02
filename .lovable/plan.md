

## Plan: Protección de navegación en formularios de matrícula

### Contexto

Actualmente no hay protección contra navegación accidental al crear o editar matrículas. El patrón ya existe en `FormatoEditorPage.tsx` (intercepta clics en links, popstate y beforeunload). Se adaptará ese patrón a ambas páginas de matrícula, con la diferencia de ofrecer **dos acciones**: "Guardar" y "Descartar" (en vez de solo "Salir sin guardar").

### Archivos afectados

| Archivo | Cambio |
|---|---|
| `src/components/shared/ConfirmDialog.tsx` | Agregar soporte para un tercer botón opcional (acción secundaria) para permitir "Guardar" + "Descartar" |
| `src/pages/matriculas/MatriculaFormPage.tsx` | Detectar `isDirty` con `form.formState.isDirty \|\| personaIsDirty \|\| !!selectedPersona`, interceptar navegación, mostrar diálogo con opción de guardar o descartar |
| `src/pages/matriculas/MatriculaDetallePage.tsx` | Ya tiene `isDirty` y `isPersonaDirty`. Agregar interceptación de navegación y diálogo al intentar salir con cambios pendientes |

### Detalle

**ConfirmDialog** — agregar props opcionales `secondaryAction` y `secondaryText` para renderizar un tercer botón (ej. "Guardar") junto al existente "Descartar".

**MatriculaFormPage (nueva)**:
- Calcular `hasUnsavedData` como: `form.formState.isDirty || personaIsDirty || !!selectedPersona` (si ya seleccionó persona o llenó campos, hay datos)
- Estado `pendingNavPath` para la ruta pendiente
- 3 useEffects (mismo patrón del editor de formatos):
  1. `beforeunload` cuando `hasUnsavedData`
  2. Interceptor de clics en enlaces internos
  3. Interceptor de `popstate` (botón atrás)
- Actualizar el botón "Volver" (ArrowLeft) para verificar dirty antes de navegar
- Diálogo: "Guardar" ejecuta `form.handleSubmit(onSubmit)()` y luego navega; "Descartar" navega directamente

**MatriculaDetallePage (edición)**:
- `isDirty || isPersonaDirty` ya existe
- Mismos 3 useEffects de interceptación
- Actualizar el botón "Volver" para verificar dirty
- Diálogo: "Guardar" ejecuta `handleSave()`/`handleSavePersona()` y navega; "Descartar" descarta y navega

