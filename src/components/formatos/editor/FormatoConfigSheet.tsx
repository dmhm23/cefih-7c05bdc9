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
import { CategoriaFormato, AsignacionScope, ModoDiligenciamiento } from '@/types/formatoFormacion';
import { useNivelesFormacion } from '@/hooks/useNivelesFormacion';
import { cn } from '@/lib/utils';

const CATEGORIA_OPTIONS: { value: CategoriaFormato; label: string }[] = [
  { value: 'formacion', label: 'Formación' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'asistencia', label: 'Asistencia' },
  { value: 'pta_ats', label: 'PTA / ATS' },
  { value: 'personalizado', label: 'Personalizado' },
];

const MODO_DILIGENCIAMIENTO_OPTIONS: { value: ModoDiligenciamiento; label: string; description: string }[] = [
  { value: 'manual_estudiante', label: 'Manual — Estudiante', description: 'Lo diligencia el estudiante desde el portal' },
  { value: 'manual_admin', label: 'Manual — Administrativo', description: 'Lo diligencia el entrenador o administrador' },
  { value: 'automatico_sistema', label: 'Automático — Sistema', description: 'Se genera automáticamente según datos del curso (ej: asistencia por días)' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FormatoConfigSheet({ open, onOpenChange }: Props) {
  const { config, setConfig, items, updateBlock } = useFormatoEditorStore();
  const { data: niveles = [] } = useNivelesFormacion();

  const toggleNivel = (id: string) => {
    setConfig({
      nivelFormacionIds: config.nivelFormacionIds.includes(id)
        ? config.nivelFormacionIds.filter((n) => n !== id)
        : [...config.nivelFormacionIds, id],
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[480px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Ajustes del Formato</SheetTitle>
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
                  <SelectItem value="todos">Todos los niveles de formación</SelectItem>
                  <SelectItem value="nivel_formacion">Por nivel de formación</SelectItem>
                </SelectContent>
              </Select>
              {config.asignacionScope === 'nivel_formacion' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {niveles.map((nivel) => (
                    <button
                      key={nivel.id}
                      type="button"
                      onClick={() => toggleNivel(nivel.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                        config.nivelFormacionIds.includes(nivel.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary/50'
                      )}
                    >
                      {nivel.nombreNivel}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Visibility & Filing */}
            <div className="space-y-4">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Visibilidad y Diligenciamiento</Label>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Switch checked={config.visibleEnMatricula} onCheckedChange={(v) => setConfig({ visibleEnMatricula: v })} className="mt-0.5" />
                  <div>
                    <Label className="text-sm">Visible en Matrícula</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">El formato aparece en la ficha de matrícula mostrando su estado (borrador/completo)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Switch checked={config.visibleEnCurso} onCheckedChange={(v) => setConfig({ visibleEnCurso: v })} className="mt-0.5" />
                  <div>
                    <Label className="text-sm">Visible en Curso</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">El formato aparece en la vista del curso para consulta administrativa</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Switch checked={config.visibleEnPortalEstudiante} onCheckedChange={(v) => setConfig({ visibleEnPortalEstudiante: v })} className="mt-0.5" />
                  <div>
                    <Label className="text-sm">Visible en Portal Estudiante</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">El estudiante puede ver y diligenciar este formato desde su portal</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Switch checked={config.activo} onCheckedChange={(v) => setConfig({ activo: v })} className="mt-0.5" />
                  <div>
                    <Label className="text-sm">Activo</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Habilita o deshabilita el formato para su uso</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Modo de diligenciamiento</Label>
                <Select value={config.modoDiligenciamiento} onValueChange={(v) => setConfig({ modoDiligenciamiento: v as ModoDiligenciamiento })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODO_DILIGENCIAMIENTO_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {MODO_DILIGENCIAMIENTO_OPTIONS.find((o) => o.value === config.modoDiligenciamiento)?.description}
                </p>
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
