import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { BackupAlcance, SystemBackupSchedule } from "@/types/backup";

type Preset = "diario" | "semanal" | "mensual" | "custom";

const PRESETS: Record<Exclude<Preset, "custom">, { cron: string; legible: string }> = {
  diario: { cron: "0 2 * * *", legible: "Diario a las 02:00 UTC" },
  semanal: { cron: "0 2 * * 1", legible: "Semanal · Lunes 02:00 UTC" },
  mensual: { cron: "0 2 1 * *", legible: "Mensual · Día 1 a las 02:00 UTC" },
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SystemBackupSchedule | null;
  onSubmit: (input: {
    nombre: string;
    frecuencia_cron: string;
    frecuencia_legible: string;
    alcance: BackupAlcance;
    retener_n_ultimos: number;
    activo?: boolean;
  }) => void;
  isSubmitting: boolean;
}

export function ScheduleFormDialog({ open, onOpenChange, initial, onSubmit, isSubmitting }: Props) {
  const [nombre, setNombre] = useState("");
  const [preset, setPreset] = useState<Preset>("diario");
  const [cron, setCron] = useState(PRESETS.diario.cron);
  const [legible, setLegible] = useState(PRESETS.diario.legible);
  const [alcance, setAlcance] = useState<BackupAlcance>("completo");
  const [retener, setRetener] = useState(7);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setNombre(initial.nombre);
      setCron(initial.frecuencia_cron);
      setLegible(initial.frecuencia_legible);
      setAlcance(initial.alcance);
      setRetener(initial.retener_n_ultimos);
      const matched = (Object.entries(PRESETS) as [Exclude<Preset, "custom">, typeof PRESETS["diario"]][])
        .find(([, v]) => v.cron === initial.frecuencia_cron);
      setPreset(matched ? matched[0] : "custom");
    } else {
      setNombre("");
      setPreset("diario");
      setCron(PRESETS.diario.cron);
      setLegible(PRESETS.diario.legible);
      setAlcance("completo");
      setRetener(7);
    }
  }, [open, initial]);

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") {
      setCron(PRESETS[p].cron);
      setLegible(PRESETS[p].legible);
    }
  };

  const submit = () => {
    if (!nombre.trim() || !cron.trim()) return;
    onSubmit({
      nombre: nombre.trim(),
      frecuencia_cron: cron.trim(),
      frecuencia_legible: legible.trim() || cron.trim(),
      alcance,
      retener_n_ultimos: retener,
      activo: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar programación" : "Nueva programación"}</DialogTitle>
          <DialogDescription>
            Define cuándo y qué incluir en los respaldos automáticos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="s-nombre">Nombre</Label>
            <Input
              id="s-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Backup nocturno completo"
            />
          </div>

          <div className="space-y-2">
            <Label>Frecuencia</Label>
            <Select value={preset} onValueChange={(v) => handlePreset(v as Preset)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diario">Diario · 02:00 UTC</SelectItem>
                <SelectItem value="semanal">Semanal · Lunes 02:00 UTC</SelectItem>
                <SelectItem value="mensual">Mensual · Día 1 a las 02:00 UTC</SelectItem>
                <SelectItem value="custom">Personalizado (cron)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preset === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="s-cron">Expresión cron</Label>
                <Input
                  id="s-cron"
                  value={cron}
                  onChange={(e) => setCron(e.target.value)}
                  placeholder="0 2 * * *"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-legible">Descripción</Label>
                <Input
                  id="s-legible"
                  value={legible}
                  onChange={(e) => setLegible(e.target.value)}
                  placeholder="Ej: Cada hora"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Alcance</Label>
            <Select value={alcance} onValueChange={(v) => setAlcance(v as BackupAlcance)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completo">Completo (BD + archivos)</SelectItem>
                <SelectItem value="db_only">Solo base de datos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="s-ret">Retener últimos N respaldos</Label>
            <Input
              id="s-ret"
              type="number"
              min={1}
              max={365}
              value={retener}
              onChange={(e) => setRetener(Math.max(1, Number(e.target.value) || 1))}
            />
            <p className="text-xs text-muted-foreground">
              Los más antiguos se eliminan automáticamente cada día a las 03:00 UTC.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={isSubmitting || !nombre.trim()}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {initial ? "Guardar cambios" : "Crear programación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
