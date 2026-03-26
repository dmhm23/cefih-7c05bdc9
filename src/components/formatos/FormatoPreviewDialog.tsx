import { useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download } from "lucide-react";
import FormatoPreviewDocument from "./FormatoPreviewDocument";
import TemplatePreviewDialog from "./TemplatePreviewDialog";
import type { FormatoFormacion } from "@/types/formatoFormacion";

const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 6mm; font-size: 12px; }
  .doc-root { max-width: 210mm; margin: 0 auto; padding: 16px; background: white; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d4d4d4; padding: 4px 8px; font-size: 11px; }
  @media print { body { padding: 5mm; } }
`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formato: Partial<FormatoFormacion>;
}

export default function FormatoPreviewDialog({ open, onOpenChange, formato }: Props) {
  if (formato.motorRender === 'plantilla_html') {
    return <TemplatePreviewDialog open={open} onOpenChange={onOpenChange} formato={formato} />;
  }
  return <BloquesPreviewDialog open={open} onOpenChange={onOpenChange} formato={formato} />;
}

function BloquesPreviewDialog({ open, onOpenChange, formato }: Props) {
  const documentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!documentRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    const clone = documentRef.current.cloneNode(true) as HTMLElement;
    const filename = `${formato.nombre || "formato"}-preview.pdf`
      .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.-]/g, "-").replace(/-{2,}/g, "-");
    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>${filename}</title><style>${PRINT_STYLES}</style></head><body><div class="doc-root">${clone.innerHTML}</div></body></html>`
    );
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [formato.nombre]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Vista Previa — {formato.nombre || "Sin nombre"}</DialogTitle>
            <Button size="sm" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-1" />
              Descargar PDF
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="p-4 bg-muted/30 min-h-full flex justify-center">
            <div ref={documentRef} className="shadow-lg rounded border bg-white w-full" style={{ maxWidth: "210mm" }}>
              <FormatoPreviewDocument formato={formato} />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
