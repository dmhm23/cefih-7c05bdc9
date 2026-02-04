import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/personas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{persona.nombres} {persona.apellidos}</h1>
          <p className="text-muted-foreground">Cédula: {persona.cedula}</p>
        </div>
        <Button onClick={() => navigate(`/personas/${id}/editar`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Personal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{persona.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{persona.telefono}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="font-medium">
                    {format(new Date(persona.fechaNacimiento), "dd 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{persona.direccion}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">EPS</p>
                  <p className="font-medium">{persona.eps}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">ARL</p>
                  <p className="font-medium">{persona.arl}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-3">Contacto de Emergencia</h4>
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{persona.contactoEmergencia.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{persona.contactoEmergencia.telefono}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parentesco</p>
                  <p className="font-medium">{persona.contactoEmergencia.parentesco}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matrículas */}
        <Card>
          <CardHeader>
            <CardTitle>Matrículas</CardTitle>
          </CardHeader>
          <CardContent>
            {matriculas.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Sin matrículas registradas
              </p>
            ) : (
              <div className="space-y-3">
                {matriculas.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/matriculas/${m.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">
                        {m.tipoFormacion.replace("_", " ")}
                      </span>
                      <StatusBadge status={m.estado} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Creada: {format(new Date(m.createdAt), "dd/MM/yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate(`/matriculas/nueva?personaId=${id}`)}
            >
              Nueva Matrícula
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
