import { FileText, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { EstadoFormato } from "@/types/formato";

interface FormatoItem {
  id: string;
  nombre: string;
  estado: EstadoFormato;
}

interface Props {
  formatos: FormatoItem[];
  onPreview: (id: string) => void;
  onDownload: (id: string) => void;
}

export default function FormatosList({ formatos, onPreview, onDownload }: Props) {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        {formatos.map((fmt) => (
          <div
            key={fmt.id}
            className="flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => onPreview(fmt.id)}
          >
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate">{fmt.nombre}</p>
              <Badge
                variant="outline"
                className={`text-[10px] py-0 px-1.5 mt-0.5 ${
                  fmt.estado === "borrador"
                    ? "text-amber-600 border-amber-300"
                    : "text-emerald-600 border-emerald-300"
                }`}
              >
                {fmt.estado === "borrador" ? "Borrador" : "Completo"}
              </Badge>
            </div>
            <div className="flex gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); onPreview(fmt.id); }}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vista previa</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => { e.stopPropagation(); onDownload(fmt.id); }}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Descargar PDF</TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
}
