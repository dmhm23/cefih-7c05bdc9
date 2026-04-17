import { supabase } from "@/integrations/supabase/client";
import type { BackupAlcance, SystemBackupSchedule } from "@/types/backup";

export interface ScheduleInput {
  nombre: string;
  frecuencia_cron: string;
  frecuencia_legible: string;
  alcance: BackupAlcance;
  retener_n_ultimos: number;
  activo?: boolean;
}

export const backupScheduleService = {
  async list(): Promise<SystemBackupSchedule[]> {
    const { data, error } = await supabase
      .from("system_backup_schedules")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as SystemBackupSchedule[];
  },

  async create(input: ScheduleInput) {
    const { data, error } = await supabase.functions.invoke("backup-schedule-manager", {
      body: { action: "create", ...input },
    });
    if (error) throw error;
    return data;
  },

  async update(id: string, input: ScheduleInput) {
    const { data, error } = await supabase.functions.invoke("backup-schedule-manager", {
      body: { action: "update", id, ...input },
    });
    if (error) throw error;
    return data;
  },

  async toggle(id: string, activo: boolean) {
    const { data, error } = await supabase.functions.invoke("backup-schedule-manager", {
      body: { action: "toggle", id, activo },
    });
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    const { data, error } = await supabase.functions.invoke("backup-schedule-manager", {
      body: { action: "delete", id },
    });
    if (error) throw error;
    return data;
  },

  async runNow(id: string) {
    const { data, error } = await supabase.functions.invoke("backup-schedule-manager", {
      body: { action: "run_now", id },
    });
    if (error) throw error;
    return data;
  },
};
