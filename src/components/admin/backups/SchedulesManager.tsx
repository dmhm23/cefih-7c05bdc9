import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  PlayCircle,
  Loader2,
  HardDrive,
  Database,
} from "lucide-react";
import { useBackupSchedules } from "@/hooks/useBackupSchedules";
import { ScheduleFormDialog } from "./ScheduleFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ALCANCE_LABEL, type SystemBackupSchedule } from "@/types/backup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function SchedulesManager() {
  const { schedules, isLoading, create, isCreating, update, isUpdating, toggle, remove, runNow, isRunning } =
    useBackupSchedules();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemBackupSchedule | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSubmit = (input: any) => {
    if (editing) {
      update(
        { id: editing.id, input },
        {
          onSuccess: () => {
            setFormOpen(false);
            setEditing(null);
          },
        },
      );
    } else {
      create(input, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-medium text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programaciones automáticas
          </h2>
          <p className="text-sm text-muted-foreground">
            Define respaldos recurrentes con retención configurable.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva programación
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 mx-auto animate-spin" />
        </Card>
      ) : schedules.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground mb-1">No hay programaciones</p>
          <p className="text-sm">Crea una para automatizar tus respaldos.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {schedules.map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-foreground">{s.nombre}</h3>
                    <Badge variant={s.activo ? "default" : "secondary"}>
                      {s.activo ? "Activa" : "Pausada"}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {s.alcance === "completo" ? (
                        <HardDrive className="h-3 w-3" />
                      ) : (
                        <Database className="h-3 w-3" />
                      )}
                      {ALCANCE_LABEL[s.alcance]}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2 space-y-0.5">
                    <p>
                      <span className="font-medium text-foreground">Frecuencia:</span>{" "}
                      {s.frecuencia_legible}{" "}
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded ml-1">
                        {s.frecuencia_cron}
                      </code>
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Retención:</span>{" "}
                      {s.retener_n_ultimos} respaldos
                    </p>
                    {s.ultima_ejecucion && (
                      <p>
                        <span className="font-medium text-foreground">Última ejecución:</span>{" "}
                        {format(new Date(s.ultima_ejecucion), "PPp", { locale: es })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2">
                    <Switch
                      checked={s.activo}
                      onCheckedChange={(checked) => toggle({ id: s.id, activo: checked })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => runNow(s.id)}
                    disabled={isRunning}
                    title="Ejecutar ahora"
                  >
                    <PlayCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(s);
                      setFormOpen(true);
                    }}
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingId(s.id)}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        initial={editing}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        title="Eliminar programación"
        description="Se eliminará la programación y se cancelará su ejecución automática. Los backups históricos no se ven afectados."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={() => {
          if (deletingId) remove(deletingId);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
