import { useState, useMemo } from "react";
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import {
  generateVolumenMatriculas,
  generateIngresosTiempo,
  generateDistribucionNivel,
  filterByPeriod,
} from "@/data/mockDashboard";
import { Matricula } from "@/types/matricula";

type Period = "trimestre" | "semestre" | "anual";

interface DashboardChartsProps {
  matriculas: Matricula[];
  loading?: boolean;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
};

const DashboardCharts = ({ matriculas, loading }: DashboardChartsProps) => {
  const [period, setPeriod] = useState<Period>("anual");

  const volumen = useMemo(() => filterByPeriod(generateVolumenMatriculas(), period), [period]);
  const ingresos = useMemo(() => filterByPeriod(generateIngresosTiempo(), period), [period]);
  const distribucion = useMemo(() => generateDistribucionNivel(matriculas), [matriculas]);

  if (loading) {
    return (
      <>
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </>
    );
  }

  return (
    <TooltipProvider>
      {/* Volumen Matrículas */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Volumen de Matrículas</CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info size={14} className="text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>Cantidad de estudiantes matriculados por mes en el período seleccionado.</TooltipContent>
              </Tooltip>
            </div>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom">
                <SelectItem value="trimestre">Trimestre</SelectItem>
                <SelectItem value="semestre">Semestre</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumen}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <RechartsTooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="valor" name="Estudiantes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Ingresos */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-sm font-medium">Ingresos en el Tiempo</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={14} className="text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>Ingresos totales recaudados por mes, expresados en pesos colombianos (COP).</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ingresos}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs fill-muted-foreground" />
                <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} className="text-xs fill-muted-foreground" />
                <RechartsTooltip
                  formatter={(value: number) => [formatCurrency(value), "Ingreso"]}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--success))"
                  fill="hsl(var(--success) / 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Distribución por Nivel */}
      <Card className="h-[370px] flex flex-col overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribución por Nivel</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col items-center justify-center">
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribucion}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="cantidad"
                  nameKey="nivel"
                  paddingAngle={3}
                >
                  {distribucion.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={tooltipStyle} />
                <Legend
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default DashboardCharts;
