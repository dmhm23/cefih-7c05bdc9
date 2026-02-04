import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, User, Users, FileText, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCurso, useCursoEstadisticas, useCambiarEstadoCurso } from "@/hooks/useCursos";
import { useMatriculasByCurso } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { ESTADO_CURSO_LABELS, EstadoMatricula } from "@/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Función para determinar el color del semáforo
const getSemaforoColor = (estado: EstadoMatricula): "verde" | "amarillo" | "rojo" => {
  if (estado === "completa" || estado === "certificada" || estado === "cerrada") return "verde";
  if (estado === "pendiente") return "amarillo";
  return "rojo";
};

export default function CursoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: curso, isLoading } = useCurso(id || "");
  const { data: estadisticas } = useCursoEstadisticas(id || "");
  const { data: matriculas = [] } = useMatriculasByCurso(id || "");
  const { data: personas = [] } = usePersonas();
  const cambiarEstado = useCambiarEstadoCurso();

  const getPersona = (personaId: string) => personas.find((p) => p.id === personaId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Curso no encontrado</p>
        <Button variant="link" onClick={() => navigate("/cursos")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const handleCambiarEstado = async (nuevoEstado: "abierto" | "en_progreso" | "cerrado") => {
    try {
      await cambiarEstado.mutateAsync({ id: curso.id, estado: nuevoEstado });
      toast({ title: `Estado cambiado a ${ESTADO_CURSO_LABELS[nuevoEstado]}` });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar el estado",
        variant: "destructive",
      });
    }
  };

  const capacidadUsada = (matriculas.length / curso.capacidadMaxima) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cursos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{curso.nombre}</h1>
            <StatusBadge status={curso.estado} />
          </div>
          <p className="text-muted-foreground">{curso.descripcion}</p>
        </div>
        <div className="flex gap-2">
          {curso.estado === "abierto" && (
            <Button onClick={() => handleCambiarEstado("en_progreso")}>
              Iniciar Curso
            </Button>
          )}
          {curso.estado === "en_progreso" && (
            <Button
              variant="destructive"
              onClick={() => handleCambiarEstado("cerrado")}
            >
              <Lock className="h-4 w-4 mr-2" />
              Cerrar Curso
            </Button>
          )}
          {curso.estado === "cerrado" && (
            <Button variant="outline" onClick={() => handleCambiarEstado("abierto")}>
              <Unlock className="h-4 w-4 mr-2" />
              Reabrir
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info del Curso */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Inicio</p>
                    <p className="font-medium">
                      {format(new Date(curso.fechaInicio), "dd MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fin</p>
                    <p className="font-medium">
                      {format(new Date(curso.fechaFin), "dd MMM yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Duración</p>
                    <p className="font-medium">{curso.duracionDias} días ({curso.horasTotales}h)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entrenador</p>
                    <p className="font-medium">{curso.entrenadorNombre}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Capacidad
                  </span>
                  <span>{matriculas.length} / {curso.capacidadMaxima}</span>
                </div>
                <Progress value={capacidadUsada} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Lista de Estudiantes con Semáforo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Estudiantes Inscritos</CardTitle>
                {curso.estado === "abierto" && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/matriculas/nueva?cursoId=${curso.id}`)}
                  >
                    Agregar Estudiante
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {matriculas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay estudiantes inscritos en este curso
                </div>
              ) : (
                <div className="space-y-2">
                  {matriculas.map((m) => {
                    const persona = getPersona(m.personaId);
                    const semaforo = getSemaforoColor(m.estado);
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/matriculas/${m.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-3 w-3 rounded-full",
                              semaforo === "verde" && "bg-emerald-500",
                              semaforo === "amarillo" && "bg-amber-500",
                              semaforo === "rojo" && "bg-red-500"
                            )}
                          />
                          <div>
                            <p className="font-medium">
                              {persona?.nombres} {persona?.apellidos}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {persona?.cedula}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <p className={m.pagado ? "text-emerald-600" : "text-amber-600"}>
                              {m.pagado ? "Pagado" : "Sin pago"}
                            </p>
                            <p className="text-muted-foreground">
                              Docs: {m.documentos.filter((d) => d.estado !== "pendiente").length}/{m.documentos.length}
                            </p>
                          </div>
                          <StatusBadge status={m.estado} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Estadísticas */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Estados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {estadisticas && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      Completas / Certificadas
                    </span>
                    <span className="font-bold">{estadisticas.completas + estadisticas.certificadas}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500" />
                      Pendientes
                    </span>
                    <span className="font-bold">{estadisticas.pendientes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold">{estadisticas.total}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generar Asistencia PDF
              </Button>
              <Button variant="outline" className="w-full">
                Exportar Listado
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creado:</span>
                  <span>{format(new Date(curso.createdAt), "dd/MM/yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actualizado:</span>
                  <span>{format(new Date(curso.updatedAt), "dd/MM/yyyy")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
