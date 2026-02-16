import { useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, X } from "lucide-react";
import InfoAprendizDocument from "./InfoAprendizDocument";
import { Persona } from "@/types/persona";
import { Matricula } from "@/types/matricula";
import { Curso } from "@/types/curso";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
}

export default function InfoAprendizPreviewDialog({
  open,
  onOpenChange,
  persona,
  matricula,
  curso,
}: Props) {
  const documentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!documentRef.current) return;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;

    const content = documentRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Información del Aprendiz</title>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 20mm 15mm; font-size: 12px; }
            h1 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; margin-bottom: 12px; }
            h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid #d4d4d4; padding-bottom: 4px; margin-bottom: 10px; margin-top: 18px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
            .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; line-height: 1.2; }
            .field-value { font-size: 12px; font-weight: 500; line-height: 1.3; }
            .field-empty { color: #a3a3a3; font-style: italic; }
            .col-span-2 { grid-column: span 2; }
            .health-row { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 2px 0; }
            .health-detail { font-size: 10px; color: #737373; padding-left: 8px; }
            .pending-text { font-size: 12px; color: #a3a3a3; font-style: italic; }
            .signature-box { border: 2px dashed #d4d4d4; border-radius: 4px; height: 80px; display: flex; align-items: center; justify-content: center; }
            .badge { display: inline-flex; align-items: center; font-size: 9px; border: 1px solid #fbbf24; color: #d97706; border-radius: 9999px; padding: 0 6px; margin-left: 8px; }
            .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60px; font-weight: 900; color: rgba(0,0,0,0.04); letter-spacing: 0.2em; text-transform: uppercase; pointer-events: none; z-index: 1; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th { text-align: left; font-size: 10px; font-weight: 600; padding: 4px 8px 4px 0; border-bottom: 1px solid #d4d4d4; }
            th.center { text-align: center; }
            td { padding: 4px 8px 4px 0; border-bottom: 1px solid #f5f5f5; font-size: 10px; }
            td.center { text-align: center; }
            .radio-cell { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid #737373; display: inline-block; }
            .radio-cell.checked { background: #1a1a1a; border-color: #1a1a1a; }
            .section-header { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #d4d4d4; padding-bottom: 4px; margin-bottom: 10px; margin-top: 18px; }
            @media print { body { padding: 10mm; } .watermark { color: rgba(0,0,0,0.03); } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Vista Previa — Información del Aprendiz</DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePrint}>
                <Download className="h-4 w-4 mr-1" />
                Descargar PDF
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
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
