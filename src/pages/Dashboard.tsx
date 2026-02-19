import { Users, GraduationCap, BookOpen, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePersonas } from "@/hooks/usePersonas";
import { useMatriculas } from "@/hooks/useMatriculas";
import { useCursos } from "@/hooks/useCursos";
import { NIVEL_FORMACION_EMPRESA_LABELS } from "@/types/matricula";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: personas = [] } = usePersonas();
  const { data: matriculas = [] } = useMatriculas();
  const { data: cursos = [] } = useCursos();

  const stats = [
    {
      title: "Personas",
      value: personas.length.toString(),
      description: "Registradas en el sistema",
      icon: Users,
      href: "/personas",
      color: "text-blue-600",
    },
    {
      title: "Matrículas",
      value: matriculas.length.toString(),
      description: `${matriculas.filter(m => m.estado === 'pendiente' || m.estado === 'creada').length} pendientes`,
      icon: GraduationCap,
      href: "/matriculas",
      color: "text-emerald-600",
    },
    {
      title: "Cursos",
      value: cursos.length.toString(),
      description: `${cursos.filter(c => c.estado === 'abierto' || c.estado === 'en_progreso').length} activos`,
      icon: BookOpen,
      href: "/cursos",
      color: "text-purple-600",
    },
    {
      title: "Tasa de Certificación",
      value: matriculas.length > 0 
        ? `${Math.round((matriculas.filter(m => m.estado === 'certificada' || m.estado === 'completa').length / matriculas.length) * 100)}%`
        : "0%",
      description: "Matrículas completadas",
      icon: TrendingUp,
      href: "/matriculas",
      color: "text-amber-600",
    },
  ];

  const recentMatriculas = matriculas.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido al Sistema SAFA - Panel de Administración
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(stat.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate("/personas/nuevo")}
            >
              Nueva Persona
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate("/matriculas/nueva")}
            >
              Nueva Matrícula
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={() => navigate("/cursos/nuevo")}
            >
              Nuevo Curso
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Enrollments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Matrículas Recientes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/matriculas")}>
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentMatriculas.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                No hay matrículas registradas
              </p>
            ) : (
              <div className="space-y-3">
                {recentMatriculas.map((m) => (
                  <div 
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/matriculas/${m.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {m.empresaNivelFormacion ? NIVEL_FORMACION_EMPRESA_LABELS[m.empresaNivelFormacion] : 'Sin nivel'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {m.id.slice(0, 8)}...
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      m.estado === 'completa' || m.estado === 'certificada' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : m.estado === 'pendiente'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {m.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
