import { useState } from "react";
import { FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codigoCertificado: string;
  onConfirm: (motivo: string) => Promise<void>;
  isPending?: boolean;
}

export function RevocacionDialog({ open, onOpenChange, codigoCertificado, onConfirm, isPending }: Props) {
  const [motivo, setMotivo] = useState("");

  const handleConfirm = async () => {
    await onConfirm(motivo);
    setMotivo("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <FileWarning className="h-5 w-5" />
            Revocar Certificado
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. El certificado quedará marcado como revocado y su código no podrá reutilizarse.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm">
            Certificado: <span className="font-mono font-medium">{codigoCertificado}</span>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Motivo de revocación *</label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ingrese el motivo de la revocación..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!motivo.trim() || isPending}
          >
            Revocar Certificado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
