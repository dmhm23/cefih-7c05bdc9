

## Plan: Agregar tooltips informativos a cada gráfica del dashboard

### Resumen
Agregar un ícono de información (ℹ️ / `Info` de lucide-react) al lado del título de cada gráfica. Al pasar el cursor, se mostrará un tooltip explicando qué representa esa gráfica.

### Archivo: `src/components/dashboard/DashboardCharts.tsx`

Agregar un ícono `Info` (16px, `text-muted-foreground`) junto a cada `CardTitle`, envuelto en un `Tooltip` de Radix UI.

**Textos de cada tooltip:**

1. **Volumen de Matrículas**: "Cantidad de estudiantes matriculados por mes en el período seleccionado."
2. **Ingresos en el Tiempo**: "Ingresos totales recaudados por mes, expresados en pesos colombianos (COP)."
3. **Distribución por Nivel**: "Cantidad de estudiantes agrupados por nivel de formación empresarial."

### Estructura visual
```text
CardHeader
├── <CardTitle>Volumen de Matrículas</CardTitle>
├── <Tooltip>
│     <TooltipTrigger> <Info size={14} /> </TooltipTrigger>
│     <TooltipContent> texto explicativo </TooltipContent>
│   </Tooltip>
└── [Select período] (solo en la primera)
```

### Imports nuevos
- `Info` de `lucide-react`
- `Tooltip, TooltipContent, TooltipProvider, TooltipTrigger` de `@/components/ui/tooltip`

