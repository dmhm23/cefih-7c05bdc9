import { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  CampoAdicional,
  TipoCampoAdicional,
  AlcanceCampo,
  TIPOS_CAMPO_LABELS,
} from "@/types/nivelFormacion";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (campo: CampoAdicional) => void;
  existingNames: string[];
  editingCampo?: CampoAdicional | null;
}

const INITIAL_STATE = {
  nombre: "",
  tipo: "" as TipoCampoAdicional | "",
  obligatorio: false,
  valorPorDefecto: "",
  opciones: ["", ""],
  alcance: "solo_nivel" as AlcanceCampo,
};

export function CampoAdicionalModal({ open, onOpenChange, onSave, existingNames, editingCampo }: Props) {
  const [nombre, setNombre] = useState(INITIAL_STATE.nombre);
  const [tipo, setTipo] = useState<TipoCampoAdicional | "">(INITIAL_STATE.tipo);
  const [obligatorio, setObligatorio] = useState(INITIAL_STATE.obligatorio);
  const [valorPorDefecto, setValorPorDefecto] = useState(INITIAL_STATE.valorPorDefecto);
  const [opciones, setOpciones] = useState<string[]>(INITIAL_STATE.opciones);
  const [alcance, setAlcance] = useState<AlcanceCampo>(INITIAL_STATE.alcance);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showGlobalConfirm, setShowGlobalConfirm] = useState(false);

  const isEdit = !!editingCampo;

  useEffect(() => {
    if (open) {
      if (editingCampo) {
        setNombre(editingCampo.nombre);
        setTipo(editingCampo.tipo);
        setObligatorio(editingCampo.obligatorio);
        setValorPorDefecto(editingCampo.valorPorDefecto || "");
        setOpciones(editingCampo.opciones?.length ? editingCampo.opciones : ["", ""]);
        setAlcance(editingCampo.alcance);
      } else {
        setNombre(INITIAL_STATE.nombre);
        setTipo(INITIAL_STATE.tipo);
        setObligatorio(INITIAL_STATE.obligatorio);
        setValorPorDefecto(INITIAL_STATE.valorPorDefecto);
        setOpciones([...INITIAL_STATE.opciones]);
        setAlcance(INITIAL_STATE.alcance);
      }
      setErrors({});
    }
  }, [open, editingCampo]);

  const showOpciones = tipo === "select" || tipo === "select_multiple";
  const hideValorDefecto = tipo === "archivo" || tipo === "booleano";
  const showEstadoDefault = tipo === "estado";

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const trimmedName = nombre.trim();
    if (!trimmedName) {
      newErrors.nombre = "El nombre es obligatorio";
    } else {
      const duplicateNames = existingNames.filter(
        (n) => n.toLowerCase() === trimmedName.toLowerCase()
      );
      const isNameDuplicate = isEdit
        ? duplicateNames.length > 0 && editingCampo!.nombre.toLowerCase() !== trimmedName.toLowerCase()
        : duplicateNames.length > 0;
      if (isNameDuplicate) {
        newErrors.nombre = "Ya existe un campo con este nombre";
      }
    }
    if (!tipo) {
      newErrors.tipo = "Seleccione un tipo de campo";
    }
    if (showOpciones) {
      const validOpciones = opciones.filter((o) => o.trim());
      if (validOpciones.length < 2) {
        newErrors.opciones = "Se requieren al menos 2 opciones";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (alcance === "todos_los_niveles" && !(isEdit && editingCampo?.alcance === "todos_los_niveles")) {
      setShowGlobalConfirm(true);
      return;
    }
    doSave();
  };

  const doSave = () => {
    const campo: CampoAdicional = {
      id: editingCampo?.id || uuid(),
      nombre: nombre.trim(),
      tipo: tipo as TipoCampoAdicional,
      obligatorio,
      alcance,
      ...(showOpciones ? { opciones: opciones.filter((o) => o.trim()) } : {}),
      ...(!hideValorDefecto && !showEstadoDefault && valorPorDefecto.trim()
        ? { valorPorDefecto: valorPorDefecto.trim() }
        : {}),
      ...(showEstadoDefault ? { valorPorDefecto: valorPorDefecto || "inactivo" } : {}),
    };
    onSave(campo);
    onOpenChange(false);
  };

  const addOpcion = () => setOpciones((prev) => [...prev, ""]);
  const removeOpcion = (i: number) => setOpciones((prev) => prev.filter((_, idx) => idx !== i));
  const updateOpcion = (i: number, val: string) =>
    setOpciones((prev) => prev.map((o, idx) => (idx === i ? val : o)));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar campo adicional" : "Nuevo campo adicional"}</DialogTitle>
            <DialogDescription>
              Configure las propiedades del campo. Los campos adicionales definen la estructura que un curso basado en este nivel deberá tener.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Nombre */}
            <div className="space-y-1.5">
              <Label>Nombre del campo *</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Empresa patrocinadora"
              />
              {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
            </div>

            {/* Tipo */}
            <div className="space-y-1.5">
              <Label>Tipo de campo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCampoAdicional)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent side="bottom">
                  {(Object.entries(TIPOS_CAMPO_LABELS) as [TipoCampoAdicional, string][]).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {errors.tipo && <p className="text-xs text-destructive">{errors.tipo}</p>}
            </div>

            {/* Obligatorio */}
            <div className="flex items-center justify-between py-2 px-3 rounded-md border">
              <Label>Obligatorio</Label>
              <Switch checked={obligatorio} onCheckedChange={setObligatorio} />
            </div>

            {/* Valor por defecto */}
            {!hideValorDefecto && !showOpciones && !showEstadoDefault && (
              <div className="space-y-1.5">
                <Label>Valor por defecto</Label>
                <Input
                  value={valorPorDefecto}
                  onChange={(e) => setValorPorDefecto(e.target.value)}
                  placeholder="Opcional"
                />
                <p className="text-xs text-muted-foreground">
                  Si se define, este valor se precompletará al crear un curso con este nivel.
                </p>
              </div>
            )}

            {/* Estado default */}
            {showEstadoDefault && (
              <div className="flex items-center justify-between py-2 px-3 rounded-md border">
                <Label>Valor por defecto (estado)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {valorPorDefecto === "activo" ? "Activo" : "Inactivo"}
                  </span>
                  <Switch
                    checked={valorPorDefecto === "activo"}
                    onCheckedChange={(c) => setValorPorDefecto(c ? "activo" : "inactivo")}
                  />
                </div>
              </div>
            )}

            {/* Opciones para select */}
            {showOpciones && (
              <div className="space-y-2">
                <Label>Opciones de la lista *</Label>
                {opciones.map((op, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={op}
                      onChange={(e) => updateOpcion(i, e.target.value)}
                      placeholder={`Opción ${i + 1}`}
                      className="flex-1"
                    />
                    {opciones.length > 2 && (
                      <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => removeOpcion(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOpcion}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Añadir opción
                </Button>
                {errors.opciones && <p className="text-xs text-destructive">{errors.opciones}</p>}
              </div>
            )}

            {/* Alcance */}
            <div className="space-y-2 pt-2 border-t">
              <Label>Alcance del campo *</Label>
              <RadioGroup
                value={alcance}
                onValueChange={(v) => setAlcance(v as AlcanceCampo)}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2 py-2 px-3 rounded-md border">
                  <RadioGroupItem value="solo_nivel" id="alcance_solo" />
                  <Label htmlFor="alcance_solo" className="cursor-pointer flex-1 font-normal">
                    Aplicar solo a este nivel de formación
                  </Label>
                </div>
                <div className="flex items-center space-x-2 py-2 px-3 rounded-md border">
                  <RadioGroupItem value="todos_los_niveles" id="alcance_todos" />
                  <Label htmlFor="alcance_todos" className="cursor-pointer flex-1 font-normal">
                    Aplicar a todos los niveles de formación
                  </Label>
                </div>
              </RadioGroup>
              {alcance === "todos_los_niveles" && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-accent/50 border border-accent">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Este campo se agregará a todos los niveles existentes y futuros.
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {isEdit ? "Guardar cambios" : "Agregar campo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showGlobalConfirm}
        onOpenChange={setShowGlobalConfirm}
        title="Aplicar campo a todos los niveles"
        description="Este campo se agregará a todos los niveles de formación existentes y futuros. ¿Desea continuar?"
        confirmText="Sí, aplicar a todos"
        cancelText="Cancelar"
        onConfirm={doSave}
      />
    </>
  );
}
