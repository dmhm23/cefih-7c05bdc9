import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DateField } from "@/components/shared/DateField";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { AdjuntosMinTrabajoSection } from "@/components/cursos/AdjuntosMinTrabajoSection";
import { useAgregarFechaAdicional, useEditarFechaAdicional, useAddAdjuntoMinTrabajo } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { FechaAdicionalMinTrabajo } from "@/types/curso";
import { FileText, X } from "lucide-react";
import { cursoService } from "@/services/cursoService";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

interface AddFechaMinTrabajoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoId: string;
  fechaEditar?: FechaAdicionalMinTrabajo | null;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function AddFechaMinTrabajoDialog({ open, onOpenChange, cursoId, fechaEditar }: AddFechaMinTrabajoDialogProps) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const agregarFecha = useAgregarFechaAdicional();
  const editarFecha = useEditarFechaAdicional();
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const isEditing = !!fechaEditar;

  useEffect(() => {
    if (open && fechaEditar) {
      setFecha(fechaEditar.fecha);
      setMotivo(fechaEditar.motivo);
      setPendingFiles([]);
    } else if (open) {
      setFecha("");
      setMotivo("");
      setPendingFiles([]);
    }
  }, [open, fechaEditar]);

  const handleAddPending = (files: File[]) => {
    const remaining = MAX_FILES - pendingFiles.length;
    if (remaining <= 0) {
      toast({ title: "Límite alcanzado", description: `Máximo ${MAX_FILES} archivos`, variant: "destructive" });
      return;
    }
    const accepted: File[] = [];
    for (const f of files.slice(0, remaining)) {
      if (f.size > MAX_FILE_SIZE) {
        toast({ title: "Archivo muy grande", description: `${f.name} supera 5 MB`, variant: "destructive" });
        continue;
      }
      accepted.push(f);
    }
    setPendingFiles((prev) => [...prev, ...accepted]);
  };

  const removePending = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!fecha || !motivo.trim()) return;
    try {
      if (isEditing && fechaEditar) {
        await editarFecha.mutateAsync({ cursoId, fechaId: fechaEditar.id, data: { fecha, motivo: motivo.trim() } });
        toast({ title: "Fecha adicional actualizada" });
        logActivity({ action: "editar", module: "cursos", description: `Editó fecha adicional MinTrabajo (${fecha})`, entityType: "curso", entityId: cursoId, metadata: { fecha, motivo: motivo.trim() } });
      } else {
        const cursoActualizado = await agregarFecha.mutateAsync({ id: cursoId, data: { fecha, motivo: motivo.trim() } });
        toast({ title: "Fecha adicional agregada" });
        logActivity({ action: "crear", module: "cursos", description: `Agregó fecha adicional MinTrabajo (${fecha})`, entityType: "curso", entityId: cursoId, metadata: { fecha, motivo: motivo.trim() } });

        // Subir adjuntos pendientes a la fecha recién creada (es la última en orden cronológico)
        if (pendingFiles.length > 0) {
          // Identificar la nueva fecha: la más reciente con misma fecha+motivo
          const nuevaFecha = cursoActualizado.minTrabajoFechasAdicionales
            .filter(f => f.fecha === fecha && f.motivo === motivo.trim())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

          if (nuevaFecha) {
            setUploading(true);
            let uploaded = 0;
            for (const file of pendingFiles) {
              try {
                await cursoService.addAdjuntoMinTrabajo(cursoId, file, nuevaFecha.id);
                uploaded++;
              } catch (e: any) {
                toast({ title: "Error al subir adjunto", description: `${file.name}: ${e?.message || ''}`, variant: "destructive" });
              }
            }
            setUploading(false);
            if (uploaded > 0) {
              toast({ title: `${uploaded} adjunto(s) cargado(s)` });
            }
          }
        }
      }
      setFecha("");
      setMotivo("");
      setPendingFiles([]);
      onOpenChange(false);
    } catch {
      toast({ title: isEditing ? "Error al actualizar fecha" : "Error al agregar fecha", variant: "destructive" });
    }
  };

  const isPending = agregarFecha.isPending || editarFecha.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Fecha Adicional" : "Agregar Fecha Adicional de Cierre MinTrabajo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fecha *</label>
            <DateField value={fecha} onChange={setFecha} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Motivo / Observación *</label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo por el cual se agrega esta fecha adicional..."
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Adjuntos: edición usa el componente directo; creación acumula en estado local */}
          {isEditing && fechaEditar ? (
            <div className="space-y-1.5 pt-2 border-t">
              <label className="text-sm font-medium">Adjuntos</label>
              <AdjuntosMinTrabajoSection cursoId={cursoId} fechaId={fechaEditar.id} />
            </div>
          ) : (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Adjuntos (opcional)</label>
                <span className="text-xs text-muted-foreground">{pendingFiles.length} / {MAX_FILES}</span>
              </div>
              {pendingFiles.length < MAX_FILES && (
                <FileDropZone
                  accept=".pdf,.jpg,.jpeg,.png"
                  onFiles={handleAddPending}
                  multiple
                  disabled={isPending}
                  label="Arrastra archivos o haz clic para seleccionar"
                  hint="PDF, JPG, PNG · Máx. 5 MB · Hasta 10 archivos"
                />
              )}
              {pendingFiles.length > 0 && (
                <div className="space-y-1">
                  {pendingFiles.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(f.size)}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                        onClick={() => removePending(idx)} disabled={isPending}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!fecha || !motivo.trim() || isPending}>
            {isPending ? (uploading ? "Subiendo adjuntos..." : (isEditing ? "Guardando..." : "Agregando...")) : (isEditing ? "Guardar" : "Agregar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
