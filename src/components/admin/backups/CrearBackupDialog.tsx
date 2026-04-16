import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Database, HardDrive, Loader2 } from "lucide-react";
import type { BackupAlcance } from "@/types/backup";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (alcance: BackupAlcance) => void;
  isCreating: boolean;
}

export function CrearBackupDialog({ open, onOpenChange, onConfirm, isCreating }: Props) {
  const [alcance, setAlcance] = useState<BackupAlcance>("completo");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear backup ahora</DialogTitle>
          <DialogDescription>
            Selecciona qué incluir en este respaldo. El proceso se ejecuta en segundo plano.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={alcance} onValueChange={(v) => setAlcance(v as BackupAlcance)} className="gap-3 py-2">
          <Label
            htmlFor="r-completo"
            className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <RadioGroupItem value="completo" id="r-completo" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <HardDrive className="h-4 w-4" />
                Completo
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Base de datos + todos los archivos (firmas, documentos, certificados, adjuntos).
              </p>
            </div>
          </Label>

          <Label
            htmlFor="r-db"
            className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <RadioGroupItem value="db_only" id="r-db" className="mt-1" />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <Database className="h-4 w-4" />
                Solo base de datos
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Más rápido y ligero. No incluye archivos binarios.
              </p>
            </div>
          </Label>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(alcance)} disabled={isCreating}>
            {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Iniciar backup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
