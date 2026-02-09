import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePersona } from "@/hooks/usePersonas";
import { useMatriculasByPersona } from "@/hooks/useMatriculas";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PersonaDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: persona, isLoading } = usePersona(id || "");
  const { data: matriculas = [] } = useMatriculasByPersona(id || "");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Persona no encontrada</p>
        <Button variant="link" onClick={() => navigate("/personas")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/personas")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{persona.nombres} {persona.apellidos}</h1>
          <p className="text-sm text-muted-foreground">{persona.tipoDocumento}: {persona.numeroDocumento}</p>
        </div>
        <Button size="sm" onClick={() => navigate(`/personas/${id}/editar`)}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Información Personal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Información Personal
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{persona.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="text-sm font-medium">{persona.telefono}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de Nacimiento</p>
                <p className="text-sm font-medium">
                  {format(new Date(persona.fechaNacimiento), "dd 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RH</p>
                <p className="text-sm font-medium">{persona.rh}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-3 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contacto de Emergencia
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="text-sm font-medium">{persona.contactoEmergencia.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="text-sm font-medium">{persona.contactoEmergencia.telefono}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Parentesco</p>
                <p className="text-sm font-medium">{persona.contactoEmergencia.parentesco}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Matrículas */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Matrículas
          </h3>
          {matriculas.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Sin matrículas registradas
            </p>
          ) : (
            <div className="space-y-1.5">
              {matriculas.map((m) => (
                <div
                  key={m.id}
                  className="p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/matriculas/${m.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {m.tipoFormacion.replace("_", " ")}
                    </span>
                    <StatusBadge status={m.estado} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(m.createdAt), "dd/MM/yyyy")}
                  </p>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => navigate(`/matriculas/nueva?personaId=${id}`)}
          >
            Nueva Matrícula
          </Button>
        </div>
      </div>
    </div>
  );
}
