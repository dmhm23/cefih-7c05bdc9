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
import { toast } from "sonner";

import EvaluacionReentrenamientoDocument from "./EvaluacionReentrenamientoDocument";
import { useUpdateMatricula } from "@/hooks/useMatriculas";
import { Persona } from "@/types/persona";
import { Matricula } from "@/types/matricula";
import { Curso } from "@/types/curso";

function buildPdfFilename(persona: Persona | null): string {
  const parts = [
    "evaluacion-reentrenamiento",
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

/**
 * PRINT_STYLES para modo="resultados":
 * - Bloque compacto de resultado (.resultado-compacto) nunca se fragmenta.
 * - Tabla de preguntas (.tabla-preguntas) con separadores claros y legibles.
 * - Encuesta de satisfacción con mismo estilo de tabla.
 * - Íconos check/X representados con caracteres Unicode como fallback de impresión.
 */
const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 10mm; font-size: 12px; }
  
  .doc-root { max-width: 210mm; margin: 0 auto; position: relative; padding: 16px; background: white; }

  /* Document Header */
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

  .section-group { break-inside: avoid; margin-top: 24px; }

  .section-title { display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #d4d4d4; padding-bottom: 6px; margin-bottom: 14px; }
  .section-title h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }

  .field-cell .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; line-height: 1.2; }
  .field-cell .field-value { font-size: 12px; font-weight: 500; line-height: 1.4; margin-top: 2px; }
  .field-cell .field-empty { color: #a3a3a3; font-style: italic; }
  .field-span { grid-column: span 2; }

  /* ── Bloque compacto de resultado ── */
  .resultado-compacto {
    break-inside: avoid;
    display: grid;
    grid-template-columns: 1fr 1fr;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 0;
  }
  .resultado-compacto > div { padding: 10px 16px; }
  .resultado-compacto > div:nth-child(odd) { border-right: 1px solid #e5e7eb; background: #f9fafb; }
  .resultado-compacto > div:nth-child(1),
  .resultado-compacto > div:nth-child(2) { border-bottom: 1px solid #e5e7eb; }

  .resultado-ratio { font-size: 22px; font-weight: 700; line-height: 1.1; }
  .resultado-ratio.aprobado { color: #059669; }
  .resultado-ratio.no-aprobado { color: #dc2626; }

  .resultado-pct { font-size: 11px; color: #737373; margin-top: 2px; }

  .resultado-badge-print {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    margin-left: 10px;
  }
  .resultado-badge-print.aprobado { background: #059669; color: white; }
  .resultado-badge-print.no-aprobado { background: #dc2626; color: white; }

  .resultado-detalle { font-size: 12px; color: #525252; }

  /* ── Bloque pendiente ── */
  .resultado-bloque {
    break-inside: avoid;
    border: 2px solid #fcd34d;
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    background: #fffbeb;
  }
  .pendiente-titulo { font-size: 14px; font-weight: 700; color: #b45309; margin-bottom: 6px; }
  .pendiente-desc { font-size: 11px; color: #92400e; }

  /* ── Tabla de preguntas y encuesta ── */
  .tabla-preguntas {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
    break-inside: auto;
  }
  .tabla-preguntas thead tr { border-bottom: 2px solid #d4d4d4; }
  .tabla-preguntas thead th {
    padding-bottom: 6px;
    text-align: left;
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #737373;
  }
  .tabla-preguntas thead th:last-child { text-align: center; }
  .tabla-preguntas tbody tr { border-bottom: 1px solid #f0f0f0; break-inside: avoid; }
  .tabla-preguntas tbody tr:last-child { border-bottom: none; }
  .tabla-preguntas td { padding: 7px 4px; vertical-align: top; line-height: 1.4; }
  .tabla-preguntas td:first-child { color: #737373; width: 24px; }
  .tabla-preguntas td:nth-child(2) { padding-right: 12px; }
  .tabla-preguntas td:last-child { text-align: center; width: 40px; }

  /* Unicode fallback para íconos en print */
  .icon-check::before { content: "✓"; color: #059669; font-weight: 700; font-size: 14px; }
  .icon-x::before { content: "✗"; color: #dc2626; font-weight: 700; font-size: 14px; }
  .icon-clock::before { content: "⏳"; font-size: 13px; }

  /* Ocultar íconos SVG en print — usar fallback text */
  .tabla-preguntas svg { display: none; }

  /* Respuesta incorrecta */
  .resp-incorrecta { color: #b91c1c; }

  /* Pendiente encuesta */
  .encuesta-pendiente {
    border: 1px solid #fcd34d;
    background: #fffbeb;
    border-radius: 6px;
    padding: 10px 14px;
    font-size: 11px;
    color: #92400e;
  }

  /* Hide interactive elements when printing */
  .screen-only-eval { display: none !important; }

  /* Show print-only elements */
  .print-only-eval { display: block !important; }

  @media print { 
    body { padding: 5mm; }
    .section-group { break-inside: avoid; }
  }
`;

export default function EvaluacionReentrenamientoPreviewDialog({
  open,
  onOpenChange,
  persona,
  matricula,
  curso,
}: Props) {
  const documentRef = useRef<HTMLDivElement>(null);
  const updateMatricula = useUpdateMatricula();

  const pdfFilename = buildPdfFilename(persona);

  /**
   * Callback desacoplado — conecta el renderer al hook de actualización.
   * Incluye evaluacionRespuestas y encuestaRespuestas para persistencia completa.
   */
  const handleSubmit = useCallback(
    (data: {
      evaluacionCompletada: boolean;
      evaluacionPuntaje: number;
      evaluacionRespuestas: number[];
      encuestaRespuestas: string[];
    }) => {
      updateMatricula.mutate(
        { id: matricula.id, data },
        {
          onSuccess: () => {
            toast.success(
              data.evaluacionPuntaje >= 70
                ? `¡Evaluación aprobada! Puntaje: ${data.evaluacionPuntaje}%`
                : `Evaluación enviada. Puntaje: ${data.evaluacionPuntaje}% — No aprobado`
            );
          },
          onError: () => {
            toast.error("Error al guardar la evaluación. Intente nuevamente.");
          },
        }
      );
    },
    [matricula.id, updateMatricula]
  );

  const handlePrint = useCallback(() => {
    if (!documentRef.current) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const aprobado =
      matricula.evaluacionCompletada &&
      matricula.evaluacionPuntaje !== undefined &&
      matricula.evaluacionPuntaje !== null &&
      matricula.evaluacionPuntaje >= 70;

    const correctas = aprobado && matricula.evaluacionPuntaje
      ? Math.round((matricula.evaluacionPuntaje * 15) / 100)
      : 0;

    // Transformar el innerHTML para el print:
    // 1. Ajustar clases del bloque compacto de resultado para estilos print
    // 2. Reemplazar íconos SVG de check/X con fallbacks Unicode
    let content = documentRef.current.innerHTML;

    // Reemplazar íconos SVG en tabla por spans con clase
    content = content
      .replace(
        /<svg[^>]*class="[^"]*text-emerald-600[^"]*"[^>]*>.*?<\/svg>/gs,
        '<span class="icon-check"></span>'
      )
      .replace(
        /<svg[^>]*class="[^"]*text-destructive[^"]*"[^>]*>.*?<\/svg>/gs,
        '<span class="icon-x"></span>'
      );

    // Inyectar clase aprobado/no-aprobado en el ratio de resultado para estilos print
    content = content
      .replace(
        /class="resultado-ratio([^"]*)"/g,
        `class="resultado-ratio${aprobado ? " aprobado" : " no-aprobado"}$1"`
      )
      .replace(
        /class="resultado-badge-print([^"]*)"/g,
        `class="resultado-badge-print${aprobado ? " aprobado" : " no-aprobado"}$1"`
      );

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
  }, [pdfFilename, matricula.evaluacionCompletada, matricula.evaluacionPuntaje]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Vista Previa — Evaluación Reentrenamiento (FIH04-019)</DialogTitle>
            <Button size="sm" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-1" />
              Descargar PDF
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-2 bg-muted/30 min-h-full">
            <div ref={documentRef} className="shadow-lg rounded border">
              {/*
               * modo="resultados": vista administrativa — bloque compacto de resultado,
               * tabla de preguntas/respuestas y encuesta de satisfacción en solo lectura.
               * La futura Vista del Estudiante usará modo="diligenciamiento".
               */}
              <EvaluacionReentrenamientoDocument
                persona={persona}
                matricula={matricula}
                curso={curso}
                modo="resultados"
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
