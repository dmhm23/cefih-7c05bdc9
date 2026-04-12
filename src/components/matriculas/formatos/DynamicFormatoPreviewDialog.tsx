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
import { useFormatoRespuesta, useSaveFormatoRespuesta } from "@/hooks/useFormatoRespuestas";
import { useToast } from "@/hooks/use-toast";
import type { FormatoFormacion } from "@/types/formatoFormacion";
import type { Persona } from "@/types/persona";
import type { Matricula } from "@/types/matricula";
import type { Curso } from "@/types/curso";

const PRINT_STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; padding: 6mm; font-size: 12px; }
  .doc-root { max-width: 210mm; margin: 0 auto; padding: 16px; background: white; }
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
  .section-title { display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #d4d4d4; padding-bottom: 4px; margin-bottom: 10px; margin-top: 18px; }
  .section-title h2 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #d4d4d4; padding: 4px 8px; font-size: 11px; }
  @media print { body { padding: 5mm; } }
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

  const handlePrint = useCallback(() => {
    if (!documentRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    const clone = documentRef.current.cloneNode(true) as HTMLElement;
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
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
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
