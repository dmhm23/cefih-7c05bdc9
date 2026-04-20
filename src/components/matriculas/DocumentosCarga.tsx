import { useState, useEffect, useMemo } from "react";
import { Upload, FileCheck, ExternalLink, ChevronDown, ChevronUp, Eye, FileText, X, Loader2, MoreHorizontal, Trash2, Info, Files } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DocumentoRequerido } from "@/types/matricula";
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
  onUploadConsolidado?: (file: File, documentosIds: string[], tiposIncluidos: string[]) => void | Promise<void>;
  /** Borra el consolidado (todas las filas que comparten storagePath + blob de Storage) */
  onDeleteConsolidado?: (storagePath: string, documentosIds: string[]) => void | Promise<void>;
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

type PreviewData = { url: string; name: string; type: string; size: number };

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
  const [previews, setPreviews] = useState<Record<string, PreviewData>>({});
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [consolidadoPreview, setConsolidadoPreview] = useState<PreviewData | null>(null);
  const [activeConsolidadoPreview, setActiveConsolidadoPreview] = useState(false);

  // Confirmaciones
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<DocumentoRequerido | null>(null);
  const [confirmCascade, setConfirmCascade] = useState<{ doc: DocumentoRequerido; siblings: DocumentoRequerido[] } | null>(null);
  const [confirmDeleteConsolidado, setConfirmDeleteConsolidado] = useState<{ storagePath: string; ids: string[]; nombre?: string } | null>(null);

  const completados = documentos.filter((d) => d.estado !== "pendiente").length;
  const total = documentos.length;
  const progress = total > 0 ? (completados / total) * 100 : 0;

  /**
   * Detección del consolidado activo: documentos cargados que comparten exactamente
   * el mismo storage_path (urlDrive) entre 2 o más filas.
   */
  const consolidadoGroups = useMemo(() => {
    const map = new Map<string, DocumentoRequerido[]>();
    for (const d of documentos) {
      if (d.estado === "cargado" && d.urlDrive) {
        const arr = map.get(d.urlDrive) ?? [];
        arr.push(d);
        map.set(d.urlDrive, arr);
      }
    }
    // Sólo grupos con >=2 documentos cuentan como "consolidado"
    return Array.from(map.entries())
      .filter(([, docs]) => docs.length >= 2)
      .map(([storagePath, docs]) => ({
        storagePath,
        docs,
        nombre: docs[0].archivoNombre ?? "Consolidado",
        tamano: docs[0].archivoTamano,
      }));
  }, [documentos]);

  // Sincronizar consolidadoPreview local: si ningún doc cargado comparte el storage_path,
  // limpiar el preview en memoria.
  useEffect(() => {
    if (!consolidadoPreview) return;
    const stillExists = documentos.some(
      (d) => d.estado === "cargado" && d.archivoNombre === consolidadoPreview.name,
    );
    if (!stillExists && consolidadoGroups.length === 0) {
      setConsolidadoPreview(null);
      setActiveConsolidadoPreview(false);
    }
  }, [documentos, consolidadoPreview, consolidadoGroups.length]);

  // Sincronizar previews individuales: limpiar cuando un doc vuelve a `pendiente`.
  useEffect(() => {
    setPreviews((prev) => {
      const next: Record<string, PreviewData> = {};
      for (const [docId, data] of Object.entries(prev)) {
        const doc = documentos.find((d) => d.id === docId);
        if (doc && doc.estado !== "pendiente") next[docId] = data;
      }
      return next;
    });
    // Si el preview activo dejó de existir, cerrar
    if (activePreview) {
      const doc = documentos.find((d) => d.id === activePreview);
      if (!doc || doc.estado === "pendiente") setActivePreview(null);
    }
  }, [documentos, activePreview]);

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`El archivo excede el tamaño máximo de ${formatFileSize(MAX_FILE_SIZE)}`);
      return false;
    }
    return true;
  };

  const storePreview = (docId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const data: PreviewData = { url: dataUrl, name: file.name, type: file.type, size: file.size };
      setPreviews((prev) => ({ ...prev, [docId]: data }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFileSize(file)) return;
    storePreview(docId, file);
    setUploadingDocId(docId);
    onUpload(docId, file);
    setTimeout(() => setUploadingDocId(null), 1200);
  };

  const resolveConsolidadoTargets = () => {
    const seleccionados = tiposSeleccionados.length > 0
      ? documentos.filter((d) => tiposSeleccionados.includes(d.tipo) && d.estado === "pendiente")
      : documentos.filter((d) => d.estado === "pendiente");
    return {
      documentosIds: seleccionados.map((d) => d.id),
      tiposIncluidos: seleccionados.map((d) => d.tipo),
    };
  };

  const handleConsolidadoUpload = (file: File) => {
    if (!validateFileSize(file)) return;
    const { documentosIds, tiposIncluidos } = resolveConsolidadoTargets();
    if (documentosIds.length === 0) {
      toast.error("Selecciona al menos un requisito para incluir en el consolidado");
      return;
    }
    if (onUploadConsolidado) {
      onUploadConsolidado(file, documentosIds, tiposIncluidos);
      setTiposSeleccionados([]);
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setConsolidadoPreview({ url: dataUrl, name: file.name, type: file.type, size: file.size });
    };
    reader.readAsDataURL(file);
  };

  /**
   * Click en eliminar de un documento individual.
   * Si comparte storage_path con otros (consolidado) → ofrecer cascada.
   * Si es único → confirmar simple.
   */
  const requestDeleteDoc = (doc: DocumentoRequerido) => {
    if (doc.urlDrive) {
      const siblings = documentos.filter(
        (d) => d.id !== doc.id && d.estado === "cargado" && d.urlDrive === doc.urlDrive,
      );
      if (siblings.length > 0) {
        setConfirmCascade({ doc, siblings });
        return;
      }
    }
    setConfirmDeleteDoc(doc);
  };

  const confirmDeleteOnlyThis = () => {
    if (!confirmCascade) return;
    onDelete?.(confirmCascade.doc.id);
    setConfirmCascade(null);
  };

  const confirmDeleteAllShared = () => {
    if (!confirmCascade) return;
    const { doc, siblings } = confirmCascade;
    const ids = [doc.id, ...siblings.map((s) => s.id)];
    if (onDeleteConsolidado && doc.urlDrive) {
      onDeleteConsolidado(doc.urlDrive, ids);
    } else {
      // Fallback: borrado uno por uno
      ids.forEach((id) => onDelete?.(id));
    }
    setConfirmCascade(null);
  };

  const closePreview = (docId: string) => {
    if (activePreview === docId) setActivePreview(null);
  };

  const closeConsolidadoPreview = () => {
    setActiveConsolidadoPreview(false);
  };

  const toggleTipo = (tipo: string) => {
    setTiposSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
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

  const renderFileInfo = (doc: DocumentoRequerido, docId: string) => {
    const preview = previews[docId];
    const nombre = doc.archivoNombre || preview?.name;
    const tamano = doc.archivoTamano || preview?.size;
    if (!nombre) return null;
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate max-w-[140px]">{nombre}</span>
        {tamano && <span className="shrink-0">· {formatFileSize(tamano)}</span>}
      </div>
    );
  };

  const renderPreviewPanel = (data: PreviewData, onClose: () => void) => (
    <div className="border rounded-lg overflow-hidden mt-2">
      <div className="flex items-center justify-between bg-muted px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs font-medium truncate">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{data.name}</span>
          <span className="text-muted-foreground shrink-0">· {formatFileSize(data.size)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-xs"
            onClick={() => { const w = window.open(); if (w) { w.document.write(`<iframe src="${data.url}" style="width:100%;height:100%;border:none"></iframe>`); w.document.title = data.name; } }}>
            <ExternalLink className="h-3 w-3 mr-1" /> Abrir
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {data.type === "application/pdf" ? (
        <iframe src={data.url} className="w-full h-52 border-0" title="Vista previa" />
      ) : data.type.startsWith("image/") ? (
        <img src={data.url} alt="Vista previa" className="w-full max-h-52 object-contain p-2" />
      ) : (
        <div className="p-3 text-center text-sm text-muted-foreground">
          <FileText className="h-6 w-6 mx-auto mb-1" />
          <p className="text-xs">{data.name}</p>
          <a href={data.url} download={data.name} className="text-xs text-primary hover:underline mt-1 inline-block">Descargar</a>
        </div>
      )}
    </div>
  );

  // Grupo activo seleccionado para preview/eliminación global en modo consolidado
  const primaryGroup = consolidadoGroups[0];

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

      {/* ── Individual mode ── */}
      {expanded && !consolidado && (
        <div className="space-y-2">
          {documentos.map((doc) => {
            const isUploading_ = uploadingDocId === doc.id;
            const hasPreview = !!previews[doc.id];
            const isActive = activePreview === doc.id;

            return (
              <div key={doc.id} className="space-y-0">
                <div className="flex items-start gap-2 p-2.5 border rounded-lg overflow-hidden">
                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    doc.estado === "cargado" ? "bg-emerald-500/10" : "bg-muted")}>
                    {isUploading_ ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <FileCheck className={cn("h-3.5 w-3.5",
                        doc.estado === "cargado" ? "text-emerald-600" : "text-muted-foreground")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{doc.nombre}</p>
                      {doc.opcional && <span className="text-[11px] text-muted-foreground shrink-0">(opcional)</span>}
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] mt-1", ESTADO_COLORS[doc.estado])}>
                      {ESTADO_LABELS[doc.estado]}
                    </Badge>
                    {renderFileInfo(doc, doc.id)}
                    {renderFechaFields(doc)}
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {doc.estado === "pendiente" ? (
                      <FileDropZone
                        accept=".pdf,.jpg,.jpeg,.png"
                        onFile={(file) => {
                          storePreview(doc.id, file);
                          setUploadingDocId(doc.id);
                          onUpload(doc.id, file);
                          setTimeout(() => setUploadingDocId(null), 1200);
                        }}
                        disabled={isUploading || isUploading_}
                        compact
                        label="Cargar"
                      />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setActivePreview(isActive ? null : doc.id)} disabled={!hasPreview}>
                            <Eye className="h-3.5 w-3.5 mr-2" /> Vista previa
                          </DropdownMenuItem>
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
                    )}
                  </div>
                </div>
                {isActive && previews[doc.id] && renderPreviewPanel(previews[doc.id], () => closePreview(doc.id))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Consolidated mode ── */}
      {expanded && consolidado && (
        <div className="border rounded-lg overflow-hidden">
          {/* Resumen del consolidado activo */}
          {primaryGroup && (
            <div className="p-3 bg-emerald-500/5 border-b flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Files className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Consolidado activo</p>
                <p className="text-sm font-medium truncate">{primaryGroup.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {primaryGroup.docs.length} requisitos cubiertos
                  {primaryGroup.tamano ? ` · ${formatFileSize(primaryGroup.tamano)}` : ""}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {consolidadoPreview && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
                    onClick={() => setActiveConsolidadoPreview(!activeConsolidadoPreview)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Vista previa
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                  onClick={() => setConfirmDeleteConsolidado({
                    storagePath: primaryGroup.storagePath,
                    ids: primaryGroup.docs.map((d) => d.id),
                    nombre: primaryGroup.nombre,
                  })}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          )}

          {primaryGroup && activeConsolidadoPreview && consolidadoPreview && (
            <div className="px-3 pt-2">
              {renderPreviewPanel(consolidadoPreview, closeConsolidadoPreview)}
            </div>
          )}

          {/* Block 1: Checklist */}
          <div className="p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Requisitos incluidos en el PDF</p>
            <div className="space-y-1.5">
              {documentos.map((doc) => {
                const isPendiente = doc.estado === "pendiente";
                const cubiertoPorConsolidado = !isPendiente && primaryGroup?.docs.some((d) => d.id === doc.id);
                return (
                  <div key={doc.id} className="flex items-start gap-2">
                    <label className={cn("flex items-center gap-2 flex-1 min-w-0", isPendiente ? "cursor-pointer" : "cursor-default")}>
                      <Checkbox
                        checked={tiposSeleccionados.includes(doc.tipo)}
                        onCheckedChange={() => toggleTipo(doc.tipo)}
                        disabled={!isPendiente}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn("text-sm", !isPendiente && "text-muted-foreground")}>{doc.nombre}</span>
                          {!isPendiente && (
                            <Badge variant="outline" className={cn("text-[10px]", ESTADO_COLORS[doc.estado])}>
                              {ESTADO_LABELS[doc.estado]}
                            </Badge>
                          )}
                        </div>
                        {!isPendiente && renderFileInfo(doc, doc.id)}
                        {renderFechaFields(doc)}
                      </div>
                    </label>
                    {cubiertoPorConsolidado && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setActiveConsolidadoPreview(true)}
                            disabled={!consolidadoPreview}
                          >
                            <Eye className="h-3.5 w-3.5 mr-2" /> Vista previa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => requestDeleteDoc(doc)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Quitar de este requisito
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Block 2: Upload zone */}
          <div className="p-3 bg-muted/30 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {primaryGroup ? "Reemplazar consolidado" : "Carga del PDF consolidado"}
            </p>
            <FileDropZone
              accept=".pdf"
              onFile={handleConsolidadoUpload}
              disabled={isUploading}
              label={`Arrastra el PDF aquí o haz clic${tiposSeleccionados.length > 0 ? ` (${tiposSeleccionados.length} docs)` : ""}`}
              hint="Archivo PDF consolidado"
            />
            {consolidadoPreview && !primaryGroup && renderPreviewPanel(consolidadoPreview, () => setConsolidadoPreview(null))}
          </div>
        </div>
      )}

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

      {/* Cascada: archivo compartido por varios requisitos */}
      <AlertDialog open={!!confirmCascade} onOpenChange={(open) => !open && setConfirmCascade(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Este archivo cubre varios requisitos</AlertDialogTitle>
            <AlertDialogDescription>
              El archivo cubre <strong>{(confirmCascade?.siblings.length ?? 0) + 1} requisitos</strong>.
              ¿Quieres quitarlo solo de este requisito o de todos los que cubre?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={confirmDeleteOnlyThis}>
              Solo este
            </Button>
            <AlertDialogAction
              onClick={confirmDeleteAllShared}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar de todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Eliminar consolidado completo */}
      <ConfirmDialog
        open={!!confirmDeleteConsolidado}
        onOpenChange={(open) => !open && setConfirmDeleteConsolidado(null)}
        title="¿Eliminar el consolidado?"
        description={`Se quitará "${confirmDeleteConsolidado?.nombre ?? "el archivo"}" de los ${confirmDeleteConsolidado?.ids.length ?? 0} requisitos cubiertos. Esta acción no se puede deshacer.`}
        confirmText="Eliminar consolidado"
        variant="destructive"
        onConfirm={() => {
          if (confirmDeleteConsolidado && onDeleteConsolidado) {
            onDeleteConsolidado(confirmDeleteConsolidado.storagePath, confirmDeleteConsolidado.ids);
          } else if (confirmDeleteConsolidado) {
            confirmDeleteConsolidado.ids.forEach((id) => onDelete?.(id));
          }
          setConfirmDeleteConsolidado(null);
        }}
      />
    </div>
  );
}
