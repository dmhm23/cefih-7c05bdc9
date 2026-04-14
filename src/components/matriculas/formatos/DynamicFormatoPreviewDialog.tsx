import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Save, Pencil, Eye } from "lucide-react";
import DynamicFormatoDocument from "./DynamicFormatoDocument";
import { usePersonal } from "@/hooks/usePersonal";
import { useFormatoRespuesta, useFormatoRespuestas, useSaveFormatoRespuesta } from "@/hooks/useFormatoRespuestas";
import { useNivelFormacion } from "@/hooks/useNivelesFormacion";
import { firmaMatriculaService } from "@/services/firmaMatriculaService";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { FormatoFormacion } from "@/types/formatoFormacion";
import type { Persona } from "@/types/persona";
import type { Matricula } from "@/types/matricula";
import type { Curso } from "@/types/curso";

const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 6mm; font-size: 12px; }

  /* ── Main document root ── */
  .doc-root { max-width: 210mm; margin: 0 auto; padding: 24px; background: white; font-size: 12px; }

  /* ── DocumentHeader (inline styles handle most, but print CSS backs up) ── */
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

  /* ── Tailwind layout replicas ── */
  .bg-white { background: white; }
  .p-6 { padding: 24px; }
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: 1fr 1fr; }
  .gap-x-6 { column-gap: 24px; }
  .gap-y-2 { row-gap: 8px; }
  .mt-2 { margin-top: 8px; }
  .mt-3 { margin-top: 12px; }
  .mt-4 { margin-top: 16px; }
  .mt-5 { margin-top: 20px; }
  .mb-2 { margin-top: 8px; }
  .mb-3 { margin-bottom: 12px; }
  .pb-1 { padding-bottom: 4px; }
  .p-2 { padding: 8px; }
  .p-3 { padding: 12px; }
  .p-4 { padding: 16px; }
  .px-2 { padding-left: 8px; padding-right: 8px; }
  .px-3 { padding-left: 12px; padding-right: 12px; }
  .px-4 { padding-left: 16px; padding-right: 16px; }
  .py-1 { padding-top: 4px; padding-bottom: 4px; }
  .py-2 { padding-top: 8px; padding-bottom: 8px; }
  .pl-2 { padding-left: 8px; }
  .space-y-1 > * + * { margin-top: 4px; }
  .space-y-2 > * + * { margin-top: 8px; }
  .space-y-3 > * + * { margin-top: 12px; }
  .space-y-4 > * + * { margin-top: 16px; }
  .flex { display: flex; }
  .flex-1 { flex: 1; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-center { justify-content: center; }
  .justify-between { justify-content: space-between; }
  .gap-1 { gap: 4px; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .gap-4 { gap: 16px; }
  .shrink-0 { flex-shrink: 0; }
  .w-full { width: 100%; }
  .h-24 { height: 96px; }
  .max-h-16 { max-height: 64px; }
  .w-5 { width: 20px; }
  .h-5 { height: 20px; }
  .w-6 { width: 24px; }
  .h-6 { height: 24px; }
  .h-4 { width: 16px; height: 16px; }
  .w-4 { width: 16px; }
  .h-3\\.5 { height: 14px; }
  .w-3\\.5 { width: 14px; }

  /* ── Typography ── */
  .text-\\[8px\\] { font-size: 8px; }
  .text-\\[9px\\] { font-size: 9px; }
  .text-\\[10px\\] { font-size: 10px; }
  .text-xs { font-size: 12px; }
  .text-sm { font-size: 14px; }
  .text-base { font-size: 16px; }
  .text-lg { font-size: 18px; }
  .font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }
  .uppercase { text-transform: uppercase; }
  .italic { font-style: italic; }
  .leading-tight { line-height: 1.25; }
  .leading-snug { line-height: 1.375; }
  .leading-relaxed { line-height: 1.625; }
  .tracking-wide { letter-spacing: 0.025em; }
  .tracking-\\[0\\.1em\\] { letter-spacing: 0.1em; }
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-justify { text-align: justify; }
  .whitespace-pre-wrap { white-space: pre-wrap; }
  .underline { text-decoration: underline; }

  /* ── Colors (resolve CSS vars to real values) ── */
  .text-muted-foreground { color: #6b7280; }
  .text-muted-foreground\\/60 { color: rgba(107, 114, 128, 0.6); }
  .text-red-700 { color: #b91c1c; }
  .text-emerald-700 { color: #047857; }
  .text-blue-700 { color: #1d4ed8; }
  .text-primary-foreground { color: white; }

  /* ── Borders & Backgrounds ── */
  .border { border: 1px solid #e5e7eb; }
  .border-2 { border: 2px solid #e5e7eb; }
  .border-b { border-bottom: 1px solid #e5e7eb; }
  .border-border { border-color: #e5e7eb; }
  .border-border\\/50 { border-color: rgba(229, 231, 235, 0.5); }
  .border-dashed { border-style: dashed; }
  .border-muted { border-color: #e5e7eb; }
  .border-muted-foreground\\/40 { border-color: rgba(107, 114, 128, 0.4); }
  .border-primary { border-color: #2563eb; }
  .border-red-300 { border-color: #fca5a5; }
  .border-red-500 { border-color: #ef4444; }
  .border-emerald-300 { border-color: #6ee7b7; }
  .border-emerald-500 { border-color: #10b981; }
  .border-blue-200 { border-color: #bfdbfe; }
  .rounded { border-radius: 4px; }
  .rounded-lg { border-radius: 8px; }
  .rounded-full { border-radius: 9999px; }
  .bg-background { background: white; }
  .bg-white { background: white; }
  .bg-primary { background: #2563eb; }
  .bg-primary\\/5 { background: rgba(37, 99, 235, 0.05); }
  .bg-primary\\/10 { background: rgba(37, 99, 235, 0.1); }
  .bg-red-50 { background: #fef2f2; }
  .bg-red-100 { background: #fee2e2; }
  .bg-emerald-50 { background: #ecfdf5; }
  .bg-emerald-50\\/50 { background: rgba(236, 253, 245, 0.5); }
  .bg-emerald-100 { background: #d1fae5; }
  .bg-blue-50 { background: #eff6ff; }
  .object-contain { object-fit: contain; }

  /* ── Tables ── */
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #e5e7eb; padding: 4px 8px; font-size: 11px; }
  th { font-weight: 600; }
  .border-collapse { border-collapse: collapse; }
  .overflow-x-auto { overflow-x: auto; }
  .w-1\\/3 { width: 33.333%; }

  /* ── Field cells ── */
  .field-cell { padding: 4px 0; }
  .field-cell p:first-child { font-size: 9px; text-transform: uppercase; letter-spacing: 0.025em; color: #6b7280; line-height: 1.25; display: flex; align-items: center; gap: 4px; }
  .field-cell p:last-child { font-size: 14px; font-weight: 500; line-height: 1.375; }
  .field-span { grid-column: span 2; }

  /* ── Section titles ── */
  .section-title { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 20px; margin-bottom: 12px; }
  .section-title h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

  /* ── Signature boxes ── */
  .border-2.border-dashed { border: 2px dashed #e5e7eb; border-radius: 4px; height: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; }

  /* ── Inline badge (auto) ── */
  .inline-flex { display: inline-flex; }
  .inline-flex.items-center { align-items: center; }

  /* ── Checkbox (data authorization) ── */
  button[role="checkbox"], [data-state] { width: 16px; height: 16px; border: 2px solid #e5e7eb; border-radius: 3px; display: inline-flex; align-items: center; justify-content: center; background: white; }
  button[role="checkbox"][data-state="checked"], [data-state="checked"] { background: #2563eb; border-color: #2563eb; color: white; }

  /* ── List ── */
  .list-disc { list-style-type: disc; }
  .list-inside { list-style-position: inside; }

  /* ── Details/summary ── */
  details { font-size: 12px; color: #6b7280; }
  summary { cursor: pointer; text-decoration: underline; }

  /* ── Print-specific ── */
  @media print { body { padding: 5mm; } }
  input, button { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
`;

/**
 * Build initial answers for health_consent blocks from matrícula data.
 * This pre-fills the consentimiento de salud so the user sees existing data.
 */
function buildInitialHealthAnswers(
  formato: FormatoFormacion,
  matricula: Matricula
): Record<string, unknown> {
  const initial: Record<string, unknown> = {};
  const healthBlocks = formato.bloques.filter((b) => b.type === 'health_consent');

  for (const bloque of healthBlocks) {
    const prefix = bloque.id;
    // Map matrícula fields to health_consent question IDs
    const mapping: Record<string, { value: boolean; detail?: string }> = {
      restriccionMedica: {
        value: !!matricula.restriccionMedica,
        detail: matricula.restriccionMedicaDetalle || '',
      },
      alergias: {
        value: !!matricula.alergias,
        detail: matricula.alergiasDetalle || '',
      },
      consumoMedicamentos: {
        value: !!matricula.consumoMedicamentos,
        detail: matricula.consumoMedicamentosDetalle || '',
      },
      embarazo: {
        value: !!matricula.embarazo,
      },
      lectoescritura: {
        value: !!matricula.nivelLectoescritura,
      },
    };

    for (const [qId, data] of Object.entries(mapping)) {
      initial[`${prefix}_${qId}`] = data.value;
      if (data.detail) {
        initial[`${prefix}_${qId}_detalle`] = data.detail;
      }
    }
  }

  // Also pre-fill data_authorization from matrícula
  const authBlocks = formato.bloques.filter((b) => b.type === 'data_authorization');
  for (const bloque of authBlocks) {
    initial[`${bloque.id}_authorized`] = !!matricula.autorizacionDatos;
  }

  return initial;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formato: FormatoFormacion | null;
  persona: Persona | null;
  matricula: Matricula;
  curso: Curso | null;
}

export default function DynamicFormatoPreviewDialog({
  open,
  onOpenChange,
  formato,
  persona,
  matricula,
  curso,
}: Props) {
  const documentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: entrenador } = usePersonal(curso?.entrenadorId || "");
  const { data: supervisor } = usePersonal(curso?.supervisorId || "");
  const { data: nivelFormacion } = useNivelFormacion(curso?.nivelFormacionId || "");

  // Load saved answers
  const { data: savedRespuesta } = useFormatoRespuesta(
    open ? matricula.id : undefined,
    open ? formato?.id : undefined
  );
  const saveMutation = useSaveFormatoRespuesta();

  const [editMode, setEditMode] = useState(false);
  const [localAnswers, setLocalAnswers] = useState<Record<string, unknown>>({});

  // Build initial answers from matrícula data for health/authorization blocks
  const initialFromMatricula = useMemo(() => {
    if (!formato) return {};
    return buildInitialHealthAnswers(formato, matricula);
  }, [formato?.id, matricula.id]);

  // Sync saved answers when loaded — merge matrícula defaults with saved answers
  useEffect(() => {
    if (savedRespuesta?.answers && Object.keys(savedRespuesta.answers).length > 0) {
      // Saved answers take precedence over matrícula defaults
      setLocalAnswers({ ...initialFromMatricula, ...(savedRespuesta.answers as Record<string, unknown>) });
    } else {
      // No saved answers yet — use matrícula defaults
      setLocalAnswers(initialFromMatricula);
    }
    setEditMode(false);
  }, [savedRespuesta, formato?.id, initialFromMatricula]);

  const handleAnswerChange = useCallback((key: string, value: unknown) => {
    setLocalAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async (estado: 'pendiente' | 'completado' = 'pendiente') => {
    if (!formato) return;
    try {
      await saveMutation.mutateAsync({
        matriculaId: matricula.id,
        formatoId: formato.id,
        answers: localAnswers,
        estado,
      });
      toast({ title: estado === 'completado' ? "Formato completado" : "Borrador guardado" });
      if (estado === 'completado') setEditMode(false);
    } catch (e: any) {
      console.error('Error saving formato respuesta:', e);
      toast({ title: "Error al guardar", description: e?.message || "Intente nuevamente", variant: "destructive" });
    }
  }, [formato, matricula.id, localAnswers, saveMutation, toast]);

  const handlePrint = useCallback(async () => {
    if (!documentRef.current) return;
    const clone = documentRef.current.cloneNode(true) as HTMLElement;

    // Convert external images (logo) to inline data URIs so they render in the print window
    const images = clone.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(async (img) => {
        const src = img.src;
        if (!src || src.startsWith("data:")) return; // already inline
        try {
          const resp = await fetch(src);
          const blob = await resp.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
        } catch {
          // leave original src
        }
      })
    );

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const filename = `${formato?.nombre || "formato"}-preview.pdf`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-{2,}/g, "-");

    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>${filename}</title><style>${PRINT_STYLES}</style></head><body><div class="doc-root">${clone.innerHTML}</div></body></html>`
    );
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 400);
  }, [formato?.nombre]);

  if (!formato) return null;

  const isCompleted = savedRespuesta?.estado === 'completado';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Vista Previa — {formato.nombre}</DialogTitle>
            <div className="flex gap-2">
              {!editMode ? (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" onClick={handlePrint}>
                    <Download className="h-4 w-4 mr-1" />
                    Descargar PDF
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Vista previa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSave('pendiente')}
                    disabled={saveMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Guardar borrador
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSave('completado')}
                    disabled={saveMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Completar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 bg-muted/30 min-h-full flex justify-center">
            <div
              ref={documentRef}
              className="shadow-lg rounded border bg-white w-full"
              style={{ maxWidth: "210mm" }}
            >
              <DynamicFormatoDocument
                formato={formato}
                persona={persona}
                matricula={matricula}
                curso={curso}
                entrenador={entrenador ?? null}
                supervisor={supervisor ?? null}
                nivelFormacionNombre={nivelFormacion?.nombreNivel ?? null}
                answers={localAnswers}
                onAnswerChange={editMode ? handleAnswerChange : undefined}
                readOnly={!editMode}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
