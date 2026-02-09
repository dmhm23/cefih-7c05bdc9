import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Unlock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
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
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/cursos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{curso.nombre}</h1>
            <StatusBadge status={curso.estado} />
          </div>
          <p className="text-sm text-muted-foreground">{curso.descripcion}</p>
        </div>
        <div className="flex gap-2">
          {curso.estado === "abierto" && (
            <Button size="sm" onClick={() => handleCambiarEstado("en_progreso")}>
              Iniciar Curso
            </Button>
          )}
          {curso.estado === "en_progreso" && (
            <Button size="sm" variant="destructive" onClick={() => handleCambiarEstado("cerrado")}>
              <Lock className="h-4 w-4 mr-1" />
              Cerrar
            </Button>
          )}
          {curso.estado === "cerrado" && (
            <Button size="sm" variant="outline" onClick={() => handleCambiarEstado("abierto")}>
              <Unlock className="h-4 w-4 mr-1" />
              Reabrir
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info del curso */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Información del Curso
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Inicio</p>
                <p className="text-sm font-medium">
                  {format(new Date(curso.fechaInicio), "dd MMM yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fin</p>
                <p className="text-sm font-medium">
                  {format(new Date(curso.fechaFin), "dd MMM yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duración</p>
                <p className="text-sm font-medium">{curso.duracionDias} días ({curso.horasTotales}h)</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Entrenador</p>
                <p className="text-sm font-medium">{curso.entrenadorNombre}</p>
              </div>
            </div>

            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Capacidad</span>
                <span>{matriculas.length} / {curso.capacidadMaxima}</span>
              </div>
              <Progress value={capacidadUsada} className="h-1.5" />
            </div>
          </div>

          {/* Lista de estudiantes */}
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Estudiantes Inscritos
              </h3>
              {curso.estado === "abierto" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/matriculas/nueva?cursoId=${curso.id}`)}
                >
                  Agregar
                </Button>
              )}
            </div>
            {matriculas.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No hay estudiantes inscritos
              </div>
            ) : (
              <div className="space-y-1">
                {matriculas.map((m) => {
                  const persona = getPersona(m.personaId);
                  const semaforo = getSemaforoColor(m.estado);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/matriculas/${m.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            semaforo === "verde" && "bg-emerald-500",
                            semaforo === "amarillo" && "bg-amber-500",
                            semaforo === "rojo" && "bg-red-500"
                          )}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {persona?.nombres} {persona?.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {persona?.tipoDocumento}: {persona?.numeroDocumento}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resumen de Estados
            </h3>
            {estadisticas && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Completas / Certificadas
                  </span>
                  <span className="font-semibold">{estadisticas.completas + estadisticas.certificadas}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Pendientes
                  </span>
                  <span className="font-semibold">{estadisticas.pendientes}</span>
                </div>
                <div className="flex items-center justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{estadisticas.total}</span>
                </div>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Acciones
            </h3>
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-4 w-4 mr-1" />
              Generar Asistencia PDF
            </Button>
            <Button variant="outline" size="sm" className="w-full">
              Exportar Listado
            </Button>
          </div>

          <div className="border rounded-lg p-4 shadow-sm space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creado:</span>
              <span>{format(new Date(curso.createdAt), "dd/MM/yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actualizado:</span>
              <span>{format(new Date(curso.updatedAt), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
