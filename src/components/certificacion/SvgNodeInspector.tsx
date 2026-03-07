import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { SvgEditableNode } from "@/types/certificado";

interface Props {
  node: SvgEditableNode;
  onChange: (updated: SvgEditableNode) => void;
}

export default function SvgNodeInspector({ node, onChange }: Props) {
  const updateAttr = (key: string, value: string) => {
    onChange({ ...node, attrs: { ...node.attrs, [key]: value } });
  };

  if (node.type === 'group') {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Grupo: {node.id}</h3>
        <Separator />
        <div className="flex items-center justify-between">
          <Label>Visible</Label>
          <Switch checked={node.visible} onCheckedChange={(v) => onChange({ ...node, visible: v })} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Texto: {node.id}</h3>
      <Separator />

      <div className="space-y-2">
        <Label className="text-xs">Contenido</Label>
        <Input
          value={node.content || ''}
          onChange={(e) => onChange({ ...node, content: e.target.value })}
          placeholder="Texto o {{token}}"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Tamaño fuente</Label>
          <Input type="number" value={node.attrs.fontSize || ''} onChange={(e) => updateAttr('fontSize', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Peso fuente</Label>
          <Select value={node.attrs.fontWeight || 'normal'} onValueChange={(v) => updateAttr('fontWeight', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="600">600</SelectItem>
              <SelectItem value="700">700</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Color (fill)</Label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={node.attrs.fill || '#000000'}
              onChange={(e) => updateAttr('fill', e.target.value)}
              className="h-8 w-8 rounded border border-input cursor-pointer"
            />
            <Input value={node.attrs.fill || ''} onChange={(e) => updateAttr('fill', e.target.value)} className="flex-1" />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Alineación</Label>
          <Select value={node.attrs.textAnchor || 'start'} onValueChange={(v) => updateAttr('textAnchor', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="start">Inicio</SelectItem>
              <SelectItem value="middle">Centro</SelectItem>
              <SelectItem value="end">Fin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">X</Label>
          <Input type="number" value={node.attrs.x || ''} onChange={(e) => updateAttr('x', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Y</Label>
          <Input type="number" value={node.attrs.y || ''} onChange={(e) => updateAttr('y', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
