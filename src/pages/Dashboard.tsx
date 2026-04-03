
import { useState, useEffect } from "react";
import StatCard from "@/components/dashboard/StatCard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import TodoWidget from "@/components/dashboard/TodoWidget";
import { fetchDashboardStats, type DashboardStats } from "@/data/dashboardData";

const formatCOPFull = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const abbreviate = (v: number): string => {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = stats || { facturadoPagado: 0, carteraPendiente: 0, matriculasIncompletas: 0, cursosSinCerrar: 0, pendientesMinTrabajo: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Panel centralizado del estado operativo y financiero
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Facturado y Pagado"
          value={abbreviate(s.facturadoPagado)}
          fullValue={formatCOPFull(s.facturadoPagado)}
          description="Acumulado total recaudado"
          href="/cartera?estado=pagado"
          colorScheme="green"
          loading={loading}
        />
        <StatCard
          title="Cartera por Cobrar"
          value={abbreviate(s.carteraPendiente)}
          fullValue={formatCOPFull(s.carteraPendiente)}
          description="Saldo pendiente de recaudo"
          href="/cartera?estado=pendiente"
          colorScheme={s.carteraPendiente > 0 ? "red" : "green"}
          loading={loading}
        />
        <StatCard
          title="Matrículas Incompletas"
          value={s.matriculasIncompletas.toString()}
          description="Documentación pendiente"
          href="/matriculas?estado_documentacion=incompleto"
          colorScheme={s.matriculasIncompletas > 0 ? "orange" : "green"}
          loading={loading}
        />
        <StatCard
          title="Cursos sin Cerrar"
          value={s.cursosSinCerrar.toString()}
          description="Fecha fin vencida"
          href="/cursos?estado=en_ejecucion&cierre=pendiente"
          colorScheme={s.cursosSinCerrar > 0 ? "red" : "green"}
          loading={loading}
        />
        <StatCard
          title="Pendientes MinTrabajo"
          value={s.pendientesMinTrabajo.toString()}
          description="Sin reporte a MinTrabajo"
          href="/cursos?estado=finalizado&reportado_mintrabajo=false"
          colorScheme={s.pendientesMinTrabajo > 0 ? "orange" : "green"}
          loading={loading}
        />
      </div>

      {/* Charts + Todo Widget in 2x2 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardCharts loading={loading} />
        <TodoWidget />
      </div>
    </div>
  );
};

export default Dashboard;
