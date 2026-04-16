import { ChevronDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useExcepcionesByMatricula, useAprobarExcepcion, useRechazarExcepcion } from "@/hooks/useExcepcionesCertificado";
import { useToast } from "@/hooks/use-toast";
import type { SolicitudExcepcionCertificado, EstadoExcepcion } from "@/types/certificado";
import { useState } from "react";

interface Props {
  matriculaId: string;
  onExcepcionAprobada?: () => void;
}

const ESTADO_BADGE: Record<EstadoExcepcion, { label: string; className: string; icon: React.ElementType }> = {
  pendiente: { label: "Pendiente", className: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  aprobada: { label: "Aprobada", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
};

export function ExcepcionesPanel({ matriculaId, onExcepcionAprobada }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { data: excepciones = [] } = useExcepcionesByMatricula(matriculaId);
  const aprobar = useAprobarExcepcion();
  const rechazar = useRechazarExcepcion();

  if (excepciones.length === 0) return null;

  const pendientes = excepciones.filter(e => e.estado === "pendiente").length;

  const handleAprobar = async (exc: SolicitudExcepcionCertificado) => {
    try {
      await aprobar.mutateAsync({ id: exc.id, resueltoPor: "admin" });
      toast({ title: "Excepción aprobada", description: "Se ha autorizado la generación excepcional del certificado." });
      onExcepcionAprobada?.();
    } catch {
      toast({ title: "Error al aprobar excepción", variant: "destructive" });
    }
  };

  const handleRechazar = async (exc: SolicitudExcepcionCertificado) => {
    try {
      await rechazar.mutateAsync({ id: exc.id, resueltoPor: "admin" });
      toast({ title: "Excepción rechazada" });
    } catch {
      toast({ title: "Error al rechazar excepción", variant: "destructive" });
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
          <span className="flex items-center gap-1.5">
            Excepciones
            {pendientes > 0 && (
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                {pendientes} pendiente{pendientes > 1 ? "s" : ""}
              </Badge>
            )}
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-1">
        {excepciones.map((exc) => {
          const cfg = ESTADO_BADGE[exc.estado];
          const IconEstado = cfg.icon;
          return (
            <div key={exc.id} className="border rounded-md p-3 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <p className="text-foreground flex-1">{exc.motivo}</p>
                <Badge className={cfg.className}>
                  <IconEstado className="h-3 w-3 mr-1" />
                  {cfg.label}
                </Badge>
              </div>
              <div className="text-muted-foreground">
                Solicitado por: {exc.solicitadoPor} · {new Date(exc.fechaSolicitud).toLocaleDateString("es-CO")}
                {exc.resueltoPor && (
                  <> · Resuelto por: {exc.resueltoPor}</>
                )}
              </div>
              {exc.estado === "pendiente" && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    onClick={() => handleAprobar(exc)}
                    disabled={aprobar.isPending}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Aprobar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                    onClick={() => handleRechazar(exc)}
                    disabled={rechazar.isPending}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Rechazar
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
