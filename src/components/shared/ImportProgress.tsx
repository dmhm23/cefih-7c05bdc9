import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2 } from "lucide-react";
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
 * Cuando current === total muestra estado "Completada" en verde.
 */
export function ImportProgress({ current, total, label = "Importando", logs }: ImportProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = total > 0 && current >= total;
  return (
    <div className="border-t-2 border-primary/20 bg-card shadow-[0_-2px_8px_-4px_hsl(var(--foreground)/0.08)]">
      <div className="space-y-2.5 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className={`flex items-center gap-2 font-semibold ${isComplete ? 'text-green-600' : 'text-foreground'}`}>
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
            <span>{isComplete ? 'Completada' : `${label}…`}</span>
          </div>
          <span className="text-muted-foreground tabular-nums font-medium">
            {current} / {total}{' '}
            <span className={`font-semibold ${isComplete ? 'text-green-600' : 'text-primary'}`}>
              ({pct}%)
            </span>
          </span>
        </div>
        <Progress
          value={pct}
          className={`h-3 ${isComplete ? '[&>div]:bg-green-500' : ''}`}
        />
      </div>
      {logs && <ImportLogsPanel logs={logs} />}
    </div>
  );
}
