import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { useFormatoEditorStore } from '@/stores/useFormatoEditorStore';
import { CategoriaFormato, AsignacionScope, ModoDiligenciamiento, TipoDependencia, CondicionDependencia, EventoDisparador } from '@/types/formatoFormacion';
import { useNivelesFormacion } from '@/hooks/useNivelesFormacion';
import { useFormatos } from '@/hooks/useFormatosFormacion';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';

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

const TIPO_DEPENDENCIA_LABELS: Record<TipoDependencia, string> = {
  activacion: 'Activación',
  datos: 'Herencia de datos',
  precondicion: 'Precondición',
};

const CONDICION_LABELS: Record<CondicionDependencia, string> = {
  completado: 'Completado',
  firmado: 'Firmado',
  aprobado: 'Aprobado',
};

const EVENTO_LABELS: Record<EventoDisparador, string> = {
  asignacion_curso: 'Asignación a curso',
  cierre_curso: 'Cierre de curso',
  firma_completada: 'Firma completada',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FormatoConfigSheet({ open, onOpenChange }: Props) {
  const { config, setConfig, items, updateBlock } = useFormatoEditorStore();
  const { data: niveles = [] } = useNivelesFormacion();
  const { data: allFormatos = [] } = useFormatos();
  const [addingDep, setAddingDep] = useState(false);
  const [newDepFormatoId, setNewDepFormatoId] = useState('');
  const [newDepTipo, setNewDepTipo] = useState<TipoDependencia>('precondicion');
  const [newDepCondicion, setNewDepCondicion] = useState<CondicionDependencia>('completado');

  // Exclude self from dependency options
  const formatoOptions = useMemo(() =>
    allFormatos.filter(f => f.id !== (window.location.pathname.split('/').pop() || '')),
    [allFormatos]
  );

  const toggleNivel = (id: string) => {
    setConfig({
      nivelFormacionIds: config.nivelFormacionIds.includes(id)
        ? config.nivelFormacionIds.filter((n) => n !== id)
        : [...config.nivelFormacionIds, id],
    });
  };

  const addDependencia = () => {
    if (!newDepFormatoId) return;
    const deps = [...config.dependencias, { formatoId: newDepFormatoId, tipo: newDepTipo, condicion: newDepCondicion }];
    setConfig({ dependencias: deps });
    setAddingDep(false);
    setNewDepFormatoId('');
  };

  const removeDependencia = (index: number) => {
    const deps = config.dependencias.filter((_, i) => i !== index);
    setConfig({ dependencias: deps });
  };

  const toggleEvento = (evento: EventoDisparador) => {
    const current = config.eventosDisparadores || [];
    const updated = current.includes(evento)
      ? current.filter(e => e !== evento)
      : [...current, evento];
    setConfig({ eventosDisparadores: updated });
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

            {/* Dependencias */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Dependencias entre Formatos</Label>
              <p className="text-xs text-muted-foreground">
                Define qué formatos deben estar completados, firmados o aprobados antes de que este se active.
              </p>

              {config.dependencias.length > 0 && (
                <div className="space-y-2">
                  {config.dependencias.map((dep, i) => {
                    const fmt = allFormatos.find(f => f.id === dep.formatoId);
                    return (
                      <div key={i} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{fmt?.nombre || dep.formatoId}</p>
                          <div className="flex gap-1 mt-0.5">
                            <Badge variant="outline" className="text-[10px] py-0">{TIPO_DEPENDENCIA_LABELS[dep.tipo]}</Badge>
                            <Badge variant="secondary" className="text-[10px] py-0">{CONDICION_LABELS[dep.condicion]}</Badge>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeDependencia(i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {addingDep ? (
                <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                  <Select value={newDepFormatoId} onValueChange={setNewDepFormatoId}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar formato..." /></SelectTrigger>
                    <SelectContent>
                      {formatoOptions.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Select value={newDepTipo} onValueChange={(v) => setNewDepTipo(v as TipoDependencia)}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="precondicion">Precondición</SelectItem>
                        <SelectItem value="activacion">Activación</SelectItem>
                        <SelectItem value="datos">Herencia de datos</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newDepCondicion} onValueChange={(v) => setNewDepCondicion(v as CondicionDependencia)}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completado">Completado</SelectItem>
                        <SelectItem value="firmado">Firmado</SelectItem>
                        <SelectItem value="aprobado">Aprobado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setAddingDep(false)}>Cancelar</Button>
                    <Button size="sm" onClick={addDependencia} disabled={!newDepFormatoId}>Agregar</Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setAddingDep(true)} className="w-full">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Agregar dependencia
                </Button>
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

            {/* Eventos disparadores (para formatos automáticos) */}
            {config.modoDiligenciamiento === 'automatico_sistema' && (
              <>
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Eventos Disparadores</Label>
                  <p className="text-xs text-muted-foreground">
                    Selecciona los eventos que generan automáticamente una instancia de este formato.
                  </p>
                  <div className="space-y-2">
                    {(Object.keys(EVENTO_LABELS) as EventoDisparador[]).map(evento => (
                      <div key={evento} className="flex items-center gap-2">
                        <Checkbox
                          checked={(config.eventosDisparadores || []).includes(evento)}
                          onCheckedChange={() => toggleEvento(evento)}
                        />
                        <Label className="text-sm">{EVENTO_LABELS[evento]}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Signature Origin */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Firma Reutilizable</Label>
              <div className="flex items-start gap-3">
                <Switch checked={config.esOrigenFirma ?? false} onCheckedChange={(v) => setConfig({ esOrigenFirma: v } as any)} className="mt-0.5" />
                <div>
                  <Label className="text-sm">Es origen de firma</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    La firma capturada en este formato podrá reutilizarse en otros formatos de la misma matrícula, si el estudiante autoriza explícitamente.
                  </p>
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
