import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BloqueadoItem {
  nombre: string;
  motivos: string[];
}

interface ResultadosMasivos {
  generados: number;
  bloqueados: BloqueadoItem[];
}

interface GeneracionMasivaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultados: ResultadosMasivos | null;
  isGenerating: boolean;
  total: number;
  progreso: number;
}

export function GeneracionMasivaDialog({
  open,
  onOpenChange,
  resultados,
  isGenerating,
  total,
  progreso,
}: GeneracionMasivaDialogProps) {
  const porcentaje = total > 0 ? Math.round((progreso / total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={isGenerating ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isGenerating ? "Generando certificados…" : "Resultado de generación"}
          </DialogTitle>
        </DialogHeader>

        {isGenerating && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Procesando {progreso} de {total}…
              </span>
            </div>
            <Progress value={porcentaje} className="h-2" />
          </div>
        )}

        {!isGenerating && resultados && (
          <div className="space-y-4 py-2">
            {resultados.generados > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">
                  {resultados.generados} certificado{resultados.generados !== 1 ? "s" : ""} generado{resultados.generados !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {resultados.bloqueados.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium">
                    {resultados.bloqueados.length} bloqueado{resultados.bloqueados.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ScrollArea className="max-h-48">
                  <div className="space-y-2 pl-7">
                    {resultados.bloqueados.map((b, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium">{b.nombre}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {b.motivos.map((m, j) => (
                            <Badge key={j} variant="outline" className="text-xs font-normal">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
