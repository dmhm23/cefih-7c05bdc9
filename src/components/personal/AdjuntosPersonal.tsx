import { useState } from "react";
import { FileText, Trash2, Download, Loader2, Eye, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { AdjuntoPersonal } from "@/types/personal";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface AdjuntosPersonalProps {
  adjuntos: AdjuntoPersonal[];
  onUpload: (file: File) => void;
  onDelete: (adjuntoId: string) => void;
  isUploading?: boolean;
  isDeleting?: boolean;
}

export function AdjuntosPersonal({ adjuntos, onUpload, onDelete, isUploading, isDeleting }: AdjuntosPersonalProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) return;
    onUpload(file);
  };

  const handleDownload = (adj: AdjuntoPersonal) => {
    if (!adj.dataUrl) return;
    const a = document.createElement("a");
    a.href = adj.dataUrl;
    a.download = adj.nombre;
    a.click();
  };

  const previewAdj = previewId ? adjuntos.find(a => a.id === previewId) : null;

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {adjuntos.length} {adjuntos.length === 1 ? "archivo" : "archivos"} adjuntos
        </span>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button type="button" variant="outline" size="sm" asChild disabled={isUploading}>
            <span>
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5 mr-1" />
              )}
              {isUploading ? "Subiendo..." : "Cargar archivo"}
            </span>
          </Button>
        </label>
      </div>

      {/* File list */}
      {adjuntos.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No hay documentos adjuntos</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Suba hojas de vida, contratos, cédulas u otros documentos relevantes
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {adjuntos.map((adj) => (
            <div key={adj.id} className="space-y-0">
              <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className={cn(
                  "h-8 w-8 rounded flex items-center justify-center shrink-0",
                  adj.tipo.startsWith("image/") ? "bg-blue-500/10" : "bg-amber-500/10"
                )}>
                  <FileText className={cn(
                    "h-4 w-4",
                    adj.tipo.startsWith("image/") ? "text-blue-600" : "text-amber-600"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{adj.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(adj.tamano)} · {format(new Date(adj.fechaCarga), "dd/MM/yyyy")}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {adj.dataUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPreviewId(previewId === adj.id ? null : adj.id)}
                      title="Vista previa"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(adj)}
                    title="Descargar"
                    disabled={!adj.dataUrl}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => onDelete(adj.id)}
                    disabled={isDeleting}
                    title="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Inline preview */}
              {previewId === adj.id && adj.dataUrl && (
                <div className="border rounded-lg overflow-hidden mt-1">
                  <div className="flex items-center justify-between bg-muted px-3 py-1.5">
                    <div className="flex items-center gap-2 text-xs font-medium truncate">
                      <Eye className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{adj.nombre}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-xs"
                        onClick={() => {
                          const w = window.open();
                          if (w) {
                            w.document.write(`<iframe src="${adj.dataUrl}" style="width:100%;height:100%;border:none"></iframe>`);
                            w.document.title = adj.nombre;
                          }
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> Abrir
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setPreviewId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {adj.tipo === "application/pdf" ? (
                    <iframe src={adj.dataUrl} className="w-full h-52 border-0" title="Vista previa" />
                  ) : adj.tipo.startsWith("image/") ? (
                    <img src={adj.dataUrl} alt="Vista previa" className="w-full max-h-52 object-contain p-2" />
                  ) : (
                    <div className="p-3 text-center text-sm text-muted-foreground">
                      <FileText className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs">{adj.nombre}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
