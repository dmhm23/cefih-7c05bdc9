import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert } from "lucide-react";

interface JustificacionEdicionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (justificacion: string) => void;
  isPending?: boolean;
}

export function JustificacionEdicionDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: JustificacionEdicionDialogProps) {
  const [justificacion, setJustificacion] = useState("");

  const handleConfirm = () => {
    onConfirm(justificacion.trim());
    setJustificacion("");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) setJustificacion("");
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Justificación de edición
          </DialogTitle>
          <DialogDescription>
            Este curso está cerrado. Indique el motivo de la modificación. Esta justificación quedará registrada en el historial de auditoría.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Escriba el motivo de la modificación..."
          value={justificacion}
          onChange={(e) => setJustificacion(e.target.value)}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!justificacion.trim() || isPending}
          >
            {isPending ? "Guardando..." : "Confirmar edición"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
