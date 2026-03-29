import type { Bloque, TipoBloque } from '@/types/formatoFormacion';
import { COMPLEX_TYPES } from '@/data/bloqueConstants';
import { AUTO_FIELD_CATALOG, AUTO_FIELD_CATEGORIES } from '@/data/autoFieldCatalog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  SelectGroup, SelectLabel,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface InspectorFieldsProps {
  bloque: Bloque;
  onChange: (updates: Partial<Bloque>) => void;
}

const HIDE_REQUIRED: TipoBloque[] = [
  'section_title', 'heading', 'paragraph', 'divider',
  'signature_aprendiz', 'signature_entrenador_auto', 'signature_supervisor_auto',
  ...COMPLEX_TYPES,
];

export default function InspectorFields({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;

  return (
    <div className="space-y-4">
      {/* Label */}
      {bloque.type !== 'divider' && (
        <div className="space-y-1.5">
          <Label className="text-xs">Etiqueta</Label>
          <Input
            value={bloque.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Etiqueta del campo"
            className="h-9 text-sm"
          />
        </div>
      )}

      {/* Required toggle */}
      {!HIDE_REQUIRED.includes(bloque.type) && (
        <div className="flex items-center justify-between">
          <Label className="text-xs">Obligatorio</Label>
          <Switch
            checked={bloque.required ?? false}
            onCheckedChange={(v) => onChange({ required: v })}
          />
        </div>
      )}

      {/* Type-specific */}
      <TypeSpecific bloque={bloque} onChange={onChange} />
    </div>
  );
}

function TypeSpecific({ bloque, onChange }: InspectorFieldsProps) {
  const b = bloque as any;

  switch (bloque.type) {
    case 'heading': {
      const level = b.props?.level ?? 2;
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Nivel</Label>
          <Select value={String(level)} onValueChange={(v) => onChange({ props: { level: Number(v) } } as any)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1 — Grande</SelectItem>
              <SelectItem value="2">H2 — Mediano</SelectItem>
              <SelectItem value="3">H3 — Pequeño</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    case 'paragraph':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Texto del párrafo</Label>
          <Textarea
            value={b.props?.text ?? ''}
            onChange={(e) => onChange({ props: { text: e.target.value } } as any)}
            placeholder="Contenido del párrafo..."
            className="min-h-[120px] text-sm"
          />
        </div>
      );

    case 'text':
    case 'textarea':
    case 'email':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={b.props?.placeholder ?? ''}
            onChange={(e) => onChange({ props: { ...b.props, placeholder: e.target.value } } as any)}
            placeholder="Texto de ayuda..."
            className="h-9 text-sm"
          />
        </div>
      );

    case 'number':
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Mínimo</Label>
            <Input
              type="number"
              value={b.props?.min ?? ''}
              onChange={(e) => onChange({ props: { ...b.props, min: e.target.value === '' ? undefined : Number(e.target.value) } } as any)}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Máximo</Label>
            <Input
              type="number"
              value={b.props?.max ?? ''}
              onChange={(e) => onChange({ props: { ...b.props, max: e.target.value === '' ? undefined : Number(e.target.value) } } as any)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      );

    case 'radio':
    case 'select': {
      const options: { value: string; label: string }[] = b.props?.options ?? [];
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Opciones</Label>
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    value={opt.label}
                    onChange={(e) => {
                      const updated = options.map((o, i) => i === idx ? { ...o, label: e.target.value } : o);
                      onChange({ props: { ...b.props, options: updated } } as any);
                    }}
                    placeholder="Etiqueta"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={opt.value}
                    onChange={(e) => {
                      const updated = options.map((o, i) => i === idx ? { ...o, value: e.target.value } : o);
                      onChange({ props: { ...b.props, options: updated } } as any);
                    }}
                    placeholder="Valor"
                    className="h-8 text-sm font-mono text-muted-foreground"
                  />
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (options.length <= 1) return;
                    onChange({ props: { ...b.props, options: options.filter((_, i) => i !== idx) } } as any);
                  }}
                  disabled={options.length <= 1}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline" size="sm" className="w-full"
            onClick={() => {
              const n = options.length + 1;
              onChange({ props: { ...b.props, options: [...options, { value: `opcion_${n}`, label: `Opción ${n}` }] } } as any);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar opción
          </Button>
        </div>
      );
    }

    case 'auto_field': {
      const currentKey = b.props?.key ?? '';
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Campo del sistema</Label>
            <Select
              value={currentKey}
              onValueChange={(v) => onChange({ props: { ...b.props, key: v } } as any)}
            >
              <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar campo..." /></SelectTrigger>
              <SelectContent>
                {AUTO_FIELD_CATEGORIES.map((cat) => (
                  <SelectGroup key={cat}>
                    <SelectLabel>{cat}</SelectLabel>
                    {AUTO_FIELD_CATALOG.filter((f) => f.category === cat).map((f) => (
                      <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">Auto</Badge>
            <p className="text-xs text-blue-700">Se llena automáticamente desde el sistema</p>
          </div>
        </div>
      );
    }

    case 'file':
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">Tipos aceptados</Label>
          <Input
            value={b.props?.accept ?? '.pdf,.jpg,.png'}
            onChange={(e) => onChange({ props: { ...b.props, accept: e.target.value } } as any)}
            placeholder=".pdf,.jpg,.png"
            className="h-9 text-sm font-mono"
          />
        </div>
      );

    case 'signature_aprendiz':
      return <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">Reutiliza la firma capturada en Información del Aprendiz.</p>;

    case 'signature_entrenador_auto':
      return <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">Firma automática desde Gestión de Personal (entrenador del curso).</p>;

    case 'signature_supervisor_auto':
      return <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">Firma automática desde Gestión de Personal (supervisor del curso).</p>;

    default:
      if (COMPLEX_TYPES.includes(bloque.type)) {
        return <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">Componente especializado — configuración avanzada.</p>;
      }
      return null;
  }
}
