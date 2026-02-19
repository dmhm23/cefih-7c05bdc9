import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Curso } from "@/types/curso";
import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import { useCambiarEstadoCurso } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/services/api";

type Step = "idle" | "mintrabajo_missing" | "matriculas_pending" | "confirm";

interface CloseCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso: Curso;
  matriculas: Matricula[];
  personas: Persona[];
  onScrollToMinTrabajo: () => void;
  onFilterPendientes: () => void;
}

export function CloseCourseDialog({
  open,
  onOpenChange,
  curso,
  matriculas,
  personas,
  onScrollToMinTrabajo,
  onFilterPendientes,
}: CloseCourseDialogProps) {
  const { toast } = useToast();
  const cambiarEstado = useCambiarEstadoCurso();
  const [step, setStep] = useState<Step>("idle");
  const [pendingMatriculas, setPendingMatriculas] = useState<Matricula[]>([]);

  const getPersona = (id: string) => personas.find((p) => p.id === id);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      // Run front-end MinTrabajo validation
      if (!curso.minTrabajoRegistro || !curso.minTrabajoFechaCierrePrincipal) {
        setStep("mintrabajo_missing");
      } else {
        setStep("confirm");
      }
    } else {
      setStep("idle");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = async () => {
    try {
      await cambiarEstado.mutateAsync({ id: curso.id, estado: "cerrado" });
      toast({ title: "Curso cerrado exitosamente" });
      onOpenChange(false);
      setStep("idle");
    } catch (error: any) {
      if (error instanceof ApiError && error.code === "MATRICULAS_PENDIENTES") {
        const pending = matriculas.filter((m) => m.estado === "creada" || m.estado === "pendiente");
        setPendingMatriculas(pending);
        setStep("matriculas_pending");
      } else if (error instanceof ApiError && error.code === "MINTRABAJO_REQUERIDO") {
        setStep("mintrabajo_missing");
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg">
        {step === "mintrabajo_missing" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Registro MinTrabajo Requerido
              </DialogTitle>
              <DialogDescription>
                Para cerrar el curso debe registrar el número MinTrabajo y la fecha de cierre MinTrabajo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onScrollToMinTrabajo();
                }}
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Completar Registro MinTrabajo
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "matriculas_pending" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Matrículas Pendientes
              </DialogTitle>
              <DialogDescription>
                No se puede cerrar el curso. Hay {pendingMatriculas.length} matrícula(s) en estado pendiente o creada.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-48 overflow-y-auto space-y-1.5 py-2">
              {pendingMatriculas.map((m) => {
                const persona = getPersona(m.personaId);
                return (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <span>{persona ? `${persona.nombres} ${persona.apellidos}` : m.id}</span>
                    <Badge variant="outline" className="text-xs">{m.estado}</Badge>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onFilterPendientes();
                }}
              >
                Ver pendientes
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>¿Cerrar curso?</DialogTitle>
              <DialogDescription>
                Esta acción marcará el curso como cerrado. Se validará que no existan matrículas pendientes.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={cambiarEstado.isPending}>
                {cambiarEstado.isPending ? "Cerrando..." : "Confirmar cierre"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
