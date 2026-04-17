import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backupScheduleService, type ScheduleInput } from "@/services/backupScheduleService";
import { toast } from "sonner";

export function useBackupSchedules() {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["system-backup-schedules"],
    queryFn: backupScheduleService.list,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["system-backup-schedules"] });
  };

  const createMutation = useMutation({
    mutationFn: (input: ScheduleInput) => backupScheduleService.create(input),
    onSuccess: () => {
      toast.success("Programación creada");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "No se pudo crear"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ScheduleInput }) =>
      backupScheduleService.update(id, input),
    onSuccess: () => {
      toast.success("Programación actualizada");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "No se pudo actualizar"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      backupScheduleService.toggle(id, activo),
    onSuccess: () => invalidate(),
    onError: (err: Error) => toast.error(err.message ?? "No se pudo cambiar estado"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backupScheduleService.remove(id),
    onSuccess: () => {
      toast.success("Programación eliminada");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "No se pudo eliminar"),
  });

  const runNowMutation = useMutation({
    mutationFn: (id: string) => backupScheduleService.runNow(id),
    onSuccess: () => {
      toast.success("Backup iniciado manualmente desde la programación");
      qc.invalidateQueries({ queryKey: ["system-backups"] });
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message ?? "No se pudo ejecutar"),
  });

  return {
    schedules: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    toggle: toggleMutation.mutate,
    remove: deleteMutation.mutate,
    runNow: runNowMutation.mutate,
    isRunning: runNowMutation.isPending,
  };
}
