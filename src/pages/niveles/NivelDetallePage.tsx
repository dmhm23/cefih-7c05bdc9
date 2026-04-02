import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, FileText, Clock, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useNivelFormacion, useDeleteNivelFormacion } from "@/hooks/useNivelesFormacion";
import { CATALOGO_DOCUMENTOS, TIPOS_CAMPO_LABELS } from "@/types/nivelFormacion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { CodigoEstudianteCard } from "@/components/niveles/CodigoEstudianteCard";

export default function NivelDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);

  const { data: nivel, isLoading } = useNivelFormacion(id || "");
  const deleteNivel = useDeleteNivelFormacion();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!nivel) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Nivel no encontrado</p>
        <Button variant="link" onClick={() => navigate("/niveles")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteNivel.mutateAsync(nivel.id);
      toast({ title: "Nivel eliminado correctamente" });
      navigate("/niveles");
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const getDocLabel = (key: string) => {
    const found = CATALOGO_DOCUMENTOS.find(d => d.key === key);
    return found ? found.label : key;
  };

  const campos = nivel.camposAdicionales || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <IconButton tooltip="Volver" onClick={() => navigate("/niveles")}>
          <ArrowLeft className="h-4 w-4" />
        </IconButton>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">{nivel.nombreNivel}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/niveles/${nivel.id}/editar`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Información General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Duración</p>
                  <p className="font-medium">
                    {nivel.duracionHoras ? `${nivel.duracionHoras} horas` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Última actualización</p>
                  <p className="font-medium">{format(new Date(nivel.updatedAt), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {campos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Campos Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campos.map((campo) => (
                    <div key={campo.id} className="py-2.5 px-3 rounded-md border space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{campo.nombre}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {TIPOS_CAMPO_LABELS[campo.tipo]}
                        </Badge>
                        {campo.obligatorio && (
                          <Badge variant="default" className="text-[10px]">Obligatorio</Badge>
                        )}
                        {campo.alcance === "todos_los_niveles" && (
                          <Badge variant="outline" className="text-[10px]">Global</Badge>
                        )}
                      </div>
                      {campo.opciones && campo.opciones.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {campo.opciones.map((op, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-normal">
                              {op}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Badge variant="secondary" className="mt-3">
                  {campos.length} campo{campos.length !== 1 ? 's' : ''} adicional{campos.length !== 1 ? 'es' : ''}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Código de Estudiante — editable inline */}
          <CodigoEstudianteCard
            nivelId={nivel.id}
            config={nivel.configuracionCodigoEstudiante}
          />

          {nivel.observaciones && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{nivel.observaciones}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Requisitos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nivel.documentosRequeridos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin documentos configurados</p>
              ) : (
                <div className="space-y-2">
                  {nivel.documentosRequeridos.map((key) => (
                    <div key={key} className="flex items-center gap-2 py-1.5 px-2 rounded border text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {getDocLabel(key)}
                    </div>
                  ))}
                </div>
              )}
              <Badge variant="secondary" className="mt-3">
                {nivel.documentosRequeridos.length} requisito{nivel.documentosRequeridos.length !== 1 ? 's' : ''}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="¿Eliminar nivel de formación?"
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
