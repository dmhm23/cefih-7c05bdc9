import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, FileWarning } from "lucide-react";
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

type Step = "idle" | "mintrabajo_missing" | "documentos_incompletos" | "confirm";

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
  const [matriculasConDocsIncompletos, setMatriculasConDocsIncompletos] = useState<Matricula[]>([]);

  const getPersona = (id: string) => personas.find((p) => p.id === id);

  const getDocsIncompletos = () =>
    matriculas.filter((m) =>
      m.documentos.some((d) => !d.opcional && d.estado === "pendiente")
    );

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      // 1. Validar MinTrabajo
      if (!curso.minTrabajoRegistro || !curso.minTrabajoFechaCierrePrincipal) {
        setStep("mintrabajo_missing");
      } else {
        // 2. Validar documentos completos
        const incompletos = getDocsIncompletos();
        if (incompletos.length > 0) {
          setMatriculasConDocsIncompletos(incompletos);
          setStep("documentos_incompletos");
        } else {
          setStep("confirm");
        }
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
      if (error instanceof ApiError && error.code === "DOCUMENTOS_INCOMPLETOS") {
        const incompletos = getDocsIncompletos();
        setMatriculasConDocsIncompletos(incompletos);
        setStep("documentos_incompletos");
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

        {step === "documentos_incompletos" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive" />
                Documentos Incompletos
              </DialogTitle>
              <DialogDescription>
                No se puede cerrar el curso. Hay {matriculasConDocsIncompletos.length} matrícula(s) con documentos pendientes.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-48 overflow-y-auto space-y-1.5 py-2">
              {matriculasConDocsIncompletos.map((m) => {
                const persona = getPersona(m.personaId);
                const pendientes = m.documentos.filter((d) => !d.opcional && d.estado === "pendiente");
                return (
                  <div key={m.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                    <span>{persona ? `${persona.nombres} ${persona.apellidos}` : m.id}</span>
                    <Badge variant="outline" className="text-xs">
                      {pendientes.length} doc(s) pendiente(s)
                    </Badge>
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
                Revisar matrículas
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>¿Cerrar curso?</DialogTitle>
              <DialogDescription>
                Esta acción marcará el curso como cerrado. Se validará que todos los documentos estén completos.
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
