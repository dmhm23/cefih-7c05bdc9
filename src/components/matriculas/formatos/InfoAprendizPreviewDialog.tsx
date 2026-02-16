import { useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Download } from "lucide-react";
import InfoAprendizDocument from "./InfoAprendizDocument";
import { Persona } from "@/types/persona";
import { Matricula } from "@/types/matricula";
import { Curso } from "@/types/curso";

function buildPdfFilename(formatName: string, persona: Persona | null): string {
  const parts = [
    formatName,
    persona?.tipoDocumento || "",
    persona?.numeroDocumento || "",
    persona?.nombres || "",
    persona?.apellidos || "",
  ];
  return (
    parts
      .join("-")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "") + ".pdf"
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
}

const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 10mm; font-size: 12px; }
  
  .doc-root { max-width: 210mm; margin: 0 auto; position: relative; padding: 16px; background: white; }
  .doc-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; margin-bottom: 12px; }
  .borrador-subtitle { font-size: 10px; color: #d97706; margin-top: 4px; }

  .section-title { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #d4d4d4; padding-bottom: 4px; margin-bottom: 10px; margin-top: 18px; }
  .section-title h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }

  .field-cell .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; line-height: 1.2; }
  .field-cell .field-value { font-size: 12px; font-weight: 500; line-height: 1.3; }
  .field-cell .field-empty { color: #a3a3a3; font-style: italic; }
  .field-span { grid-column: span 2; }

  .badge-pending { display: inline-flex; align-items: center; font-size: 9px; border: 1px solid #fbbf24; color: #d97706; border-radius: 9999px; padding: 0 6px; }

  .health-section { font-size: 12px; }
  .health-section > * + * { margin-top: 4px; }
  .health-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
  .health-row .font-medium { font-weight: 500; }
  .health-detail { font-size: 10px; color: #737373; padding-left: 8px; }

  .pending-text { font-size: 12px; color: #a3a3a3; font-style: italic; }

  .signature-box { border: 2px dashed #d4d4d4; border-radius: 4px; height: 80px; display: flex; align-items: center; justify-content: center; }

  .watermark { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 1; }
  .watermark span { font-size: 60px; font-weight: 900; color: rgba(0,0,0,0.04); transform: rotate(-45deg); letter-spacing: 0.2em; text-transform: uppercase; }

  .auto-eval-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .auto-eval-table th { text-align: left; font-size: 10px; font-weight: 600; padding: 4px 8px 4px 0; border-bottom: 1px solid #d4d4d4; }
  .auto-eval-table th:not(:first-child) { text-align: center; }
  .auto-eval-table td { padding: 4px 8px 4px 0; border-bottom: 1px solid #f5f5f5; font-size: 10px; }
  .auto-eval-table td:not(:first-child) { text-align: center; }

  /* Replace radio buttons with circles for print */
  .auto-eval-table button[role="radio"] { 
    width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid #737373; 
    display: inline-block; background: transparent; padding: 0; appearance: none; 
  }
  .auto-eval-table button[role="radio"][data-state="checked"] { 
    background: #1a1a1a; border-color: #1a1a1a; 
  }
  .auto-eval-table button[role="radio"] svg { display: none; }
  .auto-eval-table button[role="radio"] span { display: none; }

  @media print { 
    body { padding: 5mm; } 
    .watermark span { color: rgba(0,0,0,0.03); } 
  }
`;

export default function InfoAprendizPreviewDialog({
  open,
  onOpenChange,
  persona,
  matricula,
  curso,
}: Props) {
  const documentRef = useRef<HTMLDivElement>(null);

  const pdfFilename = buildPdfFilename("informacion-aprendiz", persona);

  const handlePrint = useCallback(() => {
    if (!documentRef.current) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const content = documentRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${pdfFilename}</title>
          <style>${PRINT_STYLES}</style>
        </head>
        <body>
          <div class="doc-root">${content}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  }, [pdfFilename]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Vista Previa — Información del Aprendiz</DialogTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={handlePrint}>
                    <Download className="h-4 w-4 mr-1" />
                    Descargar PDF
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Descargar como PDF</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 bg-muted/30 min-h-full">
            <div ref={documentRef} className="shadow-lg rounded border">
              <InfoAprendizDocument
                persona={persona}
                matricula={matricula}
                curso={curso}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
