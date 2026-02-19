import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAgregarFechaAdicional } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";

interface AddFechaMinTrabajoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoId: string;
}

export function AddFechaMinTrabajoDialog({ open, onOpenChange, cursoId }: AddFechaMinTrabajoDialogProps) {
  const { toast } = useToast();
  const agregarFecha = useAgregarFechaAdicional();
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");

  const handleSubmit = async () => {
    if (!fecha || !motivo.trim()) return;
    try {
      await agregarFecha.mutateAsync({ id: cursoId, data: { fecha, motivo: motivo.trim() } });
      toast({ title: "Fecha adicional agregada" });
      setFecha("");
      setMotivo("");
      onOpenChange(false);
    } catch {
      toast({ title: "Error al agregar fecha", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar Fecha Adicional de Cierre MinTrabajo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha *</label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
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
          <Button onClick={handleSubmit} disabled={!fecha || !motivo.trim() || agregarFecha.isPending}>
            {agregarFecha.isPending ? "Agregando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
