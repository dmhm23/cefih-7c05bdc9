import { useState, useMemo, useEffect } from "react";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, RotateCcw } from "lucide-react";
import { Curso } from "@/types/curso";
import { Matricula } from "@/types/matricula";
import { Persona } from "@/types/persona";
import { useResolveNivel } from "@/hooks/useResolveNivel";
import { downloadCsv } from "@/utils/csvMinTrabajo";
import {
  COLUMN_CATALOG,
  GROUPS,
  PLANTILLA_OFICIAL_KEYS,
  buildCursoListadoCsv,
} from "@/utils/exportCursoListado";
import { useToast } from "@/hooks/use-toast";

interface ExportarListadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  curso: Curso;
  matriculas: Matricula[];
  personas: Persona[];
  codigosEstudiante?: Record<string, string>;
}

export function ExportarListadoDialog({
  open,
  onOpenChange,
  curso,
  matriculas,
  personas,
  codigosEstudiante = {},
}: ExportarListadoDialogProps) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const resolveNivel = useResolveNivel();

  // Por defecto: plantilla oficial seleccionada
  const [selected, setSelected] = useState<Set<string>>(() => new Set(PLANTILLA_OFICIAL_KEYS));

  // Resetear a plantilla oficial cada vez que se abre el modal
  useEffect(() => {
    if (open) setSelected(new Set(PLANTILLA_OFICIAL_KEYS));
  }, [open]);

  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(COLUMN_CATALOG.map((c) => c.key)));
  const deselectAll = () => setSelected(new Set());
  const restaurarPlantillaOficial = () => setSelected(new Set(PLANTILLA_OFICIAL_KEYS));

  const handleExport = () => {
    if (selected.size === 0) {
      toast({ title: "Selecciona al menos una columna", variant: "destructive" });
      return;
    }
    if (matriculas.length === 0) {
      toast({ title: "Sin estudiantes", description: "No hay matrículas para exportar.", variant: "destructive" });
      return;
    }

    const columnasSeleccionadas = COLUMN_CATALOG.filter((c) => selected.has(c.key));
    const { content, filas, columnas } = buildCursoListadoCsv({
      matriculas,
      personaMap,
      curso,
      resolveNivel,
      codigosEstudiante,
      columnasSeleccionadas,
    });

    const filename = `Curso_${curso.numeroCurso}_Listado.csv`;
    downloadCsv(content, filename);
    toast({ title: "Listado exportado", description: `${filas} registro(s) con ${columnas.length} columnas.` });
    logActivity({
      action: "exportar",
      module: "cursos",
      description: `Exportó listado del curso ${curso.numeroCurso || curso.nombre} (${filas} registros, ${columnas.length} columnas)`,
      entityType: "curso",
      entityId: curso.id,
      metadata: { registros: filas, columnas: columnas.map((c) => c.key) },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar Listado de Estudiantes</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Button variant="default" size="sm" onClick={restaurarPlantillaOficial} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar plantilla oficial
          </Button>
          <Button variant="outline" size="sm" onClick={selectAll}>Seleccionar todas</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>Deseleccionar todas</Button>
          <span className="ml-auto text-xs text-muted-foreground">{selected.size} columnas</span>
        </div>

        <p className="text-xs text-muted-foreground mb-2">
          La plantilla oficial define el orden estricto de las primeras 10 columnas. Las columnas adicionales que selecciones se agregarán al final.
        </p>

        <ScrollArea className="h-[360px] pr-2">
          {GROUPS.map((group) => {
            const cols = COLUMN_CATALOG.filter((c) => c.group === group);
            if (cols.length === 0) return null;
            return (
              <div key={group} className="mb-4">
                <p className="text-sm font-semibold text-muted-foreground mb-1.5">{group}</p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                  {cols.map((col) => {
                    const esOficial = PLANTILLA_OFICIAL_KEYS.includes(col.key);
                    return (
                      <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={selected.has(col.key)}
                          onCheckedChange={() => toggle(col.key)}
                        />
                        <span className={esOficial ? "font-medium" : ""}>{col.header}</span>
                        {esOficial && (
                          <span className="text-[10px] text-primary uppercase tracking-wide">oficial</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExport} disabled={selected.size === 0}>
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
