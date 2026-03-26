import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Save, Eye, GripVertical, Trash2, Copy, Plus, History, BookTemplate } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { BLOQUE_TYPE_LABELS, BLOCK_PALETTE, BLOQUE_ICONS, COMPLEX_TYPES } from "@/data/bloqueConstants";
import BloqueInspector from "@/components/formatos/BloqueInspector";
import TemplateEditor from "@/components/formatos/TemplateEditor";
import TokenLibrary from "@/components/formatos/TokenLibrary";
import EncabezadoConfigCard, { DEFAULT_ENCABEZADO_CONFIG } from "@/components/formatos/EncabezadoConfigCard";
import PlantillaBasePicker from "@/components/formatos/PlantillaBasePicker";
import VersionHistoryDialog from "@/components/formatos/VersionHistoryDialog";
import FormatoPreviewDialog from "@/components/formatos/FormatoPreviewDialog";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AUTO_FIELD_CATALOG, AUTO_FIELD_CATEGORIES, getAutoFieldLabel, getAutoFieldOption } from "@/data/autoFieldCatalog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useFormato, useUpdateFormato, useCreateFormato, useSaveVersion } from "@/hooks/useFormatosFormacion";
import {
  FormatoFormacion,
  FormatoFormacionFormData,
  Bloque,
  TipoBloque,
  AsignacionScope,
  MotorRender,
  CategoriaFormato,
  EncabezadoConfig,
  PlantillaBase,
} from "@/types/formatoFormacion";
import { TipoFormacion, TIPO_FORMACION_LABELS } from "@/types/curso";
import { v4 as uuidv4 } from "uuid";

const TIPO_CURSO_OPTIONS = Object.entries(TIPO_FORMACION_LABELS) as [TipoFormacion, string][];

const CATEGORIA_OPTIONS: { value: CategoriaFormato; label: string }[] = [
  { value: 'formacion', label: 'Formación' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'asistencia', label: 'Asistencia' },
  { value: 'pta_ats', label: 'PTA / ATS' },
  { value: 'personalizado', label: 'Personalizado' },
];

function createDefaultBloque(type: TipoBloque): Bloque {
  const base = { id: uuidv4(), type, label: "", required: false };
  switch (type) {
    case "paragraph":
      return { ...base, type: "paragraph", props: { text: "" } };
    case "radio":
      return { ...base, type: "radio", props: { options: [{ value: "opcion_1", label: "Opción 1" }] } };
    case "select":
      return { ...base, type: "select", props: { options: [{ value: "opcion_1", label: "Opción 1" }] } };
    case "auto_field":
      return { ...base, type: "auto_field", props: { key: "nombre_aprendiz" } };
    case "heading":
      return { ...base, type: "heading", props: { level: 2 } };
    default:
      return base as Bloque;
  }
}

// ---------------------------------------------------------------------------
// Palette draggable item (bloques mode)
// ---------------------------------------------------------------------------

function PaletteDraggableItem({ type, label, onClickAdd }: { type: TipoBloque; label: string; onClickAdd: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { fromPalette: true, type },
  });
  const Icon = BLOQUE_ICONS[type];
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors border border-transparent hover:border-border hover:bg-muted/60 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
      <span className="flex-1">{label}</span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClickAdd(); }}
        className="p-0.5 rounded hover:bg-muted text-muted-foreground"
        title="Agregar al final"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function PaletteOverlayGhost({ type }: { type: TipoBloque }) {
  const Icon = BLOQUE_ICONS[type];
  const label = BLOQUE_TYPE_LABELS[type] || type;
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-primary rounded-[10px] bg-background shadow-lg opacity-95">
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="secondary" className="text-[10px] ml-auto">Nuevo</Badge>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block item components (bloques mode)
// ---------------------------------------------------------------------------

interface BloqueItemProps {
  bloque: Bloque;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  activeId?: string | null;
}

function BloqueItemContent({ bloque, isSelected, onSelect, onDelete, onDuplicate, activeId, dragHandleProps }: BloqueItemProps & { dragHandleProps?: Record<string, any> }) {
  const isComplex = COMPLEX_TYPES.includes(bloque.type);
  const isDraggedAway = activeId === bloque.id;
  let subtext = BLOQUE_TYPE_LABELS[bloque.type] || bloque.type;
  if (bloque.type === "auto_field" && "props" in bloque) {
    const opt = getAutoFieldOption((bloque as any).props?.key);
    subtext += ` · ${opt?.label ?? (bloque as any).props?.key}`;
  } else if (bloque.type === "paragraph" && "props" in bloque) {
    const txt = (bloque as any).props?.text || "";
    if (txt) subtext += ` · ${txt.slice(0, 60)}${txt.length > 60 ? "…" : ""}`;
  }
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={cn(
        "group flex items-center gap-3 p-4 border rounded-[10px] cursor-pointer transition-all duration-150",
        isDraggedAway && "opacity-40",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "bg-background border-border hover:bg-muted/50 hover:border-muted-foreground/20"
      )}
    >
      <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {bloque.label || <span className="italic text-muted-foreground font-normal">Sin etiqueta</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtext}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {bloque.type === "auto_field" && (
          <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">Auto</Badge>
        )}
        {bloque.required && (
          <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Obligatorio</Badge>
        )}
        {isComplex && (
          <Badge variant="secondary" className="text-[10px]">Complejo</Badge>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicar">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Eliminar">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SortableBloqueItem(props: BloqueItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.bloque.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <BloqueItemContent {...props} dragHandleProps={listeners} />
    </div>
  );
}

function BloqueItemOverlay({ bloque }: { bloque: Bloque }) {
  const subtext = BLOQUE_TYPE_LABELS[bloque.type] || bloque.type;
  return (
    <div className="flex items-center gap-3 p-4 border-2 border-primary rounded-[10px] bg-background shadow-lg opacity-95">
      <GripVertical className="h-4 w-4 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{bloque.label || <span className="italic text-muted-foreground font-normal">Sin etiqueta</span>}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}

function DroppableCanvasZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop-zone" });
  return (
    <div
      ref={setNodeRef}
      className={cn("text-center py-12 border-2 border-dashed rounded-xl bg-background transition-colors", isOver ? "border-primary bg-primary/5" : "")}
    >
      <p className="text-muted-foreground">Agrega bloques desde el panel lateral para construir el formato</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------

export default function FormatoEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = !id || id === "nuevo";

  const { data: existing, isLoading } = useFormato(isNew ? undefined : id);
  const updateMutation = useUpdateFormato();
  const createMutation = useCreateFormato();
  const saveVersionMutation = useSaveVersion();

  // --- Form state ---
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [codigo, setCodigo] = useState("");
  const [version, setVersion] = useState("001");
  const [scope, setScope] = useState<AsignacionScope>("tipo_curso");
  const [tipoCursoKeys, setTipoCursoKeys] = useState<TipoFormacion[]>([]);
  const [visibleEnMatricula, setVisibleEnMatricula] = useState(true);
  const [visibleEnCurso, setVisibleEnCurso] = useState(false);
  const [activo, setActivo] = useState(true);
  const [firmaAprendiz, setFirmaAprendiz] = useState(false);
  const [firmaEntrenador, setFirmaEntrenador] = useState(false);
  const [firmaSupervisor, setFirmaSupervisor] = useState(false);
  const [bloques, setBloques] = useState<Bloque[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedBloqueId, setSelectedBloqueId] = useState<string | null>(null);

  // New template state
  const [motorRender, setMotorRender] = useState<MotorRender>('plantilla_html');
  const [categoria, setCategoria] = useState<CategoriaFormato>('personalizado');
  const [htmlTemplate, setHtmlTemplate] = useState('');
  const [usaEncabezado, setUsaEncabezado] = useState(true);
  const [encabezadoConfig, setEncabezadoConfig] = useState<EncabezadoConfig>(DEFAULT_ENCABEZADO_CONFIG);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showPlantillaPicker, setShowPlantillaPicker] = useState(false);
  const insertTokenRef = useRef<((token: string) => void) | null>(null);

  // --- Dirty state ---
  const [isDirty, setIsDirty] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const markDirty = useCallback(() => setIsDirty(true), []);

  // Show plantilla picker for new template formats
  useEffect(() => {
    if (isNew && motorRender === 'plantilla_html' && !htmlTemplate) {
      setShowPlantillaPicker(true);
    }
  }, [isNew, motorRender, htmlTemplate]);

  // Load existing
  useEffect(() => {
    if (existing) {
      setNombre(existing.nombre);
      setDescripcion(existing.descripcion);
      setCodigo(existing.codigo);
      setVersion(existing.version);
      setScope(existing.asignacionScope);
      setTipoCursoKeys(existing.tipoCursoKeys);
      setVisibleEnMatricula(existing.visibleEnMatricula);
      setVisibleEnCurso(existing.visibleEnCurso);
      setActivo(existing.activo);
      setFirmaAprendiz(existing.requiereFirmaAprendiz);
      setFirmaEntrenador(existing.requiereFirmaEntrenador);
      setFirmaSupervisor(existing.requiereFirmaSupervisor);
      setBloques(existing.bloques);
      setMotorRender(existing.motorRender);
      setCategoria(existing.categoria);
      setHtmlTemplate(existing.htmlTemplate || '');
      setUsaEncabezado(existing.usaEncabezadoInstitucional);
      if (existing.encabezadoConfig) setEncabezadoConfig(existing.encabezadoConfig);
    }
  }, [existing]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" });
      return;
    }

    if (motorRender === 'bloques') {
      const invalidAutoFields = bloques.filter(
        (b) => b.type === "auto_field" && (!("props" in b) || !(b as any).props?.key)
      );
      if (invalidAutoFields.length > 0) {
        toast({ title: "Hay campos automáticos sin clave asignada", variant: "destructive" });
        return;
      }
    }

    const data: FormatoFormacionFormData = {
      nombre,
      descripcion,
      codigo,
      version,
      asignacionScope: scope,
      nivelFormacionIds: [],
      tipoCursoKeys,
      visibleEnMatricula,
      visibleEnCurso,
      activo,
      esAutomatico: false,
      motorRender,
      categoria,
      estado: activo ? 'activo' : 'borrador',
      usaEncabezadoInstitucional: usaEncabezado,
      encabezadoConfig: usaEncabezado ? encabezadoConfig : undefined,
      htmlTemplate: motorRender === 'plantilla_html' ? htmlTemplate : undefined,
      requiereFirmaAprendiz: firmaAprendiz,
      requiereFirmaEntrenador: firmaEntrenador,
      requiereFirmaSupervisor: firmaSupervisor,
      bloques: motorRender === 'bloques' ? bloques : [],
      documentMeta: existing?.documentMeta,
      legacyComponentId: existing?.legacyComponentId,
    };

    try {
      if (isNew) {
        await createMutation.mutateAsync(data);
        toast({ title: "Formato creado correctamente" });
      } else {
        await updateMutation.mutateAsync({ id: id!, data });
        toast({ title: "Formato actualizado correctamente" });
      }
      setIsDirty(false);
      setSavedOnce(true);
      navigate("/gestion-formatos");
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    }
  };

  const handleSaveVersion = async () => {
    if (!id || isNew) return;
    try {
      await saveVersionMutation.mutateAsync(id);
      toast({ title: "Versión guardada" });
    } catch {
      toast({ title: "Error al guardar versión", variant: "destructive" });
    }
  };

  const handleSelectPlantilla = (plantilla: PlantillaBase) => {
    setHtmlTemplate(plantilla.htmlTemplate);
    setCategoria(plantilla.categoria);
    setShowPlantillaPicker(false);
    markDirty();
  };

  const toggleTipoCurso = (key: TipoFormacion) => {
    setTipoCursoKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Block operations (bloques mode)
  const addBloque = (type: TipoBloque) => { setBloques((prev) => [...prev, createDefaultBloque(type)]); markDirty(); };
  const updateBloque = (index: number, updated: Bloque) => { setBloques((prev) => prev.map((b, i) => (i === index ? updated : b))); markDirty(); };
  const deleteBloque = (index: number) => { setBloques((prev) => prev.filter((_, i) => i !== index)); markDirty(); };
  const duplicateBloque = (index: number) => {
    const original = bloques[index];
    const copy = { ...original, id: uuidv4() };
    setBloques((prev) => [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]);
    markDirty();
  };

  // DnD (bloques mode)
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeIdStr = String(active.id);
    if (activeIdStr.startsWith("palette-")) {
      if (over) {
        const type = activeIdStr.replace("palette-", "") as TipoBloque;
        const newBloque = createDefaultBloque(type);
        const overIdStr = String(over.id);
        if (overIdStr === "canvas-drop-zone") {
          setBloques((prev) => [...prev, newBloque]);
        } else {
          const overIndex = bloques.findIndex((b) => b.id === over.id);
          if (overIndex >= 0) setBloques((prev) => [...prev.slice(0, overIndex + 1), newBloque, ...prev.slice(overIndex + 1)]);
          else setBloques((prev) => [...prev, newBloque]);
        }
        markDirty();
        setSelectedBloqueId(newBloque.id);
      }
      setActiveId(null);
      return;
    }
    if (over && active.id !== over.id) {
      const oldIndex = bloques.findIndex((b) => b.id === active.id);
      const newIndex = bloques.findIndex((b) => b.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) { setBloques(arrayMove(bloques, oldIndex, newIndex)); markDirty(); }
    }
    setActiveId(null);
  };

  const activeDragBloque = activeId ? bloques.find((b) => b.id === activeId) ?? null : null;
  const activePaletteType = activeId?.startsWith("palette-") ? activeId.replace("palette-", "") as TipoBloque : null;

  const handleCanvasScroll = () => { if (canvasRef.current) setIsScrolled(canvasRef.current.scrollTop > 8); };

  if (!isNew && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-96">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const formatoPreview: Partial<FormatoFormacion> = {
    nombre, descripcion, codigo, version, bloques, motorRender, htmlTemplate,
    categoria, estado: activo ? 'activo' : 'borrador',
    usaEncabezadoInstitucional: usaEncabezado,
  };
  const isSaving = updateMutation.isPending || createMutation.isPending;
  const selectedBloque = selectedBloqueId ? bloques.find(b => b.id === selectedBloqueId) ?? null : null;
  const selectedIndex = selectedBloqueId ? bloques.findIndex(b => b.id === selectedBloqueId) : -1;

  // --- Plantilla picker screen ---
  if (showPlantillaPicker && isNew) {
    return (
      <div className="flex flex-col h-screen bg-muted/30">
        <header className="h-16 shrink-0 border-b bg-background px-6 flex items-center gap-4 shadow-sm">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/dashboard">SAFA</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/gestion-formatos">Gestión de Formatos</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Nuevo Formato</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex-1" />

          {/* Motor selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Motor:</Label>
            <Select value={motorRender} onValueChange={(v) => setMotorRender(v as MotorRender)}>
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plantilla_html">Plantilla HTML</SelectItem>
                <SelectItem value="bloques">Constructor de Bloques</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-[1000px] mx-auto">
            {motorRender === 'plantilla_html' ? (
              <PlantillaBasePicker onSelect={handleSelectPlantilla} />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Has seleccionado el constructor de bloques</p>
                <Button onClick={() => setShowPlantillaPicker(false)}>Continuar al editor</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/30">
      {/* ── HEADER ── */}
      <header className={cn("sticky top-0 z-50 h-16 shrink-0 border-b bg-background px-6 flex items-center gap-4 transition-shadow", isScrolled ? "shadow-md" : "shadow-sm")}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/dashboard">SAFA</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link to="/gestion-formatos">Gestión de Formatos</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>{isNew ? "Nuevo" : "Editar"}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-lg font-semibold truncate">{nombre || "Sin nombre"}</p>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px]">
              {motorRender === 'plantilla_html' ? 'Plantilla' : 'Bloques'}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {CATEGORIA_OPTIONS.find(c => c.value === categoria)?.label || categoria}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Cambios sin guardar</Badge>
          )}
          {!isDirty && savedOnce && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Guardado</Badge>
          )}

          {motorRender === 'plantilla_html' && !isNew && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
                <History className="h-4 w-4 mr-1" />
                Versiones
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveVersion} disabled={saveVersionMutation.isPending}>
                <BookTemplate className="h-4 w-4 mr-1" />
                Guardar versión
              </Button>
            </>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-1" />
            Vista Previa
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </header>

      {/* ── BODY ── */}
      {motorRender === 'plantilla_html' ? (
        /* ===== TEMPLATE HTML ENGINE ===== */
        <div className="flex flex-1 overflow-hidden">
          {/* Central editor */}
          <div ref={canvasRef} onScroll={handleCanvasScroll} className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[900px] mx-auto space-y-4">
              {/* Config general */}
              <Card className="bg-background rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Configuración General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Nombre del formato</Label>
                      <Input value={nombre} onChange={(e) => { setNombre(e.target.value); markDirty(); }} placeholder="Ej: Constancia de Asistencia" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>Descripción</Label>
                      <Textarea value={descripcion} onChange={(e) => { setDescripcion(e.target.value); markDirty(); }} placeholder="Descripción breve..." className="min-h-[60px]" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Código</Label>
                      <Input value={codigo} onChange={(e) => { setCodigo(e.target.value); markDirty(); }} placeholder="FIH04-XXX" className="font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Versión</Label>
                      <Input value={version} onChange={(e) => { setVersion(e.target.value); markDirty(); }} placeholder="001" className="font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Categoría</Label>
                      <Select value={categoria} onValueChange={(v) => { setCategoria(v as CategoriaFormato); markDirty(); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIA_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Alcance de asignación</Label>
                    <Select value={scope} onValueChange={(v) => { setScope(v as AsignacionScope); markDirty(); }}>
                      <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tipo_curso">Por tipo de curso</SelectItem>
                        <SelectItem value="nivel_formacion">Por nivel de formación</SelectItem>
                      </SelectContent>
                    </Select>
                    {scope === "tipo_curso" && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {TIPO_CURSO_OPTIONS.map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { toggleTipoCurso(key); markDirty(); }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                              tipoCursoKeys.includes(key)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-border hover:border-primary/50"
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={visibleEnMatricula} onCheckedChange={(v) => { setVisibleEnMatricula(v); markDirty(); }} id="vis-mat" />
                      <Label htmlFor="vis-mat" className="text-sm">Visible en Matrícula</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={visibleEnCurso} onCheckedChange={(v) => { setVisibleEnCurso(v); markDirty(); }} id="vis-cur" />
                      <Label htmlFor="vis-cur" className="text-sm">Visible en Curso</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={activo} onCheckedChange={(v) => { setActivo(v); markDirty(); }} id="activo" />
                      <Label htmlFor="activo" className="text-sm">Activo</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Firmas Requeridas</Label>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={firmaAprendiz} onCheckedChange={(c) => { setFirmaAprendiz(!!c); markDirty(); }} id="f-apr" />
                        <Label htmlFor="f-apr" className="text-sm">Aprendiz</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={firmaEntrenador} onCheckedChange={(c) => { setFirmaEntrenador(!!c); markDirty(); }} id="f-ent" />
                        <Label htmlFor="f-ent" className="text-sm">Entrenador</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox checked={firmaSupervisor} onCheckedChange={(c) => { setFirmaSupervisor(!!c); markDirty(); }} id="f-sup" />
                        <Label htmlFor="f-sup" className="text-sm">Supervisor</Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editor de plantilla */}
              <div className="pt-2">
                <p className="text-sm font-semibold text-muted-foreground mb-3">Editor de Plantilla</p>
                <TemplateEditor
                  content={htmlTemplate}
                  onChange={(html) => { setHtmlTemplate(html); markDirty(); }}
                  onInsertToken={(cb) => { insertTokenRef.current = cb; }}
                />
              </div>
            </div>
          </div>

          {/* Right panel: Token Library + Encabezado */}
          <aside className="w-80 shrink-0 border-l overflow-y-auto bg-background p-5 space-y-4">
            <EncabezadoConfigCard
              config={encabezadoConfig}
              onChange={(c) => { setEncabezadoConfig(c); markDirty(); }}
              enabled={usaEncabezado}
              onEnabledChange={(v) => { setUsaEncabezado(v); markDirty(); }}
            />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tokens Disponibles</CardTitle>
                <p className="text-xs text-muted-foreground">Haz clic para insertar en el editor</p>
              </CardHeader>
              <CardContent className="p-0 pb-2">
                <TokenLibrary
                  onInsertToken={(token) => {
                    if (insertTokenRef.current) insertTokenRef.current(token);
                  }}
                  className="h-[400px]"
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : (
        /* ===== BLOQUES ENGINE (legacy) ===== */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 overflow-hidden">
            <div ref={canvasRef} onScroll={handleCanvasScroll} className="flex-1 overflow-y-auto bg-[hsl(var(--muted)/0.3)] p-8">
              <div className="max-w-[900px] mx-auto space-y-4" onClick={(e) => { if (e.target === e.currentTarget) setSelectedBloqueId(null); }}>
                {/* Config General */}
                <Card className="bg-background rounded-xl shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Configuración General</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Nombre del formato</Label>
                        <Input value={nombre} onChange={(e) => { setNombre(e.target.value); markDirty(); }} placeholder="Ej: Registro de Asistencia" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label>Descripción</Label>
                        <Textarea value={descripcion} onChange={(e) => { setDescripcion(e.target.value); markDirty(); }} placeholder="Descripción breve..." className="min-h-[60px]" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Código</Label>
                        <Input value={codigo} onChange={(e) => { setCodigo(e.target.value); markDirty(); }} placeholder="FIH04-XXX" className="font-mono" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Versión</Label>
                        <Input value={version} onChange={(e) => { setVersion(e.target.value); markDirty(); }} placeholder="001" className="font-mono" />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <Label>Alcance de asignación</Label>
                      <Select value={scope} onValueChange={(v) => { setScope(v as AsignacionScope); markDirty(); }}>
                        <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tipo_curso">Por tipo de curso</SelectItem>
                          <SelectItem value="nivel_formacion">Por nivel de formación</SelectItem>
                        </SelectContent>
                      </Select>
                      {scope === "tipo_curso" && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {TIPO_CURSO_OPTIONS.map(([key, label]) => (
                            <button key={key} type="button" onClick={() => { toggleTipoCurso(key); markDirty(); }}
                              className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                                tipoCursoKeys.includes(key) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"
                              )}>
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <Switch checked={visibleEnMatricula} onCheckedChange={(v) => { setVisibleEnMatricula(v); markDirty(); }} id="vis-mat-b" />
                        <Label htmlFor="vis-mat-b" className="text-sm">Visible en Matrícula</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={visibleEnCurso} onCheckedChange={(v) => { setVisibleEnCurso(v); markDirty(); }} id="vis-cur-b" />
                        <Label htmlFor="vis-cur-b" className="text-sm">Visible en Curso</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={activo} onCheckedChange={(v) => { setActivo(v); markDirty(); }} id="activo-b" />
                        <Label htmlFor="activo-b" className="text-sm">Activo</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Firmas */}
                <Card className="bg-background rounded-xl shadow-sm">
                  <CardHeader className="pb-3"><CardTitle className="text-base">Firmas Requeridas</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={firmaAprendiz} onCheckedChange={(c) => { setFirmaAprendiz(!!c); markDirty(); }} id="f-apr-b" />
                        <Label htmlFor="f-apr-b">Firma del aprendiz</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Checkbox checked={firmaEntrenador} onCheckedChange={(c) => { setFirmaEntrenador(!!c); markDirty(); }} id="f-ent-b" />
                        <Label htmlFor="f-ent-b">Firma del entrenador</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Checkbox checked={firmaSupervisor} onCheckedChange={(c) => { setFirmaSupervisor(!!c); markDirty(); }} id="f-sup-b" />
                        <Label htmlFor="f-sup-b">Firma del supervisor</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bloques */}
                <div className="pt-2">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">Bloques ({bloques.length})</p>
                  {bloques.length === 0 ? (
                    <DroppableCanvasZone />
                  ) : (
                    <SortableContext items={bloques.map(b => b.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-3">
                        {bloques.map((bloque, index) => (
                          <SortableBloqueItem
                            key={bloque.id}
                            bloque={bloque}
                            index={index}
                            isSelected={selectedBloqueId === bloque.id}
                            onSelect={() => setSelectedBloqueId(bloque.id)}
                            onDelete={() => deleteBloque(index)}
                            onDuplicate={() => duplicateBloque(index)}
                            activeId={activeId}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              </div>
            </div>

            {/* Right panel (bloques) */}
            <aside className="w-80 shrink-0 border-l overflow-y-auto bg-background p-5">
              {selectedBloque ? (
                <BloqueInspector
                  bloque={selectedBloque}
                  onChange={(updated) => updateBloque(selectedIndex, updated)}
                  onDelete={() => { deleteBloque(selectedIndex); setSelectedBloqueId(null); }}
                  onDuplicate={() => duplicateBloque(selectedIndex)}
                  onBack={() => setSelectedBloqueId(null)}
                />
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Bloques Disponibles</CardTitle>
                    <p className="text-xs text-muted-foreground">Arrastra al canvas o haz clic en +</p>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {BLOCK_PALETTE.map((item) => (
                      <PaletteDraggableItem key={item.type} type={item.type} label={item.label} onClickAdd={() => addBloque(item.type)} />
                    ))}
                  </CardContent>
                </Card>
              )}
            </aside>
          </div>

          <DragOverlay>
            {activeDragBloque ? <BloqueItemOverlay bloque={activeDragBloque} /> : activePaletteType ? <PaletteOverlayGhost type={activePaletteType} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Preview */}
      <FormatoPreviewDialog open={showPreview} onOpenChange={setShowPreview} formato={formatoPreview} />

      {/* Version History */}
      {!isNew && id && (
        <VersionHistoryDialog open={showVersionHistory} onOpenChange={setShowVersionHistory} formatoId={id} />
      )}
    </div>
  );
}
