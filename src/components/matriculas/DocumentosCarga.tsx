import { useState, useRef } from "react";
import { Upload, FileCheck, ExternalLink, ChevronDown, ChevronUp, Eye, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { DocumentoRequerido } from "@/types/matricula";
import { cn } from "@/lib/utils";

interface DocumentosCargaProps {
  documentos: DocumentoRequerido[];
  onUpload: (documentoId: string, file: File) => void;
  onUploadConsolidado?: (file: File, tiposIncluidos: string[]) => void;
  onFechaChange?: (documentoId: string, field: string, value: string) => void;
  isUploading?: boolean;
  compact?: boolean;
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-amber-500/10 text-amber-600 border-amber-200",
  cargado: "bg-blue-500/10 text-blue-600 border-blue-200",
  verificado: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  cargado: "Cargado",
  verificado: "Verificado",
};

export function DocumentosCarga({
  documentos,
  onUpload,
  onUploadConsolidado,
  onFechaChange,
  isUploading,
  compact,
}: DocumentosCargaProps) {
  const [consolidado, setConsolidado] = useState(false);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(!compact);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  const completados = documentos.filter((d) => d.estado !== "pendiente").length;
  const total = documentos.length;
  const progress = total > 0 ? (completados / total) * 100 : 0;

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(docId, file);
      showPreview(file);
    }
  };

  const handleConsolidadoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadConsolidado) {
      const tipos = tiposSeleccionados.length > 0 ? tiposSeleccionados : documentos.filter(d => d.estado === "pendiente").map(d => d.tipo);
      onUploadConsolidado(file, tipos);
      showPreview(file);
    }
  };

  const showPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewFile({ url, name: file.name, type: file.type });
  };

  const closePreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
      setPreviewFile(null);
    }
  };

  const toggleTipo = (tipo: string) => {
    setTiposSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const renderFechaFields = (doc: DocumentoRequerido) => {
    if ((doc.tipo !== 'examen_medico' && doc.tipo !== 'arl') || !onFechaChange) return null;
    return (
      <div className="flex gap-2 mt-1">
        {doc.tipo === 'examen_medico' && (
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Fecha examen:</Label>
            <Input type="date" className="h-6 text-xs w-32 px-1"
              value={doc.fechaDocumento || ""}
              onChange={(e) => onFechaChange(doc.id, "fechaDocumento", e.target.value)} />
          </div>
        )}
        {doc.tipo === 'arl' && (
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Inicio cobertura:</Label>
            <Input type="date" className="h-6 text-xs w-32 px-1"
              value={doc.fechaInicioCobertura || ""}
              onChange={(e) => onFechaChange(doc.id, "fechaInicioCobertura", e.target.value)} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{completados}/{total} documentos</span>
          {compact && (
            <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />

      {/* Mode selector - Segmented tabs */}
      {expanded && (
        <div className="space-y-1">
          <div className="inline-flex rounded-lg bg-muted p-1 w-full">
            <button
              type="button"
              onClick={() => setConsolidado(false)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all text-center",
                !consolidado
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              📄 Individual
              <span className="block text-[10px] font-normal opacity-70">Un archivo por documento</span>
            </button>
            <button
              type="button"
              onClick={() => setConsolidado(true)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all text-center",
                consolidado
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              📋 Consolidado
              <span className="block text-[10px] font-normal opacity-70">Varios documentos en un PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Individual mode */}
      {expanded && !consolidado && (
        <div className="space-y-2">
          {documentos.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-2.5 border rounded-lg">
              <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                doc.estado === "verificado" ? "bg-emerald-500/10" :
                doc.estado === "cargado" ? "bg-blue-500/10" : "bg-muted"
              )}>
                <FileCheck className={cn("h-3.5 w-3.5",
                  doc.estado === "verificado" ? "text-emerald-600" :
                  doc.estado === "cargado" ? "text-blue-600" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{doc.nombre}</p>
                  {doc.opcional && <span className="text-xs text-muted-foreground">(opcional)</span>}
                </div>
                {doc.urlDrive && (
                  <a href={doc.urlDrive} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Ver en Drive
                  </a>
                )}
                {renderFechaFields(doc)}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className={cn("text-xs", ESTADO_COLORS[doc.estado])}>
                  {ESTADO_LABELS[doc.estado]}
                </Badge>
                {doc.estado === "pendiente" && (
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(doc.id, e)} disabled={isUploading} />
                    <div className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Upload className="h-3.5 w-3.5" /> Cargar
                    </div>
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Consolidado mode */}
      {expanded && consolidado && (
        <div className="space-y-3 p-3 border rounded-lg">
          <p className="text-sm text-muted-foreground">Seleccione los documentos incluidos en el PDF:</p>
          <div className="space-y-2">
            {documentos.map((doc) => {
              const isPendiente = doc.estado === "pendiente";
              return (
                <div key={doc.id}>
                  <label className={cn("flex items-center gap-2", isPendiente ? "cursor-pointer" : "cursor-default")}>
                    <Checkbox
                      checked={tiposSeleccionados.includes(doc.tipo)}
                      onCheckedChange={() => toggleTipo(doc.tipo)}
                      disabled={!isPendiente}
                    />
                    <span className={cn("text-sm", !isPendiente && "text-muted-foreground")}>{doc.nombre}</span>
                    {!isPendiente && (
                      <Badge variant="outline" className={cn("text-[10px] ml-1", ESTADO_COLORS[doc.estado])}>
                        {ESTADO_LABELS[doc.estado]}
                      </Badge>
                    )}
                  </label>
                  {renderFechaFields(doc)}
                </div>
              );
            })}
          </div>

          {/* Upload always visible */}
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept=".pdf"
              onChange={handleConsolidadoUpload} disabled={isUploading} />
            <Button type="button" variant="outline" size="sm" className="w-full" asChild>
              <span>
                <Upload className="h-3.5 w-3.5 mr-1" />
                Cargar PDF consolidado
                {tiposSeleccionados.length > 0 && ` (${tiposSeleccionados.length} seleccionados)`}
              </span>
            </Button>
          </label>
        </div>
      )}

      {/* File preview */}
      {previewFile && (
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between bg-muted px-3 py-1.5">
            <div className="flex items-center gap-2 text-xs font-medium truncate">
              <Eye className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{previewFile.name}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={closePreview}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {previewFile.type === "application/pdf" ? (
            <iframe src={previewFile.url} className="w-full h-64 border-0" title="Vista previa" />
          ) : previewFile.type.startsWith("image/") ? (
            <img src={previewFile.url} alt="Vista previa" className="w-full max-h-64 object-contain p-2" />
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>{previewFile.name}</p>
              <a href={previewFile.url} download={previewFile.name} className="text-xs text-primary hover:underline mt-1 inline-block">
                Descargar archivo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
