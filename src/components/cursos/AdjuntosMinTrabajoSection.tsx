import { useState, useMemo } from "react";
import { FileText, Trash2, Download, Eye, X, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { Progress } from "@/components/ui/progress";
import { useAdjuntosMinTrabajo, useAddAdjuntoMinTrabajo, useDeleteAdjuntoMinTrabajo } from "@/hooks/useCursos";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { AdjuntoMinTrabajo } from "@/types/curso";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface AdjuntosMinTrabajoSectionProps {
  cursoId: string;
  fechaId?: string | null;
  title?: string;
  readOnly?: boolean;
}

export function AdjuntosMinTrabajoSection({ cursoId, fechaId = null, title, readOnly }: AdjuntosMinTrabajoSectionProps) {
  const { toast } = useToast();
  const { data: adjuntos = [], isLoading } = useAdjuntosMinTrabajo(cursoId, fechaId);
  const addMutation = useAddAdjuntoMinTrabajo();
  const deleteMutation = useDeleteAdjuntoMinTrabajo();
  const [previewId, setPreviewId] = useState<string | null>(null);

  const previewMap = useMemo(() => {
    const m: Record<string, string> = {};
    adjuntos.forEach((a) => { if (a.url) m[a.id] = a.url; });
    return m;
  }, [adjuntos]);

  const handleFiles = async (files: File[]) => {
    const remaining = MAX_FILES - adjuntos.length;
    if (remaining <= 0) {
      toast({ title: `Límite alcanzado`, description: `Solo se permiten ${MAX_FILES} archivos por registro`, variant: "destructive" });
      return;
    }
    const toUpload = files.slice(0, remaining);
    if (files.length > remaining) {
      toast({ title: "Algunos archivos no se subirán", description: `Solo quedan ${remaining} cupos disponibles`, variant: "destructive" });
    }
    for (const file of toUpload) {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: `Archivo demasiado grande`, description: `${file.name} supera 5 MB`, variant: "destructive" });
        continue;
      }
      try {
        await addMutation.mutateAsync({ cursoId, file, fechaId });
      } catch (e: any) {
        toast({ title: "Error al subir", description: e?.message || file.name, variant: "destructive" });
      }
    }
  };

  const handleDownload = (adj: AdjuntoMinTrabajo) => {
    if (!adj.url) return;
    const a = document.createElement("a");
    a.href = adj.url;
    a.download = adj.nombre;
    a.target = "_blank";
    a.click();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ adjuntoId: id, cursoId, fechaId });
      toast({ title: "Adjunto eliminado" });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
  };

  const isFull = adjuntos.length >= MAX_FILES;

  return (
    <div className="space-y-2">
      {(title || !readOnly) && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {title && <p className="text-xs font-medium text-muted-foreground">{title}</p>}
          <span className="text-xs text-muted-foreground ml-auto">
            {adjuntos.length} / {MAX_FILES} · PDF, JPG, PNG · Máx. 5 MB
          </span>
        </div>
      )}

      {!readOnly && !isFull && (
        <FileDropZone
          accept=".pdf,.jpg,.jpeg,.png"
          onFiles={handleFiles}
          multiple
          compact
          disabled={addMutation.isPending}
          label={addMutation.isPending ? "Subiendo..." : "Subir archivos (PDF/JPG/PNG)"}
        />
      )}

      {addMutation.isPending && (
        <div className="flex items-center gap-2 px-2 py-1.5 border rounded-md bg-muted/30">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          <span className="text-xs text-muted-foreground flex-1">Cargando archivos...</span>
          <Progress value={undefined} className="h-1 w-20" />
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-1">Cargando adjuntos...</p>
      ) : adjuntos.length === 0 ? null : (
        <div className="space-y-1.5">
          {adjuntos.map((adj) => {
            const isImage = adj.tipoMime.startsWith("image/");
            const isPdf = adj.tipoMime === "application/pdf";
            return (
              <div key={adj.id} className="space-y-0">
                <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={cn(
                    "h-8 w-8 rounded flex items-center justify-center shrink-0",
                    isImage ? "bg-blue-500/10" : "bg-amber-500/10"
                  )}>
                    <FileText className={cn("h-4 w-4", isImage ? "text-blue-600" : "text-amber-600")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{adj.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(adj.tamano)} · {format(new Date(adj.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {adj.url && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setPreviewId(previewId === adj.id ? null : adj.id)} title="Vista previa">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                      onClick={() => handleDownload(adj)} title="Descargar" disabled={!adj.url}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    {!readOnly && (
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(adj.id)} disabled={deleteMutation.isPending} title="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {previewId === adj.id && previewMap[adj.id] && (
                  <div className="border rounded-lg overflow-hidden mt-1">
                    <div className="flex items-center justify-between bg-muted px-3 py-1.5">
                      <div className="flex items-center gap-2 text-xs font-medium truncate">
                        <Eye className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{adj.nombre}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-1.5 text-xs"
                          onClick={() => window.open(previewMap[adj.id], "_blank")}>
                          <ExternalLink className="h-3 w-3 mr-1" /> Abrir
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                          onClick={() => setPreviewId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {isPdf ? (
                      <object data={previewMap[adj.id]} type="application/pdf" className="w-full h-52">
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Button type="button" variant="outline" size="sm" onClick={() => window.open(previewMap[adj.id], "_blank")}>
                            <ExternalLink className="h-3 w-3 mr-1" /> Abrir en nueva pestaña
                          </Button>
                        </div>
                      </object>
                    ) : isImage ? (
                      <img src={previewMap[adj.id]} alt={adj.nombre} className="w-full max-h-52 object-contain p-2" />
                    ) : (
                      <div className="p-3 text-center text-sm text-muted-foreground">
                        <FileText className="h-6 w-6 mx-auto mb-1" />
                        <p className="text-xs">{adj.nombre}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
