

## Plan: Rediseño completo del Dashboard

Se reemplaza el Dashboard actual por uno alineado al DRS, con 5 tarjetas de acción, 3 gráficos con filtro de tiempo, y un widget To-Do. Todo con datos mock ya que no hay backend real.

---

### Archivos nuevos

#### 1. `src/data/mockDashboard.ts`
Funciones helper que calculan las métricas del dashboard a partir de los datos mock existentes:
- `calcTotalFacturadoPagado(grupos)` — suma `totalAbonos` de grupos con estado `pagado`
- `calcCarteraPorCobrar(grupos)` — suma `saldo` de grupos con estado != `pagado`
- `calcMatriculasIncompletas(matriculas)` — conteo de matrículas con documentos pendientes (al menos 1 doc no cargado y no opcional)
- `calcCursosSinCerrar(cursos)` — cursos en `en_progreso` con `fechaFin <= hoy`
- `calcPendientesMinTrabajo(cursos, matriculas)` — cursos `cerrado` con matrículas aprobadas sin `minTrabajoRegistro`
- Funciones generadoras de datos de series temporales para gráficos (volumen matrículas, ingresos, distribución por nivel) — generadas como arrays estáticos mock con 12 meses.

#### 2. `src/components/dashboard/StatCard.tsx`
Componente de tarjeta métrica reutilizable:
- Props: `title`, `value`, `description`, `icon`, `href` (con query params), `colorScheme` (verde/rojo/naranja/neutro)
- Semaforización condicional: borde izquierdo coloreado + icono
- Click navega con `navigate(href)`
- Skeleton state via prop `loading`

#### 3. `src/components/dashboard/DashboardCharts.tsx`
Sección de gráficos con selector de periodo (Trimestre/Semestre/Anual):
- **Volumen de Matrículas**: `BarChart` de Recharts (meses vs cantidad)
- **Ingresos en el Tiempo**: `AreaChart` (meses vs monto $)
- **Distribución por Nivel**: `PieChart` tipo donut (por tipo de formación)
- Usa `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` de `@/components/ui/chart`
- Filtro global de tiempo: `Select` con 3 opciones, filtra los arrays de datos mock
- Grid responsive: en desktop líneas/área al 60%, donut al 40%

#### 4. `src/components/dashboard/TodoWidget.tsx`
Widget de tareas rápidas (almacenamiento local por ahora, preparado para DB):
- Estado en `localStorage` bajo key `dashboard_todos_{userId}`
- Input + botón "+" o Enter para crear
- Lista con checkbox (toggle completado), texto con line-through si completado
- Botón papelera para eliminar
- Completados van al final, ordenados por fecha desc
- Card con scroll interno si hay muchas tareas

---

### Archivo modificado

#### 5. `src/pages/Dashboard.tsx` — Reescritura completa
Reemplazar todo el contenido actual por:

```
Layout:
┌─────────────────────────────────────────────┐
│ Header: "Dashboard" + subtítulo             │
├────┬────┬────┬────┬────────────────────────┤
│Card│Card│Card│Card│ Card (5ta en mobile     │
│ 1  │ 2  │ 3  │ 4  │  baja a fila 2)        │
├────┴────┴────┴────┴────────────────────────┤
│ Selector Periodo [Trim|Sem|Anual]           │
├──────────────────────┬─────────────────────┤
│ BarChart Matrículas  │ PieChart Nivel      │
│ AreaChart Ingresos   │                     │
├──────────────────────┴─────────────────────┤
│ TodoWidget (panel inferior o lateral)       │
└─────────────────────────────────────────────┘
```

- 5 tarjetas en grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-5`
- Sección gráficos en grid `lg:grid-cols-5` (3 cols gráficos temporales, 2 cols donut)
- TodoWidget debajo en card separada
- Cada tarjeta usa `StatCard` con los cálculos de `mockDashboard.ts`
- Skeleton loading mientras los hooks cargan datos

### Tarjetas y sus rutas de clic

| Tarjeta | Ruta |
|---|---|
| Total Facturado y Pagado | `/cartera?estado=pagado` |
| Cartera por Cobrar | `/cartera?estado=pendiente` |
| Matrículas Incompletas | `/matriculas?estado_documentacion=incompleto` |
| Cursos sin Cerrar | `/cursos?estado=en_ejecucion&cierre=pendiente` |
| Pendientes MinTrabajo | `/cursos?estado=finalizado&reportado_mintrabajo=false` |

> Nota: Las páginas destino no parsean aun estos query params para filtrar. Eso se implementará como tarea separada cuando se conecte el backend.

### Dependencias
- `recharts` ya está instalado (usado por `chart.tsx`)
- No se requiere ninguna instalación adicional

