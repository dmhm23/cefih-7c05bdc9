

## Plan: Convertir campo Supervisor a selector sincronizado con Gestión de Personal

### Contexto
El campo Entrenador ya usa este patrón exacto: `usePersonalByTipoCargo('entrenador')` + `EditableField type="select"`. Solo hay que replicarlo para Supervisor.

### Cambio — `src/components/cursos/CourseInfoCard.tsx`

1. Agregar query: `const { data: supervisores = [] } = usePersonalByTipoCargo('supervisor');`
2. Crear `supervisorOptions` con `useMemo` (mismo patrón que `entrenadorOptions`)
3. Crear `handleSupervisorChange` que setee tanto `supervisorId` como `supervisorNombre` (mismo patrón que `handleEntrenadorChange`)
4. Cambiar el `EditableField` de Supervisor de texto libre a `type="select"` con `value={getValue("supervisorId")}`, `displayValue={getValue("supervisorNombre")}`, y `options={supervisorOptions}`

### Archivo modificado
- `src/components/cursos/CourseInfoCard.tsx` — único archivo, replicando el patrón existente de Entrenador

