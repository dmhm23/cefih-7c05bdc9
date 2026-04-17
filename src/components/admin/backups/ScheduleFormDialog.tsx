import { useEffect, useMemo, useState } from "react";
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

type Periodo = "diario" | "semanal" | "mensual";

const DIAS_SEMANA = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
  { value: "0", label: "Domingo" },
];

// Colombia es UTC-5 fijo (sin horario de verano).
const COLOMBIA_OFFSET = 5;

/** Convierte hora local Colombia (0-23) a hora UTC (0-23). */
function horaColToUtc(horaCol: number): number {
  return (horaCol + COLOMBIA_OFFSET) % 24;
}

/** Convierte hora UTC (0-23) a hora local Colombia (0-23). */
function horaUtcToCol(horaUtc: number): number {
  return (horaUtc - COLOMBIA_OFFSET + 24) % 24;
}

/** Construye la expresión cron en UTC a partir de período + hora Colombia. */
function buildCron(periodo: Periodo, horaCol: number, diaSemana: string, diaMes: number): string {
  const horaUtc = horaColToUtc(horaCol);
  const minuto = 0;
  switch (periodo) {
    case "diario":
      return `${minuto} ${horaUtc} * * *`;
    case "semanal":
      return `${minuto} ${horaUtc} * * ${diaSemana}`;
    case "mensual":
      return `${minuto} ${horaUtc} ${diaMes} * *`;
  }
}

/** Genera descripción legible en hora Colombia. */
function buildLegible(periodo: Periodo, horaCol: number, diaSemana: string, diaMes: number): string {
  const horaStr = `${String(horaCol).padStart(2, "0")}:00`;
  switch (periodo) {
    case "diario":
      return `Diario a las ${horaStr} (Colombia)`;
    case "semanal": {
      const dia = DIAS_SEMANA.find((d) => d.value === diaSemana)?.label ?? "Lunes";
      return `Semanal · ${dia} a las ${horaStr} (Colombia)`;
    }
    case "mensual":
      return `Mensual · Día ${diaMes} a las ${horaStr} (Colombia)`;
  }
}

/** Intenta inferir período + hora desde un cron existente (almacenado en UTC). */
function parseCron(cron: string): {
  periodo: Periodo;
  horaCol: number;
  diaSemana: string;
  diaMes: number;
} | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [min, hora, dom, , dow] = parts;
  const minN = Number(min);
  const horaN = Number(hora);
  if (Number.isNaN(minN) || Number.isNaN(horaN) || minN !== 0) return null;
  const horaCol = horaUtcToCol(horaN);
  if (dom === "*" && dow === "*") return { periodo: "diario", horaCol, diaSemana: "1", diaMes: 1 };
  if (dom === "*" && dow !== "*") {
    return { periodo: "semanal", horaCol, diaSemana: dow, diaMes: 1 };
  }
  if (dom !== "*" && dow === "*") {
    const diaMes = Number(dom);
    if (Number.isNaN(diaMes)) return null;
    return { periodo: "mensual", horaCol, diaSemana: "1", diaMes };
  }
  return null;
}

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
  const [periodo, setPeriodo] = useState<Periodo>("diario");
  const [horaCol, setHoraCol] = useState<number>(2); // 02:00 Colombia por defecto
  const [diaSemana, setDiaSemana] = useState<string>("1"); // Lunes
  const [diaMes, setDiaMes] = useState<number>(1);
  const [alcance, setAlcance] = useState<BackupAlcance>("completo");
  const [retener, setRetener] = useState(7);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setNombre(initial.nombre);
      setAlcance(initial.alcance);
      setRetener(initial.retener_n_ultimos);
      const parsed = parseCron(initial.frecuencia_cron);
      if (parsed) {
        setPeriodo(parsed.periodo);
        setHoraCol(parsed.horaCol);
        setDiaSemana(parsed.diaSemana);
        setDiaMes(parsed.diaMes);
      } else {
        // Cron no estándar: caemos a defaults
        setPeriodo("diario");
        setHoraCol(2);
        setDiaSemana("1");
        setDiaMes(1);
      }
    } else {
      setNombre("");
      setPeriodo("diario");
      setHoraCol(2);
      setDiaSemana("1");
      setDiaMes(1);
      setAlcance("completo");
      setRetener(7);
    }
  }, [open, initial]);

  const cronPreview = useMemo(
    () => buildCron(periodo, horaCol, diaSemana, diaMes),
    [periodo, horaCol, diaSemana, diaMes],
  );
  const legiblePreview = useMemo(
    () => buildLegible(periodo, horaCol, diaSemana, diaMes),
    [periodo, horaCol, diaSemana, diaMes],
  );

  const horasOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, h) => {
        const colStr = `${String(h).padStart(2, "0")}:00`;
        const utcStr = `${String(horaColToUtc(h)).padStart(2, "0")}:00 UTC`;
        return { value: String(h), label: `${colStr} — ${utcStr}` };
      }),
    [],
  );

  const diasMesOptions = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        value: String(i + 1),
        label: `Día ${i + 1}`,
      })),
    [],
  );

  const submit = () => {
    if (!nombre.trim()) return;
    onSubmit({
      nombre: nombre.trim(),
      frecuencia_cron: cronPreview,
      frecuencia_legible: legiblePreview,
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
            Define cuándo y qué incluir en los respaldos automáticos. La hora se interpreta en
            zona horaria Colombia (UTC-5).
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Diario</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hora (Colombia)</Label>
              <Select value={String(horaCol)} onValueChange={(v) => setHoraCol(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {horasOptions.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {periodo === "semanal" && (
            <div className="space-y-2">
              <Label>Día de la semana</Label>
              <Select value={diaSemana} onValueChange={setDiaSemana}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {periodo === "mensual" && (
            <div className="space-y-2">
              <Label>Día del mes</Label>
              <Select value={String(diaMes)} onValueChange={(v) => setDiaMes(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {diasMesOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Limitado a día 28 para garantizar ejecución todos los meses.
              </p>
            </div>
          )}

          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
            <p className="text-foreground">
              <span className="font-medium">Resumen:</span> {legiblePreview}
            </p>
            <p className="text-muted-foreground">
              Cron en UTC: <code className="font-mono">{cronPreview}</code>
            </p>
          </div>

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
              Los más antiguos se eliminan automáticamente cada día a las 03:00 UTC (22:00 Colombia).
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
