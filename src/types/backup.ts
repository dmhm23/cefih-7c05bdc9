export type BackupAlcance = "db_only" | "completo";
export type BackupEstado = "en_progreso" | "completado" | "fallido";
export type BackupOrigen = "manual" | "programado";
export type BackupRestoreModo = "reemplazar" | "enriquecer";
export type BackupRestoreEstado = "en_progreso" | "completado" | "fallido" | "parcial";

export interface SystemBackup {
  id: string;
  alcance: BackupAlcance;
  origen: BackupOrigen;
  estado: BackupEstado;
  schedule_id: string | null;
  storage_path: string | null;
  tamano_bytes: number;
  tamano_db_bytes: number;
  tamano_files_bytes: number;
  tablas_count: number;
  filas_count: number;
  archivos_count: number;
  manifest: Record<string, unknown>;
  error_msg: string | null;
  created_by: string | null;
  created_by_email: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SystemBackupSchedule {
  id: string;
  nombre: string;
  frecuencia_cron: string;
  frecuencia_legible: string;
  alcance: BackupAlcance;
  activo: boolean;
  retener_n_ultimos: number;
  cron_job_id: number | null;
  ultima_ejecucion: string | null;
  proxima_ejecucion: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemBackupRestoreLog {
  id: string;
  backup_id: string | null;
  modo: BackupRestoreModo;
  estado: BackupRestoreEstado;
  incluyo_archivos: boolean;
  tablas_afectadas: unknown;
  filas_insertadas: number;
  filas_omitidas: number;
  archivos_restaurados: number;
  errores: unknown;
  ejecutado_por: string | null;
  ejecutado_por_email: string | null;
  ejecutado_at: string;
  completado_at: string | null;
}

export const ALCANCE_LABEL: Record<BackupAlcance, string> = {
  db_only: "Solo base de datos",
  completo: "Completo (BD + archivos)",
};

export const ESTADO_LABEL: Record<BackupEstado, string> = {
  en_progreso: "En progreso",
  completado: "Completado",
  fallido: "Fallido",
};

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 100 || i === 0 ? 0 : n >= 10 ? 1 : 2)} ${units[i]}`;
}
