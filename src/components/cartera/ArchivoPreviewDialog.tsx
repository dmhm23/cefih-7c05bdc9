import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string | null;
  nombre?: string;
}

function getFileType(url: string): "pdf" | "image" | "unknown" {
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf") || lower.includes("application/pdf")) return "pdf";
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.startsWith("blob:")) return "image";
  // blob URLs from createObjectURL — try to detect via mime in the name
  if (lower.includes("image/")) return "image";
  // Default to image for blob URLs (most common use case)
  if (lower.startsWith("blob:")) return "image";
  return "unknown";
}

export function ArchivoPreviewDialog({ open, onOpenChange, url, nombre = "Archivo" }: Props) {
  if (!url) return null;

  const fileType = getFileType(nombre || url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between gap-2">
          <DialogTitle className="truncate text-sm">{nombre}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => window.open(url, "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir
          </Button>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/20">
          {fileType === "pdf" ? (
            <iframe src={url} className="w-full h-[70vh]" title={nombre} />
          ) : fileType === "image" ? (
            <div className="flex items-center justify-center p-4">
              <img src={url} alt={nombre} className="max-w-full max-h-[65vh] object-contain rounded" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <p className="text-sm text-muted-foreground">Vista previa no disponible para este formato.</p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open(url, "_blank")}>
                <Download className="h-3.5 w-3.5" />
                Descargar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
