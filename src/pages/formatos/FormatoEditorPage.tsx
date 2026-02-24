import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Eye, GripVertical, Trash2, Copy, Plus } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

// ---------------------------------------------------------------------------
// Block palette
// ---------------------------------------------------------------------------

const BLOCK_PALETTE: { type: TipoBloque; label: string; icon: string }[] = [
  { type: "section_title", label: "Título de sección", icon: "📌" },
  { type: "heading", label: "Encabezado", icon: "🔤" },
  { type: "paragraph", label: "Párrafo", icon: "📝" },
  { type: "text", label: "Campo de texto", icon: "✏️" },
  { type: "date", label: "Campo de fecha", icon: "📅" },
  { type: "number", label: "Campo numérico", icon: "🔢" },
  { type: "radio", label: "Opciones (radio)", icon: "🔘" },
  { type: "select", label: "Lista desplegable", icon: "📋" },
  { type: "checkbox", label: "Casilla de verificación", icon: "☑️" },
  { type: "auto_field", label: "Campo automático", icon: "⚡" },
  { type: "signature_aprendiz", label: "Firma aprendiz", icon: "✍️" },
  { type: "signature_entrenador_auto", label: "Firma entrenador", icon: "✍️" },
  { type: "signature_supervisor_auto", label: "Firma supervisor", icon: "✍️" },
];

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
// Block item (inline editor)
// ---------------------------------------------------------------------------

const BLOQUE_TYPE_LABELS: Partial<Record<TipoBloque, string>> = {
  section_title: "Título de sección",
  heading: "Encabezado",
  paragraph: "Párrafo",
  text: "Campo de texto",
  date: "Fecha",
  number: "Numérico",
  radio: "Radio",
  select: "Select",
  checkbox: "Checkbox",
  auto_field: "Automático",
  attendance_by_day: "Asistencia por día",
  signature_aprendiz: "Firma aprendiz",
  signature_entrenador_auto: "Firma entrenador",
  signature_supervisor_auto: "Firma supervisor",
  health_consent: "Consentimiento salud",
  data_authorization: "Autorización datos",
  evaluation_quiz: "Evaluación",
  satisfaction_survey: "Encuesta satisfacción",
};

interface BloqueItemProps {
  bloque: Bloque;
  index: number;
  onChange: (updated: Bloque) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function BloqueItem({ bloque, index, onChange, onDelete, onDuplicate, onMoveUp, onMoveDown, isFirst, isLast }: BloqueItemProps) {
  const isComplex = ["health_consent", "data_authorization", "evaluation_quiz", "satisfaction_survey"].includes(bloque.type);

  return (
    <div className="group flex items-start gap-2 p-3 border rounded-lg bg-card hover:border-primary/30 transition-colors">
      <div className="flex flex-col items-center gap-0.5 pt-1">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
        <span className="text-[10px] text-muted-foreground">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] shrink-0">
            {BLOQUE_TYPE_LABELS[bloque.type] || bloque.type}
          </Badge>
          {isComplex && (
            <Badge variant="secondary" className="text-[10px]">Bloque complejo</Badge>
          )}
          {bloque.required && (
            <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
              Obligatorio
            </Badge>
          )}
        </div>

        <Input
          value={bloque.label}
          onChange={(e) => onChange({ ...bloque, label: e.target.value })}
          placeholder="Etiqueta del bloque..."
          className="h-8 text-sm"
        />

        {bloque.type === "paragraph" && "props" in bloque && (
          <Textarea
            value={(bloque as any).props?.text || ""}
            onChange={(e) =>
              onChange({ ...bloque, props: { ...(bloque as any).props, text: e.target.value } } as Bloque)
            }
            placeholder="Texto del párrafo..."
            className="text-sm min-h-[60px]"
          />
        )}

        {bloque.type === "auto_field" && "props" in bloque && (
          <Select
            value={(bloque as any).props?.key || "nombre_aprendiz"}
            onValueChange={(v) =>
              onChange({ ...bloque, props: { ...(bloque as any).props, key: v } } as Bloque)
            }
          >
            <SelectTrigger className="h-8 text-sm w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre_aprendiz">Nombre aprendiz</SelectItem>
              <SelectItem value="documento_aprendiz">Documento aprendiz</SelectItem>
              <SelectItem value="tipo_documento_aprendiz">Tipo documento</SelectItem>
              <SelectItem value="genero_aprendiz">Género</SelectItem>
              <SelectItem value="fecha_nacimiento_aprendiz">Fecha nacimiento</SelectItem>
              <SelectItem value="pais_nacimiento_aprendiz">País nacimiento</SelectItem>
              <SelectItem value="nivel_educativo_aprendiz">Nivel educativo</SelectItem>
              <SelectItem value="rh_aprendiz">RH</SelectItem>
              <SelectItem value="contacto_emergencia_nombre">Contacto emergencia</SelectItem>
              <SelectItem value="contacto_emergencia_telefono">Tel. emergencia</SelectItem>
              <SelectItem value="empresa_nombre">Empresa</SelectItem>
              <SelectItem value="empresa_cargo">Cargo</SelectItem>
              <SelectItem value="empresa_nivel_formacion">Nivel formación empresa</SelectItem>
              <SelectItem value="area_trabajo">Área de trabajo</SelectItem>
              <SelectItem value="fecha_inicio_curso">Fecha inicio curso</SelectItem>
              <SelectItem value="fecha_fin_curso">Fecha fin curso</SelectItem>
              <SelectItem value="nombre_curso">Nombre curso</SelectItem>
              <SelectItem value="tipo_formacion_curso">Tipo formación</SelectItem>
              <SelectItem value="entrenador_nombre">Entrenador</SelectItem>
              <SelectItem value="supervisor_nombre">Supervisor</SelectItem>
            </SelectContent>
          </Select>
        )}

        {!isComplex && !["signature_aprendiz", "signature_entrenador_auto", "signature_supervisor_auto", "auto_field", "attendance_by_day"].includes(bloque.type) && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={bloque.required || false}
              onCheckedChange={(checked) => onChange({ ...bloque, required: !!checked })}
              id={`req-${bloque.id}`}
            />
            <Label htmlFor={`req-${bloque.id}`} className="text-xs text-muted-foreground">
              Obligatorio
            </Label>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveUp} disabled={isFirst} title="Mover arriba">
          <span className="text-xs">↑</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMoveDown} disabled={isLast} title="Mover abajo">
          <span className="text-xs">↓</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDuplicate} title="Duplicar">
          <Copy className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={onDelete} title="Eliminar">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview dialog
// ---------------------------------------------------------------------------

function PreviewDialog({ open, onOpenChange, formato }: { open: boolean; onOpenChange: (o: boolean) => void; formato: Partial<FormatoFormacion> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa — {formato.nombre || "Sin nombre"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {/* Document header */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground font-mono">
                {formato.codigo || "---"} v{formato.version || "---"}
              </p>
              <p className="font-bold text-lg mt-1">{formato.nombre || "Formato sin nombre"}</p>
              <p className="text-sm text-muted-foreground">{formato.descripcion}</p>
            </div>

            {/* Render blocks preview */}
            {(formato.bloques || []).map((bloque) => (
              <div key={bloque.id} className="space-y-1">
                {bloque.type === "section_title" && (
                  <div className="border-b pb-1 mt-4">
                    <h2 className="text-base font-bold uppercase tracking-widest">
                      {bloque.label || "Sección sin título"}
                    </h2>
                  </div>
                )}
                {bloque.type === "heading" && (
                  <h3 className="text-sm font-bold mt-3">{bloque.label || "Encabezado"}</h3>
                )}
                {bloque.type === "paragraph" && "props" in bloque && (
                  <p className="text-sm leading-relaxed text-justify">
                    {(bloque as any).props?.text || "Texto del párrafo..."}
                  </p>
                )}
                {bloque.type === "auto_field" && (
                  <div className="py-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{bloque.label}</p>
                    <p className="text-sm font-medium text-muted-foreground/50 italic">
                      [Auto: {(bloque as any).props?.key}]
                    </p>
                  </div>
                )}
                {["text", "date", "number"].includes(bloque.type) && (
                  <div className="py-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {bloque.label} {bloque.required && <span className="text-destructive">*</span>}
                    </p>
                    <div className="h-8 border rounded bg-muted/20 mt-1" />
                  </div>
                )}
                {bloque.type === "radio" && "props" in bloque && (
                  <div className="py-1">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{bloque.label}</p>
                    <div className="flex gap-3 mt-1">
                      {((bloque as any).props?.options || []).map((opt: any) => (
                        <div key={opt.value} className="flex items-center gap-1">
                          <div className="h-3.5 w-3.5 rounded-full border" />
                          <span className="text-xs">{opt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {["signature_aprendiz", "signature_entrenador_auto", "signature_supervisor_auto"].includes(bloque.type) && (
                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">{bloque.label}</p>
                    <div className="border-2 border-dashed border-muted rounded h-20 flex items-center justify-center">
                      <p className="text-sm text-muted-foreground italic">Espacio para firma</p>
                    </div>
                  </div>
                )}
                {["health_consent", "data_authorization", "evaluation_quiz", "satisfaction_survey"].includes(bloque.type) && (
                  <div className="border rounded-lg p-3 bg-muted/20 mt-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {BLOQUE_TYPE_LABELS[bloque.type]}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Bloque complejo — se renderiza con su componente especializado
                    </p>
                  </div>
                )}
                {bloque.type === "checkbox" && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="h-4 w-4 border rounded" />
                    <span className="text-sm">{bloque.label}</span>
                  </div>
                )}
              </div>
            ))}

            {(!formato.bloques || formato.bloques.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <p>Sin bloques configurados</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
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
  };

  const updateBloque = (index: number, updated: Bloque) => {
    setBloques((prev) => prev.map((b, i) => (i === index ? updated : b)));
  };

  const deleteBloque = (index: number) => {
    setBloques((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateBloque = (index: number) => {
    const original = bloques[index];
    const copy = { ...original, id: uuidv4() };
    setBloques((prev) => [...prev.slice(0, index + 1), copy, ...prev.slice(index + 1)]);
  };

  const moveBloque = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= bloques.length) return;
    const updated = [...bloques];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setBloques(updated);
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const formatoPreview: Partial<FormatoFormacion> = { nombre, descripcion, codigo, version, bloques };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/gestion-formatos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold">
            {isNew ? "Nuevo Formato" : `Editar: ${existing?.nombre || ""}`}
          </h1>
          {existing?.legacyComponentId && (
            <p className="text-xs text-muted-foreground">
              Formato legacy con componente asociado — los cambios de bloques se reflejarán cuando el renderer genérico reemplace el componente actual
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isNew ? "Crear Formato" : "Guardar Cambios"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        {/* Main content */}
        <div className="space-y-4">
          {/* A. Configuración General */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuración General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Nombre del formato</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Registro de Asistencia" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción breve..." className="min-h-[60px]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Código</Label>
                  <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="FIH04-XXX" className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>Versión</Label>
                  <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="001" className="font-mono" />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Alcance de asignación</Label>
                <Select value={scope} onValueChange={(v) => setScope(v as AsignacionScope)}>
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
                        onClick={() => toggleTipoCurso(key)}
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
                  <Switch checked={visibleEnMatricula} onCheckedChange={setVisibleEnMatricula} id="vis-mat" />
                  <Label htmlFor="vis-mat" className="text-sm">Visible en Matrícula</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={visibleEnCurso} onCheckedChange={setVisibleEnCurso} id="vis-cur" />
                  <Label htmlFor="vis-cur" className="text-sm">Visible en Curso</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={activo} onCheckedChange={setActivo} id="activo" />
                  <Label htmlFor="activo" className="text-sm">Activo</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B. Firmas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Firmas Requeridas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox checked={firmaAprendiz} onCheckedChange={(c) => setFirmaAprendiz(!!c)} id="f-apr" />
                  <Label htmlFor="f-apr">Firma del aprendiz</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={firmaEntrenador} onCheckedChange={(c) => setFirmaEntrenador(!!c)} id="f-ent" />
                  <Label htmlFor="f-ent">Firma del entrenador</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={firmaSupervisor} onCheckedChange={(c) => setFirmaSupervisor(!!c)} id="f-sup" />
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

          {/* C. Constructor de bloques */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Constructor de Bloques
                <Badge variant="secondary" className="ml-2">{bloques.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bloques.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">
                    Agrega bloques desde el panel lateral para construir el formato
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bloques.map((bloque, index) => (
                    <BloqueItem
                      key={bloque.id}
                      bloque={bloque}
                      index={index}
                      onChange={(updated) => updateBloque(index, updated)}
                      onDelete={() => deleteBloque(index)}
                      onDuplicate={() => duplicateBloque(index)}
                      onMoveUp={() => moveBloque(index, -1)}
                      onMoveDown={() => moveBloque(index, 1)}
                      isFirst={index === 0}
                      isLast={index === bloques.length - 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Block palette */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Bloques Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {BLOCK_PALETTE.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addBloque(item.type)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left hover:bg-muted/60 transition-colors border border-transparent hover:border-border"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <Plus className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview */}
      <PreviewDialog open={showPreview} onOpenChange={setShowPreview} formato={formatoPreview} />
    </div>
  );
}
