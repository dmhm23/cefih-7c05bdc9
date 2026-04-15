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
import type { FormatoFormacion } from "@/types/formatoFormacion";

const PRINT_STYLES = `
  @page { size: A4 portrait; margin: 12mm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 0; font-size: 12px; line-height: 1.5; }
  .doc-root { max-width: 210mm; margin: 0 auto; padding: 24px; background: white; }

  /* Grid layout */
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .gap-x-6 { column-gap: 24px; }
  .gap-y-2 { row-gap: 8px; }
  .mt-4 { margin-top: 16px; }
  .mt-3 { margin-top: 12px; }
  .mt-5 { margin-top: 20px; }
  .mb-2 { margin-top: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .p-6 { padding: 24px; }
  .p-2 { padding: 8px; }

  /* Field cells */
  .field-cell { padding: 4px 0; }
  .field-cell p:first-child { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; line-height: 1.3; margin-bottom: 2px; }
  .field-cell p:nth-child(2), .field-cell .text-sm { font-size: 13px; font-weight: 500; line-height: 1.4; color: #1a1a1a; }

  /* Section titles */
  .section-title { border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px; }
  .section-title h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #1a1a1a; }

  /* Headings */
  h3 { color: #1a1a1a; }
  .text-lg { font-size: 18px; }
  .text-base { font-size: 14px; }

  /* Typography / prose for paragraphs */
  .prose { color: #1a1a1a; }
  .prose ul { list-style-type: disc; padding-left: 20px; margin: 6px 0; }
  .prose ol { list-style-type: decimal; padding-left: 20px; margin: 6px 0; }
  .prose li { margin-bottom: 2px; font-size: 12px; }
  .prose p { margin-bottom: 4px; font-size: 12px; line-height: 1.6; }
  .prose strong, .prose b { font-weight: 700; }
  .prose em, .prose i { font-style: italic; }

  /* Span helpers */
  [style*="grid-column: span 2"] { grid-column: span 2; }

  /* Tables */
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d4d4d4; padding: 4px 8px; font-size: 11px; }
  th { font-weight: 600; text-align: left; background: #fafafa; }
  thead tr { border-bottom: 2px solid #d4d4d4; }

  /* Radio circles */
  .flex { display: flex; }
  .flex-wrap { flex-wrap: wrap; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .gap-1 { gap: 4px; }
  .gap-1\\.5 { gap: 6px; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .gap-4 { gap: 16px; }
  .text-xs { font-size: 12px; }
  .text-sm { font-size: 13px; }
  .font-semibold { font-weight: 600; }
  .font-medium { font-weight: 500; }
  .font-bold { font-weight: 700; }
  .italic { font-style: italic; }

  /* Radio / checkbox visual */
  .h-3 { height: 12px; }
  .w-3 { width: 12px; }
  .h-3\\.5 { height: 14px; }
  .w-3\\.5 { width: 14px; }
  .h-4 { height: 16px; }
  .w-4 { width: 16px; }
  .rounded-full { border-radius: 9999px; }
  .rounded-sm { border-radius: 2px; }
  .rounded { border-radius: 4px; }
  .border { border: 1px solid #d4d4d4; }
  .border-2 { border: 2px solid #d4d4d4; }
  .border-dashed { border-style: dashed; }
  .bg-foreground { background-color: #1a1a1a; }
  .text-background svg { color: white; }
  .shrink-0 { flex-shrink: 0; }
  .mx-auto { margin-left: auto; margin-right: auto; }

  /* Signature box */
  .h-24 { height: 96px; }
  .flex-col { flex-direction: column; }

  /* Divider */
  hr { border: none; border-top: 2px solid #e5e5e5; margin: 8px 0; }

  /* Lists outside prose */
  .list-disc { list-style-type: disc; }
  .list-inside { list-style-position: inside; }
  .space-y-0\\.5 > * + * { margin-top: 2px; }
  .space-y-3 > * + * { margin-top: 12px; }

  /* Text alignment */
  .text-justify { text-align: justify; }
  .text-center { text-align: center; }
  .text-left { text-align: left; }

  /* Hide auto badges in print */
  .inline-flex.items-center.rounded-full { display: none; }

  /* Document header grid */
  .doc-header-grid { display: grid; grid-template-columns: auto 1fr auto; }
  .doc-header-grid > div { border: 1px solid #9ca3af; padding: 6px 10px; }

  /* Badge hide */
  .bg-blue-50 { display: none; }

  /* Misc */
  .leading-relaxed { line-height: 1.6; }
  .leading-snug { line-height: 1.4; }
  .leading-tight { line-height: 1.3; }
  .uppercase { text-transform: uppercase; }
  .tracking-wide { letter-spacing: 0.05em; }
  .w-full { width: 100%; }

  @media print {
    body { padding: 0; }
    .doc-root { padding: 0; box-shadow: none; border: none; }
  }
`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formato: Partial<FormatoFormacion>;
}

export default function FormatoPreviewDialog({ open, onOpenChange, formato }: Props) {
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