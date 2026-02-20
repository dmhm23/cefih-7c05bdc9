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
 * - El bloque de resultado (.resultado-bloque) es prominente y nunca se fragmenta.
 * - La tabla de resumen (.resumen-bloque) tiene espaciado generoso.
 * - Los controles interactivos están ocultos (.screen-only-eval).
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

  .section-group { break-inside: avoid; margin-top: 20px; }

  .section-title { display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #d4d4d4; padding-bottom: 6px; margin-bottom: 14px; }
  .section-title h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }

  .field-cell .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #737373; line-height: 1.2; }
  .field-cell .field-value { font-size: 12px; font-weight: 500; line-height: 1.4; margin-top: 2px; }
  .field-cell .field-empty { color: #a3a3a3; font-style: italic; }
  .field-span { grid-column: span 2; }

  /* ── Bloque de resultado ── */
  .resultado-bloque {
    break-inside: avoid;
    border: 2px solid;
    border-radius: 10px;
    padding: 28px 24px;
    text-align: center;
    margin-bottom: 20px;
  }
  .resultado-bloque.aprobado { border-color: #34d399; background-color: #ecfdf5; }
  .resultado-bloque.no-aprobado { border-color: #f87171; background-color: #fef2f2; }

  .resultado-icono { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
  .resultado-icono.aprobado { color: #059669; }
  .resultado-icono.no-aprobado { color: #dc2626; }

  .resultado-puntaje { font-size: 56px; font-weight: 900; line-height: 1; margin-bottom: 6px; }
  .resultado-puntaje.aprobado { color: #059669; }
  .resultado-puntaje.no-aprobado { color: #dc2626; }

  .resultado-badge {
    display: inline-block;
    padding: 4px 16px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 12px;
  }
  .resultado-badge.aprobado { background: #059669; color: white; }
  .resultado-badge.no-aprobado { background: #dc2626; color: white; }

  .resultado-detalle { font-size: 12px; color: #525252; margin-top: 6px; }

  /* ── Tabla resumen ── */
  .resumen-bloque { break-inside: avoid; }
  .resumen-tabla { width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
  .resumen-tabla tr:nth-child(even) { background: #f9fafb; }
  .resumen-tabla td { padding: 9px 14px; }
  .resumen-tabla .col-label { color: #6b7280; font-weight: 500; width: 55%; }
  .resumen-tabla .col-value { font-weight: 600; }
  .resumen-tabla .col-value.aprobado { color: #059669; }
  .resumen-tabla .col-value.no-aprobado { color: #dc2626; }

  /* ── Bloque pendiente ── */
  .pendiente-bloque {
    break-inside: avoid;
    border: 2px solid #fcd34d;
    border-radius: 10px;
    padding: 28px 24px;
    text-align: center;
    background: #fffbeb;
  }
  .pendiente-titulo { font-size: 15px; font-weight: 700; color: #b45309; margin-bottom: 8px; }
  .pendiente-desc { font-size: 11px; color: #92400e; }

  /* Hide interactive elements when printing */
  .screen-only-eval { display: none !important; }

  /* Show print-only elements */
  .print-only-eval { display: block !important; }

  @media print { 
    body { padding: 5mm; }
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
   * En la futura Vista del Estudiante este mismo callback se reemplazará
   * por el endpoint correspondiente sin tocar EvaluacionReentrenamientoDocument.
   */
  const handleSubmit = useCallback(
    (data: { evaluacionCompletada: boolean; evaluacionPuntaje: number }) => {
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

    // Inyectar clases CSS para el bloque de resultado en el HTML generado,
    // ya que las clases de Tailwind no están disponibles en la ventana de impresión.
    const aprobado =
      matricula.evaluacionCompletada &&
      matricula.evaluacionPuntaje !== undefined &&
      matricula.evaluacionPuntaje !== null &&
      matricula.evaluacionPuntaje >= 70;

    const content = documentRef.current.innerHTML
      // Añadir clase aprobado/no-aprobado al bloque de resultado para los estilos print
      .replace(
        /class="resultado-bloque border-2 rounded-xl[^"]*"/g,
        `class="resultado-bloque ${aprobado ? "aprobado" : "no-aprobado"}"`
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
               * modo="resultados": vista administrativa — muestra solo el bloque
               * consolidado de resultado, sin preguntas ni controles interactivos.
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
