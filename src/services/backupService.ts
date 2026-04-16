import { supabase } from "@/integrations/supabase/client";
import type { SystemBackup, BackupAlcance } from "@/types/backup";

export const backupService = {
  async list(): Promise<SystemBackup[]> {
    const { data, error } = await supabase
      .from("system_backups")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data ?? []) as unknown as SystemBackup[];
  },

  async crear(alcance: BackupAlcance): Promise<{ backup_id: string }> {
    const { data, error } = await supabase.functions.invoke("backup-runner", {
      body: { alcance, origen: "manual" },
    });
    if (error) throw error;
    return data as { backup_id: string };
  },

  async eliminar(backupId: string): Promise<void> {
    const { data: backup, error: getErr } = await supabase
      .from("system_backups")
      .select("storage_path")
      .eq("id", backupId)
      .maybeSingle();
    if (getErr) throw getErr;

    if (backup?.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from("system-backups")
        .remove([backup.storage_path]);
      if (storageErr) {
        // No abortar; la fila se elimina aunque el archivo ya no exista
        console.warn("[backup] no se pudo eliminar archivo:", storageErr.message);
      }
    }

    const { error: delErr } = await supabase
      .from("system_backups")
      .delete()
      .eq("id", backupId);
    if (delErr) throw delErr;
  },

  async getDownloadUrl(storagePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from("system-backups")
      .createSignedUrl(storagePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },
};
