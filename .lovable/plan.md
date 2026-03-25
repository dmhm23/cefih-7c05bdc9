

## Plan: Sincronizar campo Entrenador con Gestión de Personal en CourseInfoCard

### Problema
En la vista de detalle/edición de un curso (`CourseInfoCard`), el campo "Entrenador" es un campo de texto libre. Debe ser un dropdown que muestre los entrenadores registrados en Gestión de Personal.

**Nota:** El formulario de creación (`CursoFormPage`) ya tiene esta lógica correcta con `Select` + `usePersonalByTipoCargo('entrenador')`. Solo falta aplicarlo en la tarjeta de edición.

### Cambio

**`src/components/cursos/CourseInfoCard.tsx`**:

1. Importar `usePersonalByTipoCargo` desde `@/hooks/usePersonal`.
2. Llamar `usePersonalByTipoCargo('entrenador')` para obtener la lista de entrenadores.
3. Reemplazar el `EditableField` de texto del Entrenador (líneas 83-88) por uno de tipo `select` con las opciones generadas dinámicamente desde la lista de personal.
4. Al seleccionar un entrenador, actualizar tanto `entrenadorId` como `entrenadorNombre` (nombre completo) en `onFieldChange`.

El campo usará `type="select"` del `EditableField` existente, con `options` mapeadas desde los entrenadores (`{ value: id, label: "nombres apellidos" }`), y un `displayValue` que muestre el nombre actual.

### Archivos modificados
- `src/components/cursos/CourseInfoCard.tsx` — un solo archivo

