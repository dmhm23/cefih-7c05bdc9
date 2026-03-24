

## Plan: Agregar Historial de Matrículas al panel lateral de Personas

### Resumen
Replicar la sección "Matrículas" que ya existe en `/personas/:id` (PersonaDetallePage, líneas 270-308) dentro del panel lateral `PersonaDetailSheet.tsx`.

### Cambios en `src/components/personas/PersonaDetailSheet.tsx`

1. **Imports nuevos**:
   - `useMatriculasByPersona` de `@/hooks/useMatriculas`
   - `StatusBadge` de `@/components/shared/StatusBadge`
   - `NIVEL_FORMACION_EMPRESA_LABELS` de `@/types/matricula`
   - `format` de `date-fns`

2. **Hook**: Llamar `useMatriculasByPersona(persona.id)` dentro del componente para obtener las matrículas.

3. **Sección nueva** después de "Contacto de Emergencia": agregar un `Separator` y una `DetailSection` con título "Matrículas" que muestre:
   - Lista de matrículas con nivel de formación, `StatusBadge` del estado y fecha.
   - Cada ítem clickeable, navegando a `/matriculas/{id}`.
   - Mensaje "Sin matrículas registradas" si la lista está vacía.
   - Botón "Nueva Matrícula" al final, navegando a `/matriculas/nueva?personaId={id}`.

La estructura visual será idéntica a la que ya existe en PersonaDetallePage (líneas 280-307).

