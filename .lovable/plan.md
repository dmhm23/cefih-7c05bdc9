

## Plan: Tabs "Tareas" e "Historial" en TodoWidget

### Cambios

**`src/data/mockDashboard.ts`** — Agregar funciones `loadHistory` y `saveHistory` para persistir tareas completadas en `localStorage` con key `dashboard_todo_history`.

**`src/components/dashboard/TodoWidget.tsx`** — Modificar para incluir dos pestañas:

1. **Agregar `Tabs` de Radix** debajo del `CardHeader` con dos opciones: "Tareas" (activa por defecto) e "Historial".

2. **Tab "Tareas"**: Contiene el input de nueva tarea y la lista actual. Cuando una tarea se marca como completada (toggle → completed=true), se mueve automáticamente al historial y se elimina de la lista activa.

3. **Tab "Historial"**: Muestra las tareas finalizadas en una `ScrollArea` con scroll vertical. Cada entrada muestra el texto (tachado), la fecha de creación y un botón para eliminar del historial. Sin input de nueva tarea.

### Estructura visual

```text
┌─ Tareas Rápidas ─────────────────────┐
│  [Tareas]  [Historial]               │
│                                       │
│  [Nueva tarea...            ] [+]     │
│                                       │
│  □ Tarea pendiente 1    12/03/2026 🗑 │
│  □ Tarea pendiente 2    11/03/2026 🗑 │
│                                       │
└───────────────────────────────────────┘
```

### Flujo
- Al completar una tarea (clic en checkbox) → se remueve de `todos` y se agrega a `history` con la fecha actual como `completedAt`.
- El historial persiste en localStorage independiente.
- El tipo `TodoItem` se extiende con campo opcional `completedAt?: string`.

