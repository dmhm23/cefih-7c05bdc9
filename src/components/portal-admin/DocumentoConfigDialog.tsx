import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { TipoFormacion } from '@/types/curso';
import { mockNivelesFormacion } from '@/data/mockData';
import { resolveNivelCursoLabel } from '@/utils/resolveNivelLabel';
import { TipoDocPortal } from '@/types/portalEstudiante';

const TIPO_DOC_OPTIONS: { value: TipoDocPortal; label: string }[] = [
  { value: 'firma_autorizacion', label: 'Firma / Autorización' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'formulario', label: 'Formulario' },
  { value: 'solo_lectura', label: 'Solo lectura' },
];

const NIVELES: TipoFormacion[] = ['reentrenamiento', 'jefe_area', 'trabajador_autorizado', 'coordinador_ta'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documento?: PortalDocumentoConfigAdmin | null;
  existingKeys: string[];
  allDocumentos: PortalDocumentoConfigAdmin[];
  onSave: (doc: PortalDocumentoConfigAdmin) => void;
}

export function DocumentoConfigDialog({ open, onOpenChange, documento, existingKeys, allDocumentos, onSave }: Props) {
  const isEdit = !!documento;

  const [key, setKey] = useState(documento?.key || '');
  const [nombre, setNombre] = useState(documento?.nombre || '');
  const [tipo, setTipo] = useState<TipoDocPortal>(documento?.tipo || 'formulario');
  const [requiereFirma, setRequiereFirma] = useState(documento?.requiereFirma || false);
  const [dependeDe, setDependeDe] = useState<string[]>(documento?.dependeDe || []);
  const defaultNiveles: Record<TipoFormacion, boolean> = {
    reentrenamiento: true,
    jefe_area: true,
    trabajador_autorizado: true,
    coordinador_ta: true,
  };
  const [habilitadoPorNivel, setHabilitadoPorNivel] = useState<Record<TipoFormacion, boolean>>(
    documento?.habilitadoPorNivel || defaultNiveles
  );

  useEffect(() => {
    if (open) {
      setKey(documento?.key || '');
      setNombre(documento?.nombre || '');
      setTipo(documento?.tipo || 'formulario');
      setRequiereFirma(documento?.requiereFirma || false);
      setDependeDe(documento?.dependeDe || []);
      setHabilitadoPorNivel(documento?.habilitadoPorNivel || defaultNiveles);
    }
  }, [open, documento]);

  const handleSave = () => {
    if (!key.trim() || !nombre.trim()) return;
    onSave({
      key: key.trim(),
      nombre: nombre.trim(),
      tipo,
      requiereFirma,
      dependeDe,
      orden: documento?.orden || existingKeys.length + 1,
      habilitadoPorNivel,
    });
    onOpenChange(false);
  };

  const toggleDep = (depKey: string) => {
    setDependeDe(prev =>
      prev.includes(depKey) ? prev.filter(k => k !== depKey) : [...prev, depKey]
    );
  };

  const toggleNivel = (nivel: TipoFormacion) => {
    setHabilitadoPorNivel(prev => ({ ...prev, [nivel]: !prev[nivel] }));
  };

  const otherDocs = allDocumentos.filter(d => d.key !== key);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar documento' : 'Agregar documento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Clave única</Label>
            <Input
              value={key}
              onChange={e => setKey(e.target.value.replace(/[^a-z0-9_]/g, ''))}
              placeholder="ej: consentimiento_salud"
              disabled={isEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Nombre visible</Label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Consentimiento de Salud" />
          </div>

          <div className="space-y-1.5">
            <Label>Tipo de documento</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as TipoDocPortal)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPO_DOC_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Requiere firma</Label>
            <Switch checked={requiereFirma} onCheckedChange={setRequiereFirma} />
          </div>

          {otherDocs.length > 0 && (
            <div className="space-y-1.5">
              <Label>Depende de</Label>
              <div className="space-y-2">
                {otherDocs.map(d => (
                  <label key={d.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={dependeDe.includes(d.key)}
                      onCheckedChange={() => toggleDep(d.key)}
                    />
                    {d.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Habilitado por nivel</Label>
            <div className="space-y-2">
              {NIVELES.map(nivel => (
                <label key={nivel} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={habilitadoPorNivel[nivel]}
                    onCheckedChange={() => toggleNivel(nivel)}
                  />
                  {TIPO_FORMACION_LABELS[nivel]}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!key.trim() || !nombre.trim()}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
