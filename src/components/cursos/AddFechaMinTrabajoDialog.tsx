import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DateField } from "@/components/shared/DateField";
import { useAgregarFechaAdicional, useEditarFechaAdicional } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";
import { FechaAdicionalMinTrabajo } from "@/types/curso";

interface AddFechaMinTrabajoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoId: string;
  fechaEditar?: FechaAdicionalMinTrabajo | null;
}

export function AddFechaMinTrabajoDialog({ open, onOpenChange, cursoId, fechaEditar }: AddFechaMinTrabajoDialogProps) {
  const { toast } = useToast();
  const agregarFecha = useAgregarFechaAdicional();
  const editarFecha = useEditarFechaAdicional();
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");

  const isEditing = !!fechaEditar;

  useEffect(() => {
    if (open && fechaEditar) {
      setFecha(fechaEditar.fecha);
      setMotivo(fechaEditar.motivo);
    } else if (open) {
      setFecha("");
      setMotivo("");
    }
  }, [open, fechaEditar]);

  const handleSubmit = async () => {
    if (!fecha || !motivo.trim()) return;
    try {
      if (isEditing && fechaEditar) {
        await editarFecha.mutateAsync({ cursoId, fechaId: fechaEditar.id, data: { fecha, motivo: motivo.trim() } });
        toast({ title: "Fecha adicional actualizada" });
      } else {
        await agregarFecha.mutateAsync({ id: cursoId, data: { fecha, motivo: motivo.trim() } });
        toast({ title: "Fecha adicional agregada" });
      }
      setFecha("");
      setMotivo("");
      onOpenChange(false);
    } catch {
      toast({ title: isEditing ? "Error al actualizar fecha" : "Error al agregar fecha", variant: "destructive" });
    }
  };

  const isPending = agregarFecha.isPending || editarFecha.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Fecha Adicional" : "Agregar Fecha Adicional de Cierre MinTrabajo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha *</label>
            <DateField value={fecha} onChange={setFecha} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Motivo / Observación *</label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo por el cual se agrega esta fecha adicional..."
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!fecha || !motivo.trim() || isPending}>
            {isPending ? (isEditing ? "Guardando..." : "Agregando...") : (isEditing ? "Guardar" : "Agregar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
