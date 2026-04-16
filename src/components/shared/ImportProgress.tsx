import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { ImportLogsPanel } from "./ImportLogsPanel";
import { ImportLogEntry } from "@/hooks/useImportLogger";

interface ImportProgressProps {
  current: number;
  total: number;
  label?: string;
  /** Logs en tiempo real opcionales. Si se proveen, se muestra el panel. */
  logs?: ImportLogEntry[];
}

/**
 * Indicador de progreso reutilizable para procesos de importación masiva.
 * Muestra barra, porcentaje, conteo X de N y, opcionalmente, panel de logs.
 */
export function ImportProgress({ current, total, label = "Importando", logs }: ImportProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="border-t-2 border-primary/20 bg-card shadow-[0_-2px_8px_-4px_hsl(var(--foreground)/0.08)]">
      <div className="space-y-2.5 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{label}…</span>
          </div>
          <span className="text-muted-foreground tabular-nums font-medium">
            {current} / {total} <span className="text-primary font-semibold">({pct}%)</span>
          </span>
        </div>
        <Progress value={pct} className="h-3" />
      </div>
      {logs && <ImportLogsPanel logs={logs} />}
    </div>
  );
}
