import { useState, useCallback, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileArchive, CheckCircle2, AlertCircle } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";
import { personalService } from "@/services/personalService";
import DynamicFormatoDocument from "@/components/matriculas/formatos/DynamicFormatoDocument";
import type { FormatoFormacion } from "@/types/formatoFormacion";
import type { Persona } from "@/types/persona";
import type { Matricula } from "@/types/matricula";
import type { Curso } from "@/types/curso";
import type { Personal } from "@/types/personal";

// ---------------------------------------------------------------------------
// Print styles (reused from DynamicFormatoPreviewDialog)
// ---------------------------------------------------------------------------
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
  @media print { body { padding: 5mm; } @page { margin: 5mm; } }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 80);
}

/**
 * Renders a React component to static HTML by mounting it in a hidden container,
 * waiting for it to paint, then extracting innerHTML.
 */
function renderToHtml(
  formato: FormatoFormacion,
  persona: Persona,
  matricula: Matricula,
  curso: Curso,
  entrenador: Personal | null,
  supervisor: Personal | null,
): Promise<string> {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    container.style.width = "210mm";
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      <DynamicFormatoDocument
        formato={formato}
        persona={persona}
        matricula={matricula}
        curso={curso}
        entrenador={entrenador}
        supervisor={supervisor}
      />
    );

    // Wait for the component to render
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const html = container.innerHTML;
        root.unmount();
        document.body.removeChild(container);
        resolve(html);
      });
    });
  });
}

function buildHtmlDocument(bodyHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="doc-root">${bodyHtml}</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers to fetch formatos for a course
// ---------------------------------------------------------------------------

async function fetchFormatosForCurso(matriculaId: string): Promise<FormatoFormacion[]> {
  const { data, error } = await supabase.rpc("get_formatos_for_matricula", {
    _matricula_id: matriculaId,
  });
  if (error) throw error;
  if (!data || data.length === 0) return [];

  return (data as any[]).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    codigo: row.codigo,
    version: row.version,
    motorRender: row.motor_render,
    categoria: row.categoria,
    estado: row.estado,
    asignacionScope: row.asignacion_scope,
    nivelFormacionIds: row.niveles_asignados || [],
    bloques: row.bloques || [],
    tokensUsados: row.tokens_usados || [],
    usaEncabezadoInstitucional: row.usa_encabezado_institucional,
    encabezadoConfig: row.encabezado_config,
    requiereFirmaAprendiz: row.requiere_firma_aprendiz,
    requiereFirmaEntrenador: row.requiere_firma_entrenador,
    requiereFirmaSupervisor: row.requiere_firma_supervisor,
    visibleEnMatricula: row.visible_en_matricula,
    visibleEnCurso: row.visible_en_curso,
    visibleEnPortalEstudiante: row.visible_en_portal_estudiante,
    activo: row.activo,
    modoDiligenciamiento: row.modo_diligenciamiento,
    esAutomatico: row.es_automatico,
    documentMeta: row.document_meta,
    legacyComponentId: row.legacy_component_id,
    htmlTemplate: row.html_template,
    cssTemplate: row.css_template,
    plantillaBaseId: row.plantilla_base_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface GenerarPdfsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso: Curso;
  matriculas: Matricula[];
  personas: Persona[];
}

type Phase = "select" | "generating" | "done";

export function GenerarPdfsDialog({
  open,
  onOpenChange,
  curso,
  matriculas,
  personas,
}: GenerarPdfsDialogProps) {
  const [formatos, setFormatos] = useState<FormatoFormacion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingFormatos, setLoadingFormatos] = useState(false);
  const [phase, setPhase] = useState<Phase>("select");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // Load formatos when dialog opens
  const handleOpenChange = useCallback(
    async (isOpen: boolean) => {
      if (isOpen && matriculas.length > 0) {
        setPhase("select");
        setProgress(0);
        setTotal(0);
        setError(null);
        setLoadingFormatos(true);
        try {
          const fmts = await fetchFormatosForCurso(matriculas[0].id);
          setFormatos(fmts);
          setSelectedIds(new Set(fmts.map((f) => f.id)));
        } catch {
          setFormatos([]);
        } finally {
          setLoadingFormatos(false);
        }
      }
      onOpenChange(isOpen);
    },
    [matriculas, onOpenChange]
  );

  const toggleFormat = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === formatos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(formatos.map((f) => f.id)));
    }
  };

  const handleGenerate = useCallback(async () => {
    cancelledRef.current = false;
    const selected = formatos.filter((f) => selectedIds.has(f.id));
    if (selected.length === 0) return;

    const personaMap = new Map(personas.map((p) => [p.id, p]));
    const activeMatriculas = matriculas.filter((m) => personaMap.has(m.personaId));

    const totalItems = selected.length * activeMatriculas.length;
    setTotal(totalItems);
    setProgress(0);
    setPhase("generating");
    setError(null);

    try {
      // Fetch entrenador & supervisor once
      let entrenador: Personal | null = null;
      let supervisor: Personal | null = null;
      try {
        if (curso.entrenadorId) entrenador = await personalService.getById(curso.entrenadorId);
      } catch { /* ignore */ }
      try {
        if (curso.supervisorId) supervisor = await personalService.getById(curso.supervisorId);
      } catch { /* ignore */ }

      const zip = new JSZip();
      let processed = 0;

      for (const formato of selected) {
        const folderName = sanitizeFilename(formato.nombre);
        const folder = zip.folder(folderName)!;

        for (const matricula of activeMatriculas) {
          if (cancelledRef.current) return;

          const persona = personaMap.get(matricula.personaId)!;
          const bodyHtml = await renderToHtml(
            formato,
            persona,
            matricula,
            curso,
            entrenador,
            supervisor,
          );

          const fileName = `${sanitizeFilename(persona.numeroDocumento)}_${sanitizeFilename(persona.apellidos)}_${sanitizeFilename(persona.nombres)}.html`;
          const title = `${formato.nombre} — ${persona.nombres} ${persona.apellidos}`;
          const fullHtml = buildHtmlDocument(bodyHtml, title);

          folder.file(fileName, fullHtml);
          processed++;
          setProgress(processed);
        }
      }

      if (cancelledRef.current) return;

      const blob = await zip.generateAsync({ type: "blob" });
      const zipName = `Curso_${sanitizeFilename(curso.numeroCurso)}_Formatos.zip`;
      saveAs(blob, zipName);
      setPhase("done");
    } catch (err: any) {
      setError(err.message || "Error desconocido al generar los documentos");
      setPhase("done");
    }
  }, [formatos, selectedIds, matriculas, personas, curso]);

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={phase === "generating" ? undefined : handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {phase === "select" && "Generar documentos en lote"}
            {phase === "generating" && "Generando documentos…"}
            {phase === "done" && "Generación completada"}
          </DialogTitle>
        </DialogHeader>

        {/* Phase: SELECT */}
        {phase === "select" && (
          <div className="space-y-4 py-2">
            {loadingFormatos ? (
              <div className="flex items-center gap-2 py-8 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Cargando formatos…</span>
              </div>
            ) : formatos.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm">No hay formatos aplicables a este curso.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Selecciona los formatos a generar para los <strong>{matriculas.length}</strong> estudiante(s) inscritos.
                  Se descargará un archivo ZIP con documentos HTML listos para imprimir como PDF.
                </p>

                <div className="flex items-center gap-2 border-b pb-2">
                  <Checkbox
                    checked={selectedIds.size === formatos.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">Seleccionar todos</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedIds.size} de {formatos.length}
                  </Badge>
                </div>

                <ScrollArea className="max-h-56">
                  <div className="space-y-2">
                    {formatos.map((f) => (
                      <label
                        key={f.id}
                        className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedIds.has(f.id)}
                          onCheckedChange={() => toggleFormat(f.id)}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">{f.nombre}</p>
                          <p className="text-xs text-muted-foreground">{f.codigo} — v{f.version}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}

        {/* Phase: GENERATING */}
        {phase === "generating" && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Procesando {progress} de {total}…
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        )}

        {/* Phase: DONE */}
        {phase === "done" && (
          <div className="space-y-3 py-4">
            {error ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">
                  {total} documento(s) generados y descargados como ZIP.
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {phase === "select" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={selectedIds.size === 0 || matriculas.length === 0}
              >
                <FileArchive className="h-4 w-4 mr-1" />
                Generar ZIP ({selectedIds.size} × {matriculas.length})
              </Button>
            </>
          )}
          {phase === "generating" && (
            <Button
              variant="outline"
              onClick={() => {
                cancelledRef.current = true;
                setPhase("select");
              }}
            >
              Cancelar
            </Button>
          )}
          {phase === "done" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
