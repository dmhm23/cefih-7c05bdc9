import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MonitoreoRow } from '@/services/portalMonitoreoService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, Lock, FileText, Award } from 'lucide-react';

interface MonitoreoDetalleDialogProps {
  row: MonitoreoRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const estadoConfig = {
  completado: { label: 'Completado', icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pendiente: { label: 'Pendiente', icon: Clock, className: 'bg-amber-100 text-amber-700 border-amber-200' },
  bloqueado: { label: 'Bloqueado', icon: Lock, className: 'bg-muted text-muted-foreground border-border' },
};

export function MonitoreoDetalleDialog({ row, open, onOpenChange }: MonitoreoDetalleDialogProps) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detalle Portal
          </DialogTitle>
          <DialogDescription>Estado de documentos del portal para esta matrícula.</DialogDescription>
        </DialogHeader>

        {/* Estudiante */}
        <div className="space-y-1">
          <p className="text-sm font-medium">{row.personaNombre}</p>
          <p className="text-xs text-muted-foreground">CC {row.personaCedula}</p>
        </div>

        <Separator />

        {/* Curso */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground text-xs">Curso</span>
            <p className="font-medium">{row.cursoNumeroCurso}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Nivel</span>
            <p className="font-medium">{row.tipoFormacionLabel}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Inicio</span>
            <p>{format(new Date(row.fechaInicio), 'dd MMM yyyy', { locale: es })}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs">Fin</span>
            <p>{format(new Date(row.fechaFin), 'dd MMM yyyy', { locale: es })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Portal:</span>
          <Badge variant={row.portalHabilitado ? 'default' : 'secondary'}>
            {row.portalHabilitado ? 'Habilitado' : 'Deshabilitado'}
          </Badge>
        </div>

        <Separator />

        {/* Documentos */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Documentos</h4>
          {row.documentosEstado.map((doc) => {
            const cfg = estadoConfig[doc.estado];
            const Icon = cfg.icon;
            return (
              <div
                key={doc.key}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-start gap-2 min-w-0">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{doc.nombre}</p>
                    {doc.enviadoEn && (
                      <p className="text-xs text-muted-foreground">
                        Enviado: {format(new Date(doc.enviadoEn), 'dd MMM yyyy HH:mm', { locale: es })}
                      </p>
                    )}
                    {doc.puntaje !== undefined && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Award className="h-3 w-3" /> Puntaje: {doc.puntaje}%
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cfg.className}>
                  {cfg.label}
                </Badge>
              </div>
            );
          })}

          {/* Firma thumbnail if any doc has one */}
          {row.documentosEstado.some((d) => d.firmaBase64) && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Firma registrada</h4>
              {row.documentosEstado
                .filter((d) => d.firmaBase64)
                .map((d) => (
                  <div key={d.key} className="space-y-1">
                    <p className="text-xs text-muted-foreground">{d.nombre}</p>
                    <img
                      src={d.firmaBase64}
                      alt="Firma"
                      className="h-16 rounded border bg-white p-1"
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
