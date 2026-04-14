import { FileText, Eye, Download, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { EstadoFormatoRespuesta } from "@/types/formatoFormacion";

interface FormatoItem {
  id: string;
  nombre: string;
  codigo?: string;
  estado: string;
  estadoRespuesta?: EstadoFormatoRespuesta;
}

interface Props {
  formatos: FormatoItem[];
  onPreview: (id: string) => void;
  onDownload: (id: string) => void;
  onReopen?: (formatoId: string) => void;
}

const ESTADO_RESPUESTA_CONFIG: Record<string, { label: string; className: string }> = {
  bloqueado: { label: 'Bloqueado', className: 'text-red-600 border-red-300' },
  pendiente: { label: 'Pendiente', className: 'text-amber-600 border-amber-300' },
  reabierto: { label: 'Reabierto', className: 'text-blue-600 border-blue-300' },
  completado: { label: 'Completo', className: 'text-emerald-600 border-emerald-300' },
  firmado: { label: 'Firmado', className: 'text-purple-600 border-purple-300' },
};

export default function FormatosList({ formatos, onPreview, onDownload, onReopen }: Props) {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        {formatos.map((fmt) => {
          const estadoKey = fmt.estadoRespuesta || (fmt.estado === 'borrador' ? 'pendiente' : 'completado');
          const estadoConfig = ESTADO_RESPUESTA_CONFIG[estadoKey] || ESTADO_RESPUESTA_CONFIG.pendiente;
          const isBloqueado = estadoKey === 'bloqueado';

          return (
            <div
              key={fmt.id}
              className={`flex items-center gap-3 p-2.5 border rounded-lg transition-colors ${
                isBloqueado ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'
              }`}
              onClick={() => !isBloqueado && onPreview(fmt.id)}
            >
              {isBloqueado ? (
                <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight truncate">{fmt.nombre}</p>
                <Badge
                  variant="outline"
                  className={`text-[10px] py-0 px-1.5 mt-0.5 ${estadoConfig.className}`}
                >
                  {estadoConfig.label}
                </Badge>
              </div>
              <div className="flex gap-1 shrink-0">
                {onReopen && (estadoKey === 'completado' || estadoKey === 'firmado') && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); onReopen(fmt.id); }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Reabrir formato</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); onPreview(fmt.id); }}
                      disabled={isBloqueado}
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
                      disabled={isBloqueado}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Descargar PDF</TooltipContent>
                </Tooltip>
              </div>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
