import { useState } from "react";
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCargos, useCreateCargo, useUpdateCargo, useDeleteCargo } from "@/hooks/usePersonal";
import { usePersonalList } from "@/hooks/usePersonal";
import { TIPOS_CARGO, TipoCargo, Cargo } from "@/types/personal";
import { useToast } from "@/hooks/use-toast";

interface GestionCargosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCargoCreated?: (cargoId: string) => void;
}

const TIPO_BADGE_VARIANT: Record<TipoCargo, "default" | "secondary" | "outline" | "destructive"> = {
  entrenador: "default",
  supervisor: "secondary",
  administrativo: "outline",
  instructor: "default",
  otro: "outline",
};

export function GestionCargosModal({ open, onOpenChange, onCargoCreated }: GestionCargosModalProps) {
  const { toast } = useToast();
  const { data: cargos = [] } = useCargos();
  const { data: personal = [] } = usePersonalList();
  const createCargo = useCreateCargo();
  const updateCargo = useUpdateCargo();
  const deleteCargo = useDeleteCargo();

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoCargo>("entrenador");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setNombre("");
    setTipo("entrenador");
    setEditingId(null);
  };

  const handleEdit = (cargo: Cargo) => {
    setNombre(cargo.nombre);
    setTipo(cargo.tipo);
    setEditingId(cargo.id);
  };

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast({ title: "Ingrese un nombre para el cargo", variant: "destructive" });
      return;
    }

    try {
      if (editingId) {
        await updateCargo.mutateAsync({ id: editingId, data: { nombre, tipo } });
        toast({ title: "Rol actualizado" });
      } else {
        const newCargo = await createCargo.mutateAsync({ nombre, tipo });
        toast({ title: "Rol creado" });
        onCargoCreated?.(newCargo.id);
      }
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCargo.mutateAsync(id);
      toast({ title: "Cargo eliminado" });
      if (editingId === id) resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const isCargoInUse = (cargoId: string) => personal.some(p => p.cargoId === cargoId);
  const isPending = createCargo.isPending || updateCargo.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gestionar Roles</DialogTitle>
          <DialogDescription>Crear, editar o eliminar roles del sistema.</DialogDescription>
        </DialogHeader>

        {/* Form */}
        <div className="space-y-3 border-b pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre del rol</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Entrenador Senior"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de rol</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoCargo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CARGO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {editingId && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Cancelar edición
              </Button>
            )}
            <Button size="sm" onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : editingId ? (
                <Pencil className="h-4 w-4 mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {editingId ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {cargos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay cargos registrados</p>
          )}
          {cargos.map(cargo => {
            const inUse = isCargoInUse(cargo.id);
            return (
              <div
                key={cargo.id}
                className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{cargo.nombre}</span>
                  <Badge variant={TIPO_BADGE_VARIANT[cargo.tipo]} className="text-xs">
                    {TIPOS_CARGO.find(t => t.value === cargo.tipo)?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEdit(cargo)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    disabled={inUse}
                    title={inUse ? "Cargo en uso, no se puede eliminar" : "Eliminar cargo"}
                    onClick={() => handleDelete(cargo.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
