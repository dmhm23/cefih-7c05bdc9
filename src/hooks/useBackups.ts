import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { backupService } from "@/services/backupService";
import type { BackupAlcance } from "@/types/backup";
import { toast } from "sonner";

export function useBackups() {
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["system-backups"],
    queryFn: backupService.list,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (Array.isArray(data) && data.some((b) => b.estado === "en_progreso")) {
        return 3000;
      }
      return false;
    },
  });

  const crearMutation = useMutation({
    mutationFn: (alcance: BackupAlcance) => backupService.crear(alcance),
    onSuccess: () => {
      toast.success("Backup iniciado. Se procesará en segundo plano.");
      qc.invalidateQueries({ queryKey: ["system-backups"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "No se pudo iniciar el backup");
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => backupService.eliminar(id),
    onSuccess: () => {
      toast.success("Backup eliminado");
      qc.invalidateQueries({ queryKey: ["system-backups"] });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "No se pudo eliminar");
    },
  });

  const descargar = async (storagePath: string, filename?: string) => {
    try {
      const url = await backupService.getDownloadUrl(storagePath);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename ?? storagePath.split("/").pop() ?? "backup.zip";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      toast.error((err as Error).message ?? "No se pudo descargar");
    }
  };

  return {
    backups: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    crear: crearMutation.mutate,
    isCreating: crearMutation.isPending,
    eliminar: eliminarMutation.mutate,
    descargar,
  };
}
