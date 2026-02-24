import { Bloque, TipoBloque } from "@/types/formatoFormacion";
import { BLOQUE_TYPE_LABELS, BLOQUE_ICONS, COMPLEX_TYPES } from "@/data/bloqueConstants";
import { AUTO_FIELD_CATALOG, AUTO_FIELD_CATEGORIES } from "@/data/autoFieldCatalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Copy, Trash2, Plus, X, ArrowLeft } from "lucide-react";

interface BloqueInspectorProps {
  bloque: Bloque;
  onChange: (updated: Bloque) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBack: () => void;
}

// Helper to get Lucide icon component for a block type
function getBloqueIcon(type: TipoBloque) {
  return BLOQUE_ICONS[type] ?? null;
}

// Editable options list for radio/select
function OptionsEditor({
  options,
  onChange,
}: {
  options: { value: string; label: string }[];
  onChange: (opts: { value: string; label: string }[]) => void;
}) {
  const updateOption = (idx: number, field: "label" | "value", val: string) => {
    const updated = options.map((o, i) => (i === idx ? { ...o, [field]: val } : o));
    onChange(updated);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 1) return;
    onChange(options.filter((_, i) => i !== idx));
  };

  const addOption = () => {
    const n = options.length + 1;
    onChange([...options, { value: `opcion_${n}`, label: `Opción ${n}` }]);
  };

  return (
    <div className="space-y-2">
      {options.map((opt, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <div className="flex-1 space-y-1">
            <Input
              value={opt.label}
              onChange={(e) => updateOption(idx, "label", e.target.value)}
              placeholder="Etiqueta"
              className="h-8 text-sm"
            />
            <Input
              value={opt.value}
              onChange={(e) => updateOption(idx, "value", e.target.value)}
              placeholder="Valor"
              className="h-8 text-sm font-mono text-muted-foreground"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeOption(idx)}
            disabled={options.length <= 1}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="w-full" onClick={addOption}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Agregar opción
      </Button>
    </div>
  );
}

// Type-specific properties
function TypeSpecificProps({ bloque, onChange }: { bloque: Bloque; onChange: (b: Bloque) => void }) {
  const isComplex = COMPLEX_TYPES.includes(bloque.type);

  switch (bloque.type) {
    case "heading": {
      const level = (bloque as any).props?.level ?? 2;
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Nivel</Label>
          <Select
            value={String(level)}
            onValueChange={(v) => onChange({ ...bloque, props: { level: Number(v) as 1 | 2 | 3 } } as any)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1 — Grande</SelectItem>
              <SelectItem value="2">H2 — Mediano</SelectItem>
              <SelectItem value="3">H3 — Pequeño</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    case "paragraph": {
      const text = (bloque as any).props?.text ?? "";
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Texto del párrafo</Label>
          <Textarea
            value={text}
            onChange={(e) => onChange({ ...bloque, props: { text: e.target.value } } as any)}
            placeholder="Contenido del párrafo..."
            className="min-h-[120px] text-sm"
          />
        </div>
      );
    }

    case "text": {
      const placeholder = (bloque as any).props?.placeholder ?? "";
      const multiline = (bloque as any).props?.multiline ?? false;
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Placeholder</Label>
            <Input
              value={placeholder}
              onChange={(e) =>
                onChange({ ...bloque, props: { ...(bloque as any).props, placeholder: e.target.value } } as any)
              }
              placeholder="Texto de ayuda..."
              className="h-9 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Multilínea</Label>
            <Switch
              checked={multiline}
              onCheckedChange={(v) =>
                onChange({ ...bloque, props: { ...(bloque as any).props, multiline: v } } as any)
              }
            />
          </div>
        </div>
      );
    }

    case "number": {
      const min = (bloque as any).props?.min ?? "";
      const max = (bloque as any).props?.max ?? "";
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Mínimo</Label>
            <Input
              type="number"
              value={min}
              onChange={(e) =>
                onChange({
                  ...bloque,
                  props: { ...(bloque as any).props, min: e.target.value === "" ? undefined : Number(e.target.value) },
                } as any)
              }
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Máximo</Label>
            <Input
              type="number"
              value={max}
              onChange={(e) =>
                onChange({
                  ...bloque,
                  props: { ...(bloque as any).props, max: e.target.value === "" ? undefined : Number(e.target.value) },
                } as any)
              }
              className="h-9 text-sm"
            />
          </div>
        </div>
      );
    }

    case "radio":
    case "select": {
      const options = (bloque as any).props?.options ?? [];
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Opciones</Label>
          <OptionsEditor
            options={options}
            onChange={(opts) => onChange({ ...bloque, props: { ...(bloque as any).props, options: opts } } as any)}
          />
        </div>
      );
    }

    case "auto_field": {
      const currentKey = (bloque as any).props?.key ?? "";
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Campo del sistema</Label>
            <Select
              value={currentKey}
              onValueChange={(v) => onChange({ ...bloque, props: { ...(bloque as any).props, key: v } } as any)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar campo..." />
              </SelectTrigger>
              <SelectContent>
                {AUTO_FIELD_CATEGORIES.map((cat) => (
                  <SelectGroup key={cat}>
                    <SelectLabel>{cat}</SelectLabel>
                    {AUTO_FIELD_CATALOG.filter((f) => f.category === cat).map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100">
              Auto
            </Badge>
            <p className="text-xs text-blue-700">Este campo se llena automáticamente desde el sistema</p>
          </div>
        </div>
      );
    }

    case "signature_aprendiz":
      return (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          Reutiliza la firma capturada en Información del Aprendiz. No es editable manualmente.
        </p>
      );

    case "signature_entrenador_auto":
      return (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          Firma tomada automáticamente desde Gestión de Personal (entrenador del curso).
        </p>
      );

    case "signature_supervisor_auto":
      return (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          Firma tomada automáticamente desde Gestión de Personal (supervisor del curso).
        </p>
      );

    default:
      if (isComplex) {
        return (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
            Este bloque complejo se configura con su componente especializado.
          </p>
        );
      }
      return null;
  }
}

// Hide general props for certain types
const HIDE_REQUIRED: TipoBloque[] = ["section_title", "heading", "paragraph", "signature_aprendiz", "signature_entrenador_auto", "signature_supervisor_auto", ...COMPLEX_TYPES];
const HIDE_LABEL: TipoBloque[] = [];

export default function BloqueInspector({ bloque, onChange, onDelete, onDuplicate, onBack }: BloqueInspectorProps) {
  const IconComponent = getBloqueIcon(bloque.type);
  const typeLabel = BLOQUE_TYPE_LABELS[bloque.type] || bloque.type;

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Button variant="ghost" size="sm" className="gap-1 -ml-2 text-muted-foreground" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Paleta
      </Button>

      {/* Header */}
      <div className="flex items-center gap-2">
        {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground" />}
        <p className="text-sm font-semibold flex-1">{typeLabel}</p>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onDuplicate} title="Duplicar">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onDelete} title="Eliminar">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Separator />

      {/* General properties */}
      {!HIDE_LABEL.includes(bloque.type) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Etiqueta</Label>
          <Input
            value={bloque.label}
            onChange={(e) => onChange({ ...bloque, label: e.target.value })}
            placeholder="Etiqueta del campo"
            className="h-10"
          />
        </div>
      )}

      {!HIDE_REQUIRED.includes(bloque.type) && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Campo obligatorio</Label>
          <Switch
            checked={bloque.required ?? false}
            onCheckedChange={(v) => onChange({ ...bloque, required: v })}
          />
        </div>
      )}

      {/* Type-specific */}
      <Separator />
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Propiedades específicas
        </p>
        <TypeSpecificProps bloque={bloque} onChange={onChange} />
        {bloque.type === "checkbox" || bloque.type === "date" || bloque.type === "section_title" ? (
          <p className="text-xs text-muted-foreground italic">Sin propiedades adicionales para este tipo.</p>
        ) : null}
      </div>
    </div>
  );
}
