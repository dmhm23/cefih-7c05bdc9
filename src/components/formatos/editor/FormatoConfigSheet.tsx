import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFormatoEditorStore } from '@/stores/useFormatoEditorStore';
import { TipoFormacion, TIPO_FORMACION_LABELS } from '@/types/curso';
import { CategoriaFormato, AsignacionScope } from '@/types/formatoFormacion';
import { cn } from '@/lib/utils';

const TIPO_CURSO_OPTIONS = Object.entries(TIPO_FORMACION_LABELS) as [TipoFormacion, string][];

const CATEGORIA_OPTIONS: { value: CategoriaFormato; label: string }[] = [
  { value: 'formacion', label: 'Formación' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'asistencia', label: 'Asistencia' },
  { value: 'pta_ats', label: 'PTA / ATS' },
  { value: 'personalizado', label: 'Personalizado' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FormatoConfigSheet({ open, onOpenChange }: Props) {
  const { config, setConfig, items, updateBlock } = useFormatoEditorStore();

  const toggleTipoCurso = (key: TipoFormacion) => {
    setConfig({
      tipoCursoKeys: config.tipoCursoKeys.includes(key)
        ? config.tipoCursoKeys.filter((k) => k !== key)
        : [...config.tipoCursoKeys, key],
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Configuración del Formato</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-5">
            {/* Basic info */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Nombre del formato</Label>
                <Input
                  value={config.nombre}
                  onChange={(e) => {
                    const nombre = e.target.value;
                    setConfig({ nombre });
                    // Sync to document_header block label
                    const headerBlock = items.find((it) => it.type === 'document_header');
                    if (headerBlock) updateBlock(headerBlock.id, { label: nombre });
                  }}
                  placeholder="Ej: Registro de Asistencia"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descripción</Label>
                <Textarea
                  value={config.descripcion}
                  onChange={(e) => setConfig({ descripcion: e.target.value })}
                  placeholder="Descripción breve..."
                  className="min-h-[60px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Código</Label>
                  <Input
                    value={config.codigo}
                    onChange={(e) => setConfig({ codigo: e.target.value })}
                    placeholder="FIH04-XXX"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Versión</Label>
                  <Input
                    value={config.version}
                    onChange={(e) => setConfig({ version: e.target.value })}
                    placeholder="001"
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select value={config.categoria} onValueChange={(v) => setConfig({ categoria: v as CategoriaFormato })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIA_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Scope */}
            <div className="space-y-3">
              <Label>Alcance de asignación</Label>
              <Select value={config.asignacionScope} onValueChange={(v) => setConfig({ asignacionScope: v as AsignacionScope })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tipo_curso">Por tipo de curso</SelectItem>
                  <SelectItem value="nivel_formacion">Por nivel de formación</SelectItem>
                </SelectContent>
              </Select>
              {config.asignacionScope === 'tipo_curso' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {TIPO_CURSO_OPTIONS.map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleTipoCurso(key)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                        config.tipoCursoKeys.includes(key)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Visibility */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Visibilidad</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch checked={config.visibleEnMatricula} onCheckedChange={(v) => setConfig({ visibleEnMatricula: v })} />
                  <Label className="text-sm">Visible en Matrícula</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.visibleEnCurso} onCheckedChange={(v) => setConfig({ visibleEnCurso: v })} />
                  <Label className="text-sm">Visible en Curso</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.activo} onCheckedChange={(v) => setConfig({ activo: v })} />
                  <Label className="text-sm">Activo</Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Signatures */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Firmas Requeridas</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={config.requiereFirmaAprendiz} onCheckedChange={(c) => setConfig({ requiereFirmaAprendiz: !!c })} />
                  <Label className="text-sm">Aprendiz</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={config.requiereFirmaEntrenador} onCheckedChange={(c) => setConfig({ requiereFirmaEntrenador: !!c })} />
                  <Label className="text-sm">Entrenador</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={config.requiereFirmaSupervisor} onCheckedChange={(c) => setConfig({ requiereFirmaSupervisor: !!c })} />
                  <Label className="text-sm">Supervisor</Label>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
