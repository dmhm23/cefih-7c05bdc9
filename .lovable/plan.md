

## Plan: Cambiar filtro de entrenadores a checkboxes en calendario de cursos

### Cambio — `src/components/cursos/CursosCalendarioView.tsx` (líneas 186-217)

Reemplazar el contenido del `PopoverContent` del filtro de entrenadores:

- **"Todos"**: cambiar de `<button>` con círculo de color a un `<Checkbox>` con `checked` cuando `selectedTrainers.length === 0`, y al hacer clic ejecutar `setSelectedTrainers([])`
- **Cada entrenador**: cambiar de `<button>` con círculo de color a `<Checkbox>` + `<label>` con el nombre del entrenador. Mantener el punto de color como indicador visual junto al nombre, pero el control principal es el checkbox
- Importar `Checkbox` desde `@/components/ui/checkbox`
- Lógica de `toggleTrainer` se mantiene igual, solo cambia la UI

### Archivo modificado
- `src/components/cursos/CursosCalendarioView.tsx`

