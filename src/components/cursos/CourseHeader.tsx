import { ArrowLeft, Lock, MoreVertical, FileText, Download, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/shared/IconButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Curso } from "@/types/curso";
import { useResolveNivel } from "@/hooks/useResolveNivel";
import { useToast } from "@/hooks/use-toast";

interface CourseHeaderProps {
  curso: Curso;
  onBack: () => void;
  onCloseCourse: () => void;
  onDownloadCsvMinTrabajo: () => void;
  onExportarListado: () => void;
  onGenerarPdfs: () => void;
}

export function CourseHeader({ curso, onBack, onCloseCourse, onDownloadCsvMinTrabajo, onExportarListado, onGenerarPdfs }: CourseHeaderProps) {
  const { toast } = useToast();
  const resolveNivel = useResolveNivel();

  const title = `${resolveNivel(curso.nivelFormacionId || curso.tipoFormacion)} — #${curso.numeroCurso}`;
  const meta = `${curso.fechaInicio} → ${curso.fechaFin} | ${curso.duracionDias}d | ${curso.horasTotales}h`;

  return (
    <div className="flex items-start gap-3">
      <IconButton tooltip="Volver" className="mt-0.5" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
      </IconButton>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-semibold">{title}</h1>
          <StatusBadge status={curso.estado} />
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{meta}</p>
      </div>
      <div className="flex items-center gap-2">
        {curso.estado !== "cerrado" && (
          <Button size="sm" onClick={onCloseCourse}>
            <Lock className="h-4 w-4 mr-1" />
            Cerrar Curso
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton tooltip="Más opciones" variant="outline" className="h-9 w-9">
              <MoreVertical className="h-4 w-4" />
            </IconButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onDownloadCsvMinTrabajo}>
              <Download className="h-4 w-4 mr-2" />
              Descargar CSV MinTrabajo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: "Generar certificados (pendiente)" })}>
              <Award className="h-4 w-4 mr-2" />
              Generar certificados
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onGenerarPdfs}>
              <FileText className="h-4 w-4 mr-2" />
              Generar PDFs
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportarListado}>
              <Download className="h-4 w-4 mr-2" />
              Exportar listado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
