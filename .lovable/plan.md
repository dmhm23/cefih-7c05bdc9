

## Plan: Color de calendario personalizable para entrenadores

### Contexto

Actualmente los colores del calendario se asignan automáticamente por índice (`TRAINER_COLORS[i % length]`) en `CursosCalendarioView.tsx` (línea 34-41). No hay relación entre el entrenador y su color preferido.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/types/personal.ts` | Agregar `colorCalendario?: string` a `Personal` y `PersonalFormData` |
| `src/data/mockData.ts` | Agregar `colorCalendario` a los entrenadores mock |
| `src/pages/personal/PersonalFormPage.tsx` | Agregar selector de color con opciones predefinidas + input de color custom, visible cuando el rol seleccionado es tipo `entrenador` |
| `src/components/cursos/CursosCalendarioView.tsx` | En `getTrainerColorMap`, buscar el `colorCalendario` del personal y usarlo como color prioritario; si no tiene, usar el fallback por índice |
| `src/services/personalService.ts` | Pasar `colorCalendario` en create/update (ya es genérico con spread, solo ajustar el tipo) |

### Detalle

**Tipo** — agregar a `Personal` y `PersonalFormData`:
```typescript
colorCalendario?: string; // hex color, ej: "#3b82f6"
```

**Colores predefinidos** — array de 8-10 colores visualmente distintos (los mismos del calendario actual, convertidos a hex) + un input `type="color"` para elegir uno personalizado.

**UI en formulario** — nueva sección condicional que aparece solo cuando el cargo seleccionado es de tipo `entrenador`. Muestra:
- Grid de círculos de color clickeables (predefinidos)
- Input color picker para valor personalizado
- Preview del color seleccionado

**Calendario** — modificar `getTrainerColorMap` para recibir la lista de personal y usar `colorCalendario` del perfil cuando exista, generando las variantes `bg`, `bgLight`, `text`, `border` desde el hex base.

