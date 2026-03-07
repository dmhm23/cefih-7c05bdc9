import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { History, ChevronDown, RotateCcw } from "lucide-react";
import type { PlantillaVersion } from "@/types/certificado";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";

interface Props {
  historial: PlantillaVersion[];
  currentVersion: number;
  onRollback: (version: number) => void;
}

export default function PlantillaVersionHistory({ historial, currentVersion, onRollback }: Props) {
  const [open, setOpen] = useState(false);
  const sorted = [...historial].sort((a, b) => b.version - a.version);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-foreground w-full hover:text-primary transition-colors">
        <History className="h-4 w-4" />
        Historial de versiones ({historial.length})
        <ChevronDown className={`h-3 w-3 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {sorted.map((v) => (
          <div key={v.version} className="flex items-center justify-between border rounded-md p-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant={v.version === currentVersion ? 'default' : 'secondary'} className="text-xs">
                v{v.version}
              </Badge>
              <span className="text-muted-foreground">
                {format(new Date(v.fecha), "dd/MM/yyyy HH:mm", { locale: es })} — {v.modificadoPor}
              </span>
            </div>
            {v.version !== currentVersion && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onRollback(v.version)}>
                <RotateCcw className="h-3 w-3 mr-1" /> Restaurar
              </Button>
            )}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
