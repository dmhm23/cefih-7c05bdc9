import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useFormatoVersiones, useRestoreVersion } from '@/hooks/useFormatosFormacion';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { RotateCcw, Clock } from 'lucide-react';
import { useState } from 'react';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatoId: string;
}

export default function VersionHistoryDialog({ open, onOpenChange, formatoId }: VersionHistoryDialogProps) {
  const { data: versiones = [], isLoading } = useFormatoVersiones(open ? formatoId : undefined);
  const restoreMutation = useRestoreVersion();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const handleRestore = async () => {
    if (!restoreId) return;
    try {
      await restoreMutation.mutateAsync({ formatoId, versionId: restoreId });
      toast({ title: 'Versión restaurada correctamente' });
      logActivity({ action: "restaurar", module: "formatos", description: `Restauró versión anterior de formato`, entityType: "formato_formacion", entityId: formatoId, metadata: { version_restaurada: restoreId } });
      onOpenChange(false);
    } catch {
      toast({ title: 'Error al restaurar versión', variant: 'destructive' });
    }
    setRestoreId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historial de Versiones
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Cargando...</p>
          ) : versiones.length === 0 ? (
            <div className="py-8 text-center">
              <Clock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No hay versiones guardadas</p>
              <p className="text-xs text-muted-foreground mt-1">
                Usa "Guardar versión" en el editor para crear un punto de restauración
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {versiones.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        v{v.version}
                      </Badge>
                      <span className="text-sm">
                        {format(new Date(v.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                      </span>
                    </div>
                    {v.creadoPor && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Por: {v.creadoPor}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRestoreId(v.id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Restaurar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!restoreId}
        onOpenChange={(open) => !open && setRestoreId(null)}
        title="¿Restaurar esta versión?"
        description="El contenido actual de la plantilla será reemplazado por esta versión. Esta acción no se puede deshacer."
        confirmText="Restaurar"
        onConfirm={handleRestore}
      />
    </>
  );
}
