import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Save, Eye, GripVertical, Trash2, Copy, Plus } from "lucide-react";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from "@/components/ui/select";
import { AUTO_FIELD_CATALOG, AUTO_FIELD_CATEGORIES, getAutoFieldLabel, getAutoFieldOption } from "@/data/autoFieldCatalog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import FormatoPreviewDialog from "@/components/formatos/FormatoPreviewDialog";
import { useToast } from "@/hooks/use-toast";
import { useFormato, useUpdateFormato, useCreateFormato } from "@/hooks/useFormatosFormacion";
import {
  FormatoFormacion,
  FormatoFormacionFormData,
  Bloque,
  TipoBloque,
  AsignacionScope,
} from "@/types/formatoFormacion";
import { TipoFormacion, TIPO_FORMACION_LABELS } from "@/types/curso";
import { v4 as uuidv4 } from "uuid";

// Constants imported from @/data/bloqueConstants

const TIPO_CURSO_OPTIONS = Object.entries(TIPO_FORMACION_LABELS) as [TipoFormacion, string][];

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
// Palette draggable item
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

// ---------------------------------------------------------------------------
// Palette overlay ghost (for DragOverlay)
// ---------------------------------------------------------------------------

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
// Block item components
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

  // Subtext logic
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
      {/* Drag handle */}
      <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing touch-none">
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      </div>

      {/* Central info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {bloque.label || <span className="italic text-muted-foreground font-normal">Sin etiqueta</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtext}</p>
      </div>

      {/* Chips */}
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

      {/* Hover actions */}
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.bloque.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <BloqueItemContent {...props} dragHandleProps={listeners} />
    </div>
  );
}

function BloqueItemOverlay({ bloque }: { bloque: Bloque }) {
  const isComplex = COMPLEX_TYPES.includes(bloque.type);
  let subtext = BLOQUE_TYPE_LABELS[bloque.type] || bloque.type;

  return (
    <div className="flex items-center gap-3 p-4 border-2 border-primary rounded-[10px] bg-background shadow-lg opacity-95">
      <GripVertical className="h-4 w-4 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {bloque.label || <span className="italic text-muted-foreground font-normal">Sin etiqueta</span>}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtext}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {bloque.type === "auto_field" && (
          <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">Auto</Badge>
        )}
        {bloque.required && (
          <Badge variant="secondary" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">Obligatorio</Badge>
        )}
        {isComplex && (
          <Badge variant="secondary" className="text-[10px]">Complejo</Badge>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Droppable canvas zone (for empty canvas)
// ---------------------------------------------------------------------------

function DroppableCanvasZone() {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-drop-zone" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "text-center py-12 border-2 border-dashed rounded-xl bg-background transition-colors",
        isOver ? "border-primary bg-primary/5" : ""
      )}
    >
      <p className="text-muted-foreground">
        Agrega bloques desde el panel lateral para construir el formato
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview dialog
// ---------------------------------------------------------------------------

// PreviewDialog replaced by FormatoPreviewDialog component

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

  // --- Dirty state ---
  const [isDirty, setIsDirty] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const markDirty = useCallback(() => setIsDirty(true), []);

  const wrap = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (v: React.SetStateAction<T>) => { setter(v); markDirty(); };

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
    }
  }, [existing]);

  const handleSave = async () => {
    if (!nombre.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" });
      return;
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
      requiereFirmaAprendiz: firmaAprendiz,
      requiereFirmaEntrenador: firmaEntrenador,
      requiereFirmaSupervisor: firmaSupervisor,
      bloques,
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

  const toggleTipoCurso = (key: TipoFormacion) => {
    setTipoCursoKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Block operations
  const addBloque = (type: TipoBloque) => {
    setBloques((prev) => [...prev, createDefaultBloque(type)]);
    markDirty();
  };

  const updateBloque = (index: number, updated: Bloque) => {
    setBloques((prev) => prev.map((b, i) => (i === index ? updated : b)));
    markDirty();
  };

  const deleteBloque = (index: number) => {
    setBloques((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const duplicateBloque = (index: number) => {
    const original = bloques[index];
    const copy = { ...original, id: uuidv4() };
    setBloques((prev) => [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]);
    markDirty();
  };

  // Drag and drop (elevated to cover palette + canvas)
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeIdStr = String(active.id);

    // Drag from palette
    if (activeIdStr.startsWith("palette-")) {
      if (over) {
        const type = activeIdStr.replace("palette-", "") as TipoBloque;
        const newBloque = createDefaultBloque(type);
        const overIdStr = String(over.id);

        if (overIdStr === "canvas-drop-zone") {
          // Drop on empty canvas zone
          setBloques((prev) => [...prev, newBloque]);
        } else {
          const overIndex = bloques.findIndex((b) => b.id === over.id);
          if (overIndex >= 0) {
            setBloques((prev) => [
              ...prev.slice(0, overIndex + 1),
              newBloque,
              ...prev.slice(overIndex + 1),
            ]);
          } else {
            setBloques((prev) => [...prev, newBloque]);
          }
        }
        markDirty();
        setSelectedBloqueId(newBloque.id);
      }
      setActiveId(null);
      return;
    }

    // Reorder existing blocks
    if (over && active.id !== over.id) {
      const oldIndex = bloques.findIndex((b) => b.id === active.id);
      const newIndex = bloques.findIndex((b) => b.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        setBloques(arrayMove(bloques, oldIndex, newIndex));
        markDirty();
      }
    }
    setActiveId(null);
  };

  const activeDragBloque = activeId ? bloques.find((b) => b.id === activeId) ?? null : null;
  const activePaletteType = activeId?.startsWith("palette-") ? activeId.replace("palette-", "") as TipoBloque : null;

  const handleCanvasScroll = () => {
    if (canvasRef.current) {
      setIsScrolled(canvasRef.current.scrollTop > 8);
    }
  };

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

  const formatoPreview: Partial<FormatoFormacion> = { nombre, descripcion, codigo, version, bloques };
  const isSaving = updateMutation.isPending || createMutation.isPending;
  const selectedBloque = selectedBloqueId ? bloques.find(b => b.id === selectedBloqueId) ?? null : null;
  const selectedIndex = selectedBloqueId ? bloques.findIndex(b => b.id === selectedBloqueId) : -1;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/30">
      {/* ── HEADER STICKY ── */}
      <header
        className={`sticky top-0 z-50 h-16 shrink-0 border-b bg-background px-6 flex items-center gap-4 transition-shadow ${
          isScrolled ? "shadow-md" : "shadow-sm"
        }`}
      >
        {/* Left: Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">SAFA</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/gestion-formatos">Gestión de Formatos</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{isNew ? "Nuevo" : "Editar"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Center: Name */}
        <div className="flex-1 min-w-0 text-center">
          <p className="text-lg font-semibold truncate">
            {nombre || "Sin nombre"}
          </p>
        </div>

        {/* Right: Status + Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {isDirty && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Cambios sin guardar
            </Badge>
          )}
          {!isDirty && savedOnce && (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
              Guardado
            </Badge>
          )}

          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </header>

      {/* ── BODY: DndContext wraps canvas + panel ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas */}
          <div
            ref={canvasRef}
            onScroll={handleCanvasScroll}
            className="flex-1 overflow-y-auto bg-[hsl(var(--muted)/0.3)] p-8"
          >
            <div
              className="max-w-[900px] mx-auto space-y-4"
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedBloqueId(null); }}
            >
              {/* A. Configuración General */}
              <Card className="bg-background rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Configuración General</CardTitle>
                </CardHeader>
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
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
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
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              tipoCursoKeys.includes(key)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-border hover:border-primary/50"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                </CardContent>
              </Card>

              {/* B. Firmas */}
              <Card className="bg-background rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Firmas Requeridas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={firmaAprendiz} onCheckedChange={(c) => { setFirmaAprendiz(!!c); markDirty(); }} id="f-apr" />
                      <Label htmlFor="f-apr">Firma del aprendiz</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={firmaEntrenador} onCheckedChange={(c) => { setFirmaEntrenador(!!c); markDirty(); }} id="f-ent" />
                      <Label htmlFor="f-ent">Firma del entrenador</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox checked={firmaSupervisor} onCheckedChange={(c) => { setFirmaSupervisor(!!c); markDirty(); }} id="f-sup" />
                      <Label htmlFor="f-sup">Firma del supervisor</Label>
                    </div>
                    {(firmaEntrenador || firmaSupervisor) && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                        💡 Las firmas de entrenador y supervisor se obtienen automáticamente desde el módulo de Gestión de Personal, a través del curso asociado.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* C. Bloques */}
              <div className="pt-2">
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  Bloques ({bloques.length})
                </p>
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

          {/* Panel derecho */}
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
                    <PaletteDraggableItem
                      key={item.type}
                      type={item.type}
                      label={item.label}
                      onClickAdd={() => addBloque(item.type)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>

        {/* DragOverlay — differentiated for palette vs existing blocks */}
        <DragOverlay>
          {activeDragBloque ? (
            <BloqueItemOverlay bloque={activeDragBloque} />
          ) : activePaletteType ? (
            <PaletteOverlayGhost type={activePaletteType} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Preview */}
      <FormatoPreviewDialog open={showPreview} onOpenChange={setShowPreview} formato={formatoPreview} />
    </div>
  );
}
