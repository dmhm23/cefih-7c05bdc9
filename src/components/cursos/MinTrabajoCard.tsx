import { useState } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateField } from "@/components/shared/DateField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AddFechaMinTrabajoDialog } from "@/components/cursos/AddFechaMinTrabajoDialog";
import { Curso } from "@/types/curso";
import { useActualizarMinTrabajo, useEliminarFechaAdicional } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MinTrabajoCardProps {
  curso: Curso;
  readOnly?: boolean;
}

export function MinTrabajoCard({ curso, readOnly }: MinTrabajoCardProps) {
  const { toast } = useToast();
  const actualizarMinTrabajo = useActualizarMinTrabajo();
  const eliminarFecha = useEliminarFechaAdicional();

  const [registro, setRegistro] = useState(curso.minTrabajoRegistro || "");
  const [responsable, setResponsable] = useState(curso.minTrabajoResponsable || "");
  const [fechaPrincipal, setFechaPrincipal] = useState(curso.minTrabajoFechaCierrePrincipal || "");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [fechaToDelete, setFechaToDelete] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const handleSaveMinTrabajo = async () => {
    try {
      await actualizarMinTrabajo.mutateAsync({
        id: curso.id,
        data: {
          minTrabajoRegistro: registro,
          minTrabajoResponsable: responsable,
          minTrabajoFechaCierrePrincipal: fechaPrincipal,
        },
      });
      toast({ title: "Registro MinTrabajo actualizado" });
      setDirty(false);
    } catch {
      toast({ title: "Error al actualizar", variant: "destructive" });
    }
  };

  const handleDeleteFecha = async () => {
    if (!fechaToDelete) return;
    try {
      await eliminarFecha.mutateAsync({ cursoId: curso.id, fechaId: fechaToDelete });
      toast({ title: "Fecha adicional eliminada" });
      setFechaToDelete(null);
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const hasMissing = !curso.minTrabajoRegistro || !curso.minTrabajoFechaCierrePrincipal;

  return (
    <>
      <Card id="mintrabajo-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Registro MinTrabajo
            </CardTitle>
            {hasMissing && curso.estado !== "cerrado" && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                Pendiente para cierre
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Número de Registro *</label>
              <Input
                value={registro}
                onChange={(e) => { setRegistro(e.target.value); setDirty(true); }}
                placeholder="MT-XXXX-XXXXX"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Responsable del Registro</label>
              <Input
                value={responsable}
                onChange={(e) => { setResponsable(e.target.value); setDirty(true); }}
                placeholder="Nombre del responsable"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Fecha Cierre Principal *</label>
              <Input
                type="date"
                value={fechaPrincipal}
                onChange={(e) => { setFechaPrincipal(e.target.value); setDirty(true); }}
                disabled={readOnly}
              />
            </div>
          </div>

          {dirty && !readOnly && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveMinTrabajo} disabled={actualizarMinTrabajo.isPending}>
                {actualizarMinTrabajo.isPending ? "Guardando..." : "Guardar MinTrabajo"}
              </Button>
            </div>
          )}

          {/* Fechas adicionales */}
          {curso.minTrabajoFechasAdicionales.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs font-medium text-muted-foreground">Fechas Adicionales de Cierre</p>
              {curso.minTrabajoFechasAdicionales.map((f) => (
                <div key={f.id} className="flex items-start justify-between p-2 bg-muted/30 rounded text-sm gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <CalendarDays className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{format(new Date(f.fecha), "d MMM yyyy", { locale: es })}</p>
                      <p className="text-xs text-muted-foreground">{f.motivo}</p>
                      <p className="text-xs text-muted-foreground">Por: {f.createdBy}</p>
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setFechaToDelete(f.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar fecha adicional
            </Button>
          )}
        </CardContent>
      </Card>

      <AddFechaMinTrabajoDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        cursoId={curso.id}
      />

      <ConfirmDialog
        open={!!fechaToDelete}
        onOpenChange={(open) => !open && setFechaToDelete(null)}
        title="Eliminar fecha adicional"
        description="¿Está seguro de eliminar esta fecha adicional de cierre?"
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDeleteFecha}
      />
    </>
  );
}
