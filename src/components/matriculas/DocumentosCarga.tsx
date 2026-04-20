import { useState, useEffect, useMemo } from "react";
import { Upload, FileCheck, ChevronDown, ChevronUp, Eye, FileText, Loader2, MoreHorizontal, Trash2, Info, Files, Lock } from "lucide-react";
import { FileDropZone } from "@/components/shared/FileDropZone";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DateField } from "@/components/shared/DateField";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ArchivoPreviewDialog } from "@/components/cartera/ArchivoPreviewDialog";
import { DocumentoRequerido } from "@/types/matricula";
import { parseConsolidadoTipos } from "@/hooks/useMatriculas";
import { driveService } from "@/services/driveService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface DocumentosCargaProps {
  documentos: DocumentoRequerido[];
  onUpload: (documentoId: string, file: File) => void;
  onDelete?: (documentoId: string) => void;
  /** Sube un PDF consolidado. Recibe el archivo, los ids ignorados (compat) y los tipos cubiertos. */
  onUploadConsolidado?: (file: File, documentosIds: string[], tiposIncluidos: string[]) => void | Promise<void>;
  /** Borra el consolidado: una sola fila tipo='consolidado' + blob. */
  onDeleteConsolidado?: (consolidadoId: string, storagePath?: string | null) => void | Promise<void>;
  onFechaChange?: (documentoId: string, field: string, value: string) => void;
  isUploading?: boolean;
  compact?: boolean;
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-amber-500/10 text-amber-600 border-amber-200",
  cargado: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
};

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  cargado: "Cargado",
};

type LocalBlob = { url: string; name: string; type: string; size: number };

export function DocumentosCarga({
  documentos,
  onUpload,
  onDelete,
  onUploadConsolidado,
  onDeleteConsolidado,
  onFechaChange,
  isUploading,
  compact,
}: DocumentosCargaProps) {
  const [consolidado, setConsolidado] = useState(false);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(!compact);
  // Blobs locales (pre-refresh) para preview inmediato
  const [localBlobs, setLocalBlobs] = useState<Record<string, LocalBlob>>({});
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  // Vista previa modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  // Confirmaciones
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<DocumentoRequerido | null>(null);
  const [confirmDeleteConsolidado, setConfirmDeleteConsolidado] = useState<{
    id: string;
    storagePath?: string | null;
    nombre?: string;
    tipos: string[];
  } | null>(null);

  // ── Derivados del modelo nuevo ──────────────────────────────────────────
  // Filas individuales: todas las que no son tipo 'consolidado'
  const docsIndividuales = useMemo(
    () => documentos.filter((d) => d.tipo !== "consolidado"),
    [documentos],
  );

  // Fila consolidado activa (tipo='consolidado' && estado='cargado')
  const consolidadoRow = useMemo(
    () =>
      documentos.find(
        (d) => d.tipo === "consolidado" && d.estado === "cargado" && d.urlDrive,
      ),
    [documentos],
  );

  // Tipos cubiertos por el consolidado activo
  const tiposCubiertos = useMemo(
    () => parseConsolidadoTipos(consolidadoRow?.nombre),
    [consolidadoRow],
  );

  /** Un requisito individual está "completado" si su fila está cargada o si su tipo está cubierto por el consolidado. */
  const isDocCompletado = (doc: DocumentoRequerido): boolean => {
    if (doc.estado === "cargado") return true;
    if (consolidadoRow && tiposCubiertos.includes(doc.tipo)) return true;
    return false;
  };

  const completados = docsIndividuales.filter(isDocCompletado).length;
  const total = docsIndividuales.length;
  const progress = total > 0 ? (completados / total) * 100 : 0;

  // Sincronizar blobs locales: limpiar los de docs que ya no están cargados
  useEffect(() => {
    setLocalBlobs((prev) => {
      const next: Record<string, LocalBlob> = {};
      for (const [key, data] of Object.entries(prev)) {
        // Si la clave es un doc.id que volvió a 'pendiente', dropear
        const doc = documentos.find((d) => d.id === key);
        if (doc && doc.estado === "pendiente") continue;
        // Si la clave es 'consolidado' y ya no hay consolidadoRow, dropear
        if (key === "__consolidado__" && !consolidadoRow) continue;
        next[key] = data;
      }
      return next;
    });
  }, [documentos, consolidadoRow]);

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`El archivo excede el tamaño máximo de ${formatFileSize(MAX_FILE_SIZE)}`);
      return false;
    }
    return true;
  };

  const storeBlob = (key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLocalBlobs((prev) => ({
        ...prev,
        [key]: { url: dataUrl, name: file.name, type: file.type, size: file.size },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFileSize(file)) return;
    storeBlob(docId, file);
    setUploadingDocId(docId);
    onUpload(docId, file);
    setTimeout(() => setUploadingDocId(null), 1200);
  };

  /** Abre el modal de vista previa. Usa blob local si existe, si no genera signed URL. */
  const openPreview = async (opts: {
    storageKey?: string | null;
    blobKey?: string;
    fallbackName?: string;
  }) => {
    const blob = opts.blobKey ? localBlobs[opts.blobKey] : undefined;
    if (blob) {
      setPreviewUrl(blob.url);
      setPreviewName(blob.name);
      setPreviewOpen(true);
      return;
    }
    if (!opts.storageKey) {
      toast.error("No hay archivo disponible para vista previa");
      return;
    }
    try {
      const url = await driveService.getSignedUrl(opts.storageKey);
      setPreviewUrl(url);
      setPreviewName(opts.fallbackName ?? "Archivo");
      setPreviewOpen(true);
    } catch (err: any) {
      toast.error(err?.message ?? "No se pudo abrir la vista previa");
    }
  };

  const resolveConsolidadoTargets = () => {
    // Solo tipos pendientes (no cubiertos) son seleccionables
    const candidatos = docsIndividuales.filter(
      (d) => !isDocCompletado(d),
    );
    const seleccionados = tiposSeleccionados.length > 0
      ? candidatos.filter((d) => tiposSeleccionados.includes(d.tipo))
      : candidatos;
    return {
      documentosIds: seleccionados.map((d) => d.id),
      tiposIncluidos: seleccionados.map((d) => d.tipo),
    };
  };

  const handleConsolidadoUpload = (file: File) => {
    if (!validateFileSize(file)) return;
    const { documentosIds, tiposIncluidos } = resolveConsolidadoTargets();
    if (tiposIncluidos.length === 0) {
      toast.error("Selecciona al menos un requisito para incluir en el consolidado");
      return;
    }
    if (onUploadConsolidado) {
      onUploadConsolidado(file, documentosIds, tiposIncluidos);
      setTiposSeleccionados([]);
    }
    storeBlob("__consolidado__", file);
  };

  const requestDeleteDoc = (doc: DocumentoRequerido) => {
    setConfirmDeleteDoc(doc);
  };

  const toggleTipo = (tipo: string) => {
    setTiposSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    );
  };

  const renderFechaFields = (doc: DocumentoRequerido) => {
    if ((doc.tipo !== "examen_medico" && doc.tipo !== "arl") || !onFechaChange) return null;
    return (
      <TooltipProvider>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
          {doc.tipo === "examen_medico" && (
            <div className="flex items-center gap-1 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-0.5 cursor-default">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Examen</Label>
                    <Info className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Fecha del examen médico ocupacional</TooltipContent>
              </Tooltip>
              <DateField compact value={doc.fechaDocumento || ""} onChange={(v) => onFechaChange(doc.id, "fechaDocumento", v)} />
            </div>
          )}
          {doc.tipo === "arl" && (
            <div className="flex items-center gap-1 min-w-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-0.5 cursor-default">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Cobertura</Label>
                    <Info className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Inicio de cobertura ARL</TooltipContent>
              </Tooltip>
              <DateField compact value={doc.fechaInicioCobertura || ""} onChange={(v) => onFechaChange(doc.id, "fechaInicioCobertura", v)} />
            </div>
          )}
        </div>
      </TooltipProvider>
    );
  };

  const renderFileInfo = (doc: DocumentoRequerido) => {
    const blob = localBlobs[doc.id];
    const nombre = doc.archivoNombre || blob?.name;
    const tamano = doc.archivoTamano || blob?.size;
    if (!nombre) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate max-w-[140px]">{nombre}</span>
        {tamano && <span className="shrink-0">· {formatFileSize(tamano)}</span>}
      </div>
    );
  };

  return (
    <div className="space-y-3 min-w-0 overflow-hidden">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{completados}/{total} requisitos</span>
          {compact && (
            <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">Máx. {formatFileSize(MAX_FILE_SIZE)}/archivo</span>
      </div>
      <Progress value={progress} className="h-1.5" />

      {/* Mode selector */}
      {expanded && (
        <div className="inline-flex rounded-lg bg-muted p-1 w-full">
          <button type="button" onClick={() => setConsolidado(false)}
            className={cn("flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all text-center",
              !consolidado ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            📄 Individual
            <span className="block text-[10px] font-normal opacity-70">Un archivo por documento</span>
          </button>
          <button type="button" onClick={() => setConsolidado(true)}
            className={cn("flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all text-center",
              consolidado ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            📋 Consolidado
            <span className="block text-[10px] font-normal opacity-70">Varios documentos en un PDF</span>
          </button>
        </div>
      )}

      {/* Banner consolidado activo (visible en ambos modos) */}
      {expanded && consolidadoRow && (
        <div className="p-3 bg-emerald-500/5 border border-emerald-200/60 rounded-lg flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Files className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Consolidado activo</p>
            <p className="text-sm font-medium truncate">{consolidadoRow.archivoNombre ?? "Consolidado"}</p>
            <p className="text-xs text-muted-foreground">
              {tiposCubiertos.length} requisito{tiposCubiertos.length === 1 ? "" : "s"} cubierto{tiposCubiertos.length === 1 ? "" : "s"}
              {consolidadoRow.archivoTamano ? ` · ${formatFileSize(consolidadoRow.archivoTamano)}` : ""}
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() =>
                openPreview({
                  storageKey: consolidadoRow.urlDrive,
                  blobKey: "__consolidado__",
                  fallbackName: consolidadoRow.archivoNombre ?? "Consolidado",
                })
              }
            >
              <Eye className="h-3.5 w-3.5 mr-1" /> Ver
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              onClick={() =>
                setConfirmDeleteConsolidado({
                  id: consolidadoRow.id,
                  storagePath: consolidadoRow.urlDrive,
                  nombre: consolidadoRow.archivoNombre ?? "Consolidado",
                  tipos: tiposCubiertos,
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
            </Button>
          </div>
        </div>
      )}

      {/* ── Individual mode ── */}
      {expanded && !consolidado && (
        <div className="space-y-2">
          {docsIndividuales.map((doc) => {
            const isUploading_ = uploadingDocId === doc.id;
            const cubiertoPorConsolidado =
              !!consolidadoRow && tiposCubiertos.includes(doc.tipo) && doc.estado !== "cargado";
            const hasBlob = !!localBlobs[doc.id];
            const cargadoIndividual = doc.estado === "cargado";

            return (
              <div key={doc.id} className="space-y-0">
                <div className="flex items-start gap-2 p-2.5 border rounded-lg overflow-hidden">
                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    cargadoIndividual || cubiertoPorConsolidado ? "bg-emerald-500/10" : "bg-muted")}>
                    {isUploading_ ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <FileCheck className={cn("h-3.5 w-3.5",
                        cargadoIndividual || cubiertoPorConsolidado ? "text-emerald-600" : "text-muted-foreground")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{doc.nombre}</p>
                      {doc.opcional && <span className="text-[11px] text-muted-foreground shrink-0">(opcional)</span>}
                    </div>
                    {cubiertoPorConsolidado ? (
                      <Badge variant="outline" className="text-[10px] mt-1 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                        <Files className="h-3 w-3 mr-1" /> Cubierto por consolidado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={cn("text-[10px] mt-1", ESTADO_COLORS[doc.estado])}>
                        {ESTADO_LABELS[doc.estado]}
                      </Badge>
                    )}
                    {cargadoIndividual && renderFileInfo(doc)}
                    {renderFechaFields(doc)}
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {cubiertoPorConsolidado ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex h-7 w-7 items-center justify-center text-muted-foreground">
                            <Lock className="h-3.5 w-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          Para gestionarlo, elimina el consolidado primero.
                        </TooltipContent>
                      </Tooltip>
                    ) : doc.estado === "pendiente" ? (
                      <FileDropZone
                        accept=".pdf,.jpg,.jpeg,.png"
                        onFile={(file) => {
                          storeBlob(doc.id, file);
                          setUploadingDocId(doc.id);
                          onUpload(doc.id, file);
                          setTimeout(() => setUploadingDocId(null), 1200);
                        }}
                        disabled={isUploading || isUploading_}
                        compact
                        label="Cargar"
                      />
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            openPreview({
                              storageKey: doc.urlDrive,
                              blobKey: doc.id,
                              fallbackName: doc.archivoNombre ?? doc.nombre,
                            })
                          }
                          disabled={!doc.urlDrive && !hasBlob}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <label className="cursor-pointer flex items-center">
                                <Upload className="h-3.5 w-3.5 mr-2" /> Volver a cargar
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => handleFileChange(doc.id, e)} disabled={isUploading || isUploading_} />
                              </label>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => requestDeleteDoc(doc)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Consolidated mode ── */}
      {expanded && consolidado && (
        <div className="border rounded-lg overflow-hidden">
          {/* Block 1: Checklist */}
          <div className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {consolidadoRow ? "Requisitos cubiertos / disponibles" : "Selecciona requisitos a incluir en el PDF"}
            </p>
            <div className="space-y-1.5">
              {docsIndividuales.map((doc) => {
                const cubierto = !!consolidadoRow && tiposCubiertos.includes(doc.tipo);
                const cargadoIndiv = doc.estado === "cargado";
                const completed = cubierto || cargadoIndiv;
                // Solo seleccionable si está pendiente y NO cubierto
                const seleccionable = !completed;
                return (
                  <div key={doc.id} className="flex items-start gap-2">
                    <label
                      className={cn(
                        "flex items-center gap-2 flex-1 min-w-0",
                        seleccionable ? "cursor-pointer" : "cursor-default",
                      )}
                    >
                      <Checkbox
                        checked={tiposSeleccionados.includes(doc.tipo)}
                        onCheckedChange={() => toggleTipo(doc.tipo)}
                        disabled={!seleccionable}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-sm", completed && "text-muted-foreground")}>{doc.nombre}</span>
                          {cubierto && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-200">
                              <Files className="h-3 w-3 mr-1" /> Cubierto por consolidado
                            </Badge>
                          )}
                          {!cubierto && cargadoIndiv && (
                            <Badge variant="outline" className={cn("text-[10px]", ESTADO_COLORS[doc.estado])}>
                              {ESTADO_LABELS[doc.estado]} (individual)
                            </Badge>
                          )}
                        </div>
                        {cargadoIndiv && !cubierto && renderFileInfo(doc)}
                        {renderFechaFields(doc)}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Block 2: Upload zone */}
          <div className="p-3 bg-muted/30 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {consolidadoRow ? "Reemplazar consolidado" : "Carga del PDF consolidado"}
            </p>
            <FileDropZone
              accept=".pdf"
              onFile={handleConsolidadoUpload}
              disabled={isUploading}
              label={`Arrastra el PDF aquí o haz clic${tiposSeleccionados.length > 0 ? ` (${tiposSeleccionados.length} docs)` : ""}`}
              hint="Archivo PDF consolidado"
            />
            {consolidadoRow && (
              <p className="text-[11px] text-muted-foreground">
                Reemplazar sustituye el archivo y la lista de requisitos cubiertos.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Vista previa modal ── */}
      <ArchivoPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        url={previewUrl}
        nombre={previewName}
      />

      {/* ── Confirmaciones ── */}
      <ConfirmDialog
        open={!!confirmDeleteDoc}
        onOpenChange={(open) => !open && setConfirmDeleteDoc(null)}
        title="¿Eliminar documento?"
        description={`Se quitará el archivo cargado para "${confirmDeleteDoc?.nombre ?? ""}" y el requisito volverá a estar pendiente.`}
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteDoc) onDelete?.(confirmDeleteDoc.id);
          setConfirmDeleteDoc(null);
        }}
      />

      <ConfirmDialog
        open={!!confirmDeleteConsolidado}
        onOpenChange={(open) => !open && setConfirmDeleteConsolidado(null)}
        title="¿Eliminar el consolidado?"
        description={`Se eliminará "${confirmDeleteConsolidado?.nombre ?? "el archivo"}". Los ${confirmDeleteConsolidado?.tipos.length ?? 0} requisitos cubiertos volverán a estar disponibles para cargar.`}
        confirmText="Eliminar consolidado"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteConsolidado && onDeleteConsolidado) {
            onDeleteConsolidado(confirmDeleteConsolidado.id, confirmDeleteConsolidado.storagePath);
          }
          setConfirmDeleteConsolidado(null);
        }}
      />
    </div>
  );
}
