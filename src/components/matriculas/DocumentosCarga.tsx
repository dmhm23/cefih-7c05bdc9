import { useState } from "react";
import { Upload, FileCheck, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

  const completados = documentos.filter((d) => d.estado !== "pendiente").length;
  const total = documentos.length;
  const progress = total > 0 ? (completados / total) * 100 : 0;

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(docId, file);
  };

  const handleConsolidadoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadConsolidado && tiposSeleccionados.length > 0) {
      onUploadConsolidado(file, tiposSeleccionados);
    }
  };

  const toggleTipo = (tipo: string) => {
    setTiposSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{consolidado ? "Consolidado" : "Individual"}</span>
          <Switch checked={consolidado} onCheckedChange={setConsolidado} />
        </div>
      </div>
      <Progress value={progress} className="h-1.5" />

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
                {(doc.tipo === 'examen_medico' || doc.tipo === 'arl') && onFechaChange && (
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
                )}
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

      {expanded && consolidado && (
        <div className="space-y-3 p-3 border rounded-lg">
          <p className="text-sm text-muted-foreground">Seleccione los documentos incluidos en el PDF:</p>
          <div className="space-y-2">
            {documentos.filter(d => d.estado === "pendiente").map((doc) => (
              <label key={doc.id} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={tiposSeleccionados.includes(doc.tipo)}
                  onCheckedChange={() => toggleTipo(doc.tipo)} />
                <span className="text-sm">{doc.nombre}</span>
              </label>
            ))}
          </div>
          {tiposSeleccionados.length > 0 && (
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept=".pdf"
                onChange={handleConsolidadoUpload} disabled={isUploading} />
              <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                <span>
                  <Upload className="h-3.5 w-3.5 mr-1" />
                  Cargar PDF consolidado ({tiposSeleccionados.length} docs)
                </span>
              </Button>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
