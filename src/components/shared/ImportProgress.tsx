import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ImportProgressProps {
  current: number;
  total: number;
  label?: string;
}

/**
 * Indicador de progreso reutilizable para procesos de importación masiva.
 * Muestra barra, porcentaje y conteo X de N.
 */
export function ImportProgress({ current, total, label = "Importando" }: ImportProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>{label}…</span>
        </div>
        <span className="text-muted-foreground tabular-nums">
          {current} / {total} ({pct}%)
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
