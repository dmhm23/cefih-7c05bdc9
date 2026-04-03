import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { TipoFormacion } from '@/types/curso';
import { TipoDocPortal } from '@/types/portalEstudiante';
import { useFormatos } from '@/hooks/useFormatosFormacion';
import { useNivelesFormacion } from '@/hooks/useNivelesFormacion';

const TIPO_DOC_OPTIONS: { value: TipoDocPortal; label: string }[] = [
  { value: 'firma_autorizacion', label: 'Firma / Autorización' },
  { value: 'evaluacion', label: 'Evaluación' },
  { value: 'formulario', label: 'Formulario' },
  { value: 'solo_lectura', label: 'Solo lectura' },
];

function categoriaToPorTipo(categoria: string): TipoDocPortal {
  switch (categoria) {
    case 'evaluacion': return 'evaluacion';
    case 'seguridad': return 'firma_autorizacion';
    case 'formacion':
    default: return 'formulario';
  }
}

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
  const { data: formatos, isLoading: loadingFormatos } = useFormatos();

  const [selectedFormatoId, setSelectedFormatoId] = useState('');
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

  // Filter formatos: only visible_en_portal_estudiante + activo, exclude already added
  const availableFormatos = useMemo(() => {
    if (!formatos) return [];
    return formatos.filter(f =>
      f.visibleEnPortalEstudiante &&
      f.activo &&
      f.estado !== 'archivado' &&
      !existingKeys.includes(f.id)
    );
  }, [formatos, existingKeys]);

  const formatoOptions = useMemo(() =>
    availableFormatos.map(f => ({ value: f.id, label: f.nombre })),
    [availableFormatos]
  );

  useEffect(() => {
    if (open) {
      setSelectedFormatoId('');
      setNombre(documento?.nombre || '');
      setTipo(documento?.tipo || 'formulario');
      setRequiereFirma(documento?.requiereFirma || false);
      setDependeDe(documento?.dependeDe || []);
      setHabilitadoPorNivel(documento?.habilitadoPorNivel || defaultNiveles);
    }
  }, [open, documento]);

  // When a formato is selected, auto-fill fields
  useEffect(() => {
    if (!selectedFormatoId || isEdit) return;
    const formato = formatos?.find(f => f.id === selectedFormatoId);
    if (formato) {
      setNombre(formato.nombre);
      setTipo(categoriaToPorTipo(formato.categoria));
      setRequiereFirma(formato.requiereFirmaAprendiz);
    }
  }, [selectedFormatoId, formatos, isEdit]);

  const handleSave = () => {
    const key = isEdit ? documento!.key : selectedFormatoId;
    if (!key || !nombre.trim()) return;
    onSave({
      key,
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

  const currentKey = isEdit ? documento!.key : selectedFormatoId;
  const otherDocs = allDocumentos.filter(d => d.key !== currentKey);

  const canSave = isEdit ? !!nombre.trim() : !!selectedFormatoId && !!nombre.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar documento' : 'Agregar documento del portal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Formato de formación</Label>
              <Combobox
                options={formatoOptions}
                value={selectedFormatoId}
                onValueChange={setSelectedFormatoId}
                placeholder={loadingFormatos ? 'Cargando formatos...' : 'Seleccionar formato...'}
                searchPlaceholder="Buscar formato..."
                emptyMessage="No hay formatos disponibles para el portal"
                disabled={loadingFormatos}
              />
              {availableFormatos.length === 0 && !loadingFormatos && (
                <p className="text-xs text-muted-foreground">
                  No hay formatos con "Visible en portal estudiante" activo. Activa esta opción en Gestión de Formatos.
                </p>
              )}
            </div>
          )}

          {(isEdit || selectedFormatoId) && (
            <>
              <div className="space-y-1.5">
                <Label>Nombre visible</Label>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">{nombre}</p>
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
                      {resolveNivelCursoLabel(nivel)}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!canSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
