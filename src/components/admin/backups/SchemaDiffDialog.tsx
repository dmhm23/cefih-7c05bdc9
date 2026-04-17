import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface SchemaDiff {
  tablas_faltantes: string[];
  tablas_extras: string[];
  criticas_faltantes: string[];
  bloqueado: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: SchemaDiff | null;
  onConfirm: () => void;
  isProcessing: boolean;
}

export function SchemaDiffDialog({ open, onOpenChange, diff, onConfirm, isProcessing }: Props) {
  if (!diff) return null;
  const sinCambios =
    diff.tablas_faltantes.length === 0 && diff.tablas_extras.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {diff.bloqueado ? (
              <ShieldAlert className="h-5 w-5 text-destructive" />
            ) : sinCambios ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-warning" />
            )}
            Diferencias de esquema
          </DialogTitle>
          <DialogDescription>
            Comparación entre el backup y la estructura actual de la base de datos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {diff.bloqueado && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-destructive mb-1">Restauración bloqueada</p>
              <p className="text-foreground">
                Faltan tablas críticas en el proyecto actual. No es seguro restaurar este backup.
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {diff.criticas_faltantes.map((t) => (
                  <Badge key={t} variant="destructive">{t}</Badge>
                ))}
              </ul>
            </div>
          )}

          {sinCambios && !diff.bloqueado && (
            <div className="rounded-md border border-success/30 bg-success/5 p-3 text-sm">
              El esquema del backup coincide exactamente con el del proyecto actual.
            </div>
          )}

          {diff.tablas_faltantes.length > 0 && !diff.bloqueado && (
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Tablas en el backup que no existen ahora ({diff.tablas_faltantes.length})
              </p>
              <ScrollArea className="max-h-32">
                <div className="flex flex-wrap gap-1.5">
                  {diff.tablas_faltantes.map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-2">
                Sus datos serán omitidos durante la restauración.
              </p>
            </div>
          )}

          {diff.tablas_extras.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                Tablas nuevas en el proyecto, no incluidas en el backup ({diff.tablas_extras.length})
              </p>
              <ScrollArea className="max-h-32">
                <div className="flex flex-wrap gap-1.5">
                  {diff.tablas_extras.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-2">
                Permanecerán intactas durante la restauración.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={diff.bloqueado || isProcessing}
            variant={diff.bloqueado ? "outline" : "default"}
          >
            {isProcessing ? "Restaurando..." : "Continuar restauración"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
