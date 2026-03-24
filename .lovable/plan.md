
## Plan: fijar altura de Tareas Rápidas y activar scroll interno desde el 4.º ítem

### Hallazgo
El `ScrollArea` ya existe en `TodoWidget`, pero hoy no limita nada porque la tarjeta no tiene una altura realmente acotada. Por eso, al crecer la lista, la card empuja la fila completa del grid y desproporciona la tarjeta “Distribución por Nivel”.

### Cambios propuestos

#### 1. Igualar la altura visual entre ambas tarjetas
Actualizar:
- `src/components/dashboard/TodoWidget.tsx`
- `src/components/dashboard/DashboardCharts.tsx`

Aplicar la misma altura fija responsiva a:
- la card de `TodoWidget`
- la card de `Distribución por Nivel`

Así ambas quedan emparejadas en escritorio y ninguna define la altura de la otra por contenido.

#### 2. Mantener estructura flex para que solo el listado haga scroll
En `TodoWidget`:
- conservar `Card` y `CardContent` como `flex flex-col min-h-0`
- dejar fijos:
  - título
  - tabs
  - separador
  - input + botón
- reservar el espacio restante al listado con `flex-1 min-h-0`

Con eso, el scroll sucede dentro del área de tareas, no en toda la tarjeta.

#### 3. Hacer que desde la 4.ª tarea el contenido desborde internamente
Ajustar la altura útil del cuerpo para que entren 3 tareas visibles de forma natural; a partir de la 4.ª:
- el `ScrollArea` mantiene la altura del contenedor
- aparece scroll vertical interno

No cambia la lógica de datos ni el historial; solo el comportamiento visual del contenedor.

#### 4. Asegurar que la gráfica izquierda también llene correctamente su card
En la card de `Distribución por Nivel`:
- convertir `Card`/`CardContent` a layout vertical con `h-full`
- hacer que el contenedor del gráfico use `flex-1 min-h-0`

Así la gráfica ocupa bien la altura fijada y no queda “flotando” dentro de una tarjeta estirada.

### Resultado esperado
```text
Fila 2 del dashboard
┌ Distribución por Nivel ┐  ┌ Tareas Rápidas ┐
│ altura fija            │  │ misma altura   │
│ gráfico centrado       │  │ tabs + input   │
│                        │  │ 3 tareas visibles
│                        │  │ desde la 4.ª → scroll interno
└────────────────────────┘  └────────────────┘
```

### Archivos a tocar
- `src/components/dashboard/TodoWidget.tsx`
- `src/components/dashboard/DashboardCharts.tsx`

### Detalle técnico
La causa no es el `ScrollArea`, sino la falta de una altura acotada en el widget. La corrección debe hacerse fijando la altura del par de tarjetas de la segunda fila y delegando el overflow únicamente al área del listado.
