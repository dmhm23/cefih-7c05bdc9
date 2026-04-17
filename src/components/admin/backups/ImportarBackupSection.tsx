import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ShieldCheck, Upload, Loader2, FileCheck2 } from "lucide-react";
import { useBackups } from "@/hooks/useBackups";
import { supabase } from "@/integrations/supabase/client";
import { SchemaDiffDialog, type SchemaDiff } from "./SchemaDiffDialog";
import { toast } from "sonner";
import { ALCANCE_LABEL, formatBytes, type SystemBackup } from "@/types/backup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function ImportarBackupSection() {
  const { backups } = useBackups();
  const [backupId, setBackupId] = useState<string>("");
  const [modo, setModo] = useState<"reemplazar" | "enriquecer">("enriquecer");
  const [incluirArchivos, setIncluirArchivos] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [diff, setDiff] = useState<SchemaDiff | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [restaurando, setRestaurando] = useState(false);

  const completados = useMemo(
    () => (backups as SystemBackup[]).filter((b) => b.estado === "completado" && b.storage_path),
    [backups],
  );

  const seleccionado = completados.find((b) => b.id === backupId) ?? null;

  const validarYAbrir = async () => {
    if (!backupId) return;
    if (modo === "reemplazar" && confirmacion !== "RESTAURAR") {
      toast.error('Debes escribir exactamente "RESTAURAR" para reemplazar.');
      return;
    }
    setAnalizando(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-restore", {
        body: { backup_id: backupId, modo, incluir_archivos: incluirArchivos, dry_run: true },
      });
      if (error) throw error;
      setDiff(data as SchemaDiff);
      setDiffOpen(true);
    } catch (e) {
      toast.error((e as Error).message ?? "No se pudo analizar el backup");
    } finally {
      setAnalizando(false);
    }
  };

  const ejecutar = async () => {
    setRestaurando(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-restore", {
        body: {
          backup_id: backupId,
          modo,
          incluir_archivos: incluirArchivos,
          confirmacion_texto: modo === "reemplazar" ? confirmacion : undefined,
        },
      });
      if (error) throw error;
      const r = data as {
        estado: string;
        filas_insertadas: number;
        filas_omitidas: number;
        archivos_restaurados: number;
        errores_count: number;
      };
      toast.success(
        `Restauración ${r.estado}: ${r.filas_insertadas} filas, ${r.archivos_restaurados} archivos${r.errores_count > 0 ? `, ${r.errores_count} errores` : ""}`,
      );
      setDiffOpen(false);
      setConfirmacion("");
    } catch (e) {
      toast.error((e as Error).message ?? "Falló la restauración");
    } finally {
      setRestaurando(false);
    }
  };

  return (
    <>
      <Card className="p-6 space-y-6">
        <div className="flex items-start gap-3">
          <Upload className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium">Restaurar desde backup existente</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona un backup completado y elige cómo aplicarlo a la base de datos actual.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Backup origen</Label>
          <Select value={backupId} onValueChange={setBackupId}>
            <SelectTrigger>
              <SelectValue placeholder="Elige un backup completado..." />
            </SelectTrigger>
            <SelectContent>
              {completados.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No hay backups completados disponibles.
                </div>
              )}
              {completados.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {format(new Date(b.created_at), "PPp", { locale: es })} — {ALCANCE_LABEL[b.alcance]} ({formatBytes(b.tamano_bytes)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Modo de restauración</Label>
          <RadioGroup value={modo} onValueChange={(v) => setModo(v as typeof modo)} className="gap-3">
            <Label
              htmlFor="m-enr"
              className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-success has-[:checked]:bg-success/5"
            >
              <RadioGroupItem value="enriquecer" id="m-enr" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Enriquecer (recomendado)
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Inserta solo registros que no existen. No elimina ni modifica datos actuales.
                </p>
              </div>
            </Label>

            <Label
              htmlFor="m-rep"
              className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 has-[:checked]:border-destructive has-[:checked]:bg-destructive/5"
            >
              <RadioGroupItem value="reemplazar" id="m-rep" className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Reemplazar (destructivo)
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Borra todos los datos actuales y los reemplaza por los del backup. Acción irreversible.
                </p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="incluir-archivos"
            checked={incluirArchivos}
            onCheckedChange={(c) => setIncluirArchivos(!!c)}
          />
          <Label htmlFor="incluir-archivos" className="cursor-pointer">
            Incluir archivos del Storage (firmas, documentos, certificados, adjuntos)
          </Label>
        </div>

        {modo === "reemplazar" && (
          <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-4">
            <Label htmlFor="conf" className="text-destructive font-medium">
              Confirmación obligatoria
            </Label>
            <p className="text-sm text-foreground">
              Escribe <code className="bg-muted px-1.5 py-0.5 rounded">RESTAURAR</code> para
              autorizar el reemplazo total de la base de datos.
            </p>
            <Input
              id="conf"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="RESTAURAR"
              className="bg-background"
            />
          </div>
        )}

        {seleccionado && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Backup seleccionado</span>
            </div>
            <div className="text-muted-foreground">
              {ALCANCE_LABEL[seleccionado.alcance]} · {formatBytes(seleccionado.tamano_bytes)} ·{" "}
              {seleccionado.tablas_count} tablas · {seleccionado.filas_count.toLocaleString()} filas
              {seleccionado.alcance === "completo" &&
                ` · ${seleccionado.archivos_count.toLocaleString()} archivos`}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            onClick={validarYAbrir}
            disabled={
              !backupId ||
              analizando ||
              (modo === "reemplazar" && confirmacion !== "RESTAURAR")
            }
          >
            {analizando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Validar y restaurar
          </Button>
        </div>
      </Card>

      <SchemaDiffDialog
        open={diffOpen}
        onOpenChange={setDiffOpen}
        diff={diff}
        onConfirm={ejecutar}
        isProcessing={restaurando}
      />
    </>
  );
}
