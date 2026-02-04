import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Personas",
    value: "4",
    description: "Registradas en el sistema",
    icon: Users,
    trend: "+2 esta semana",
  },
  {
    title: "Matrículas",
    value: "4",
    description: "Activas actualmente",
    icon: GraduationCap,
    trend: "+1 hoy",
  },
  {
    title: "Cursos",
    value: "3",
    description: "En diferentes estados",
    icon: BookOpen,
    trend: "1 en progreso",
  },
  {
    title: "Tasa de Certificación",
    value: "85%",
    description: "Promedio general",
    icon: TrendingUp,
    trend: "+5% vs mes anterior",
  },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido al Sistema SAFA - Panel de Administración
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                <p className="text-xs text-primary mt-2 font-medium">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Placeholder content */}
        <Card>
          <CardHeader>
            <CardTitle>Sistema en Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Los módulos de Personas, Matrículas y Cursos están siendo implementados.
              La arquitectura base ya está lista con tipos, servicios mock y hooks de React Query.
            </p>
            <div className="mt-4 flex gap-2 flex-wrap">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                Fase 0 ✓
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                Módulo A - Pendiente
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                Módulo B - Pendiente
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">
                Módulo C - Pendiente
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
