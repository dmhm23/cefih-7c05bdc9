import { DollarSign, FileWarning, BookOpenCheck, Clock, FileCheck2 } from "lucide-react";
import { useMatriculas } from "@/hooks/useMatriculas";
import { useCursos } from "@/hooks/useCursos";
import { useGruposCartera } from "@/hooks/useCartera";
import StatCard from "@/components/dashboard/StatCard";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import TodoWidget from "@/components/dashboard/TodoWidget";
import {
  calcTotalFacturadoPagado,
  calcCarteraPorCobrar,
  calcMatriculasIncompletas,
  calcCursosSinCerrar,
  calcPendientesMinTrabajo,
} from "@/data/mockDashboard";

const formatCOP = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(v);

const Dashboard = () => {
  const { data: matriculas = [], isLoading: loadingM } = useMatriculas();
  const { data: cursos = [], isLoading: loadingC } = useCursos();
  const { grupos = [], isLoading: loadingG } = useCartera();

  const loading = loadingM || loadingC || loadingG;

  const facturadoPagado = calcTotalFacturadoPagado(grupos);
  const carteraPorCobrar = calcCarteraPorCobrar(grupos);
  const matriculasIncompletas = calcMatriculasIncompletas(matriculas);
  const cursosSinCerrar = calcCursosSinCerrar(cursos);
  const pendientesMinTrabajo = calcPendientesMinTrabajo(cursos);

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
          value={formatCOP(facturadoPagado)}
          description="Acumulado total recaudado"
          icon={DollarSign}
          href="/cartera?estado=pagado"
          colorScheme="green"
          loading={loading}
        />
        <StatCard
          title="Cartera por Cobrar"
          value={formatCOP(carteraPorCobrar)}
          description="Saldo pendiente de recaudo"
          icon={FileWarning}
          href="/cartera?estado=pendiente"
          colorScheme={carteraPorCobrar > 0 ? "red" : "green"}
          loading={loading}
        />
        <StatCard
          title="Matrículas Incompletas"
          value={matriculasIncompletas.toString()}
          description="Documentación pendiente"
          icon={FileCheck2}
          href="/matriculas?estado_documentacion=incompleto"
          colorScheme={matriculasIncompletas > 0 ? "orange" : "green"}
          loading={loading}
        />
        <StatCard
          title="Cursos sin Cerrar"
          value={cursosSinCerrar.toString()}
          description="Fecha fin vencida"
          icon={Clock}
          href="/cursos?estado=en_ejecucion&cierre=pendiente"
          colorScheme={cursosSinCerrar > 0 ? "red" : "green"}
          loading={loading}
        />
        <StatCard
          title="Pendientes MinTrabajo"
          value={pendientesMinTrabajo.toString()}
          description="Sin reporte a MinTrabajo"
          icon={BookOpenCheck}
          href="/cursos?estado=finalizado&reportado_mintrabajo=false"
          colorScheme={pendientesMinTrabajo > 0 ? "orange" : "green"}
          loading={loading}
        />
      </div>

      {/* Charts */}
      <DashboardCharts matriculas={matriculas} loading={loading} />

      {/* Todo Widget */}
      <div className="max-w-lg">
        <TodoWidget />
      </div>
    </div>
  );
};

export default Dashboard;
