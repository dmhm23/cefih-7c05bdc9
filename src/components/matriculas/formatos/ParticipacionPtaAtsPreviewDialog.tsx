import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, AlertCircle } from "lucide-react";
import ParticipacionPtaAtsDocument from "./ParticipacionPtaAtsDocument";
import { Persona } from "@/types/persona";
import { Matricula } from "@/types/matricula";
import { Curso } from "@/types/curso";

function buildPdfFilename(formatName: string, persona: Persona | null): string {
  const parts = [formatName, persona?.tipoDocumento || "", persona?.numeroDocumento || "", persona?.nombres || "", persona?.apellidos || ""];
  return parts.join("-").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-").replace(/^-|-$/g, "") + ".pdf";
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
  .doc-header { display: grid; grid-template-columns: 120px 1fr 1fr; border: 1px solid #9ca3af; break-inside: avoid; font-size: 11px; line-height: 1.4; margin-bottom: 8px; }
  .doc-header-logo { display: flex; align-items: center; justify-content: center; padding: 8px; border-right: 1px solid #9ca3af; }
  .doc-header-logo img { max-width: 105px; max-height: 73px; object-fit: contain; }
  .doc-header-center { display: flex; flex-direction: column; border-right: 1px solid #9ca3af; }
  .doc-header-center-title { flex: 1; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px; text-align: center; }
  .doc-header-center-meta { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid #9ca3af; }
  .doc-header-meta-cell { padding: 4px 8px; display: flex; flex-direction: column; }
  .doc-header-meta-cell:first-child { border-right: 1px solid #9ca3af; }
  .doc-header-right { display: flex; flex-direction: column; }
  .doc-header-empresa { font-weight: 700; text-transform: uppercase; padding: 6px 8px; border-bottom: 1px solid #9ca3af; font-size: 11px; line-height: 1.3; }
  .doc-header-sgi { padding: 4px 8px; border-bottom: 1px solid #9ca3af; font-weight: 500; }
  .doc-header-subsistema { padding: 4px 8px; border-bottom: 1px solid #9ca3af; }
  .doc-header-fechas { display: grid; grid-template-columns: 1fr 1fr; }
  .doc-header-fecha-cell { padding: 4px 8px; font-size: 10px; font-weight: 500; }
  .doc-header-fecha-cell:first-child { border-right: 1px solid #9ca3af; }
  .borrador-subtitle { font-size: 10px; color: #d97706; margin-top: 4px; }
  .section-group { break-inside: avoid; }
  .section-title { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #d4d4d4; padding-bottom: 4px; margin-bottom: 10px; margin-top: 18px; }
  .section-title h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
  .field-cell .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; line-height: 1.2; }
  .field-cell .field-value { font-size: 12px; font-weight: 500; line-height: 1.3; }
  .field-cell .field-empty { color: #a3a3a3; font-style: italic; }
  .field-span { grid-column: span 2; }
  .normative-text { font-size: 12px; line-height: 1.6; text-align: justify; }
  .signature-box { border: 2px dashed #d4d4d4; border-radius: 4px; height: 100px; display: flex; align-items: center; justify-content: center; }
  .signature-box img { max-height: 80px; max-width: 250px; object-fit: contain; }
  .pending-text { font-size: 12px; color: #a3a3a3; font-style: italic; }
  .watermark { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 1; }
  .watermark span { font-size: 60px; font-weight: 900; color: rgba(0,0,0,0.04); transform: rotate(-45deg); letter-spacing: 0.2em; text-transform: uppercase; }
  .fecha-input { display: none !important; }
  @media print { body { padding: 5mm; } .watermark span { color: rgba(0,0,0,0.03); } }
`;

export default function ParticipacionPtaAtsPreviewDialog({ open, onOpenChange, persona, matricula, curso }: Props) {
  const [fechaDiligenciamiento, setFechaDiligenciamiento] = useState(curso?.fechaInicio || "");
  const documentRef = useRef<HTMLDivElement>(null);
  const isBlocked = !matricula.firmaCapturada || !matricula.autorizacionDatos;
  const pdfFilename = buildPdfFilename("participacion-pta-ats", persona);

  const handlePrint = useCallback(() => {
    if (!documentRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const clone = documentRef.current.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".fecha-input").forEach((el) => {
      const input = el as HTMLInputElement;
      const span = document.createElement("p");
      span.className = "field-value text-sm font-medium leading-snug";
      span.textContent = input.value || "Pendiente";
      input.replaceWith(span);
    });

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${pdfFilename}</title><style>${PRINT_STYLES}</style></head><body><div class="doc-root">${clone.innerHTML}</div></body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  }, [pdfFilename]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Vista Previa — Participación PTA - ATS</DialogTitle>
            <Button size="sm" onClick={handlePrint} disabled={isBlocked}>
              <Download className="h-4 w-4 mr-1" />
              Descargar PDF
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          {isBlocked ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
              <AlertCircle className="h-10 w-10" />
              <p className="text-sm font-medium">Formato bloqueado</p>
              <p className="text-xs text-center max-w-sm">
                El estudiante debe completar primero el formato "Información del Aprendiz" (autorización + firma) antes de generar este documento.
              </p>
            </div>
          ) : (
            <div className="p-2 bg-muted/30 min-h-full">
              <div ref={documentRef} className="shadow-lg rounded border">
                <ParticipacionPtaAtsDocument
                  persona={persona}
                  matricula={matricula}
                  curso={curso}
                  fechaDiligenciamiento={fechaDiligenciamiento}
                  onFechaChange={setFechaDiligenciamiento}
                />
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
