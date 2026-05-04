import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { useResolveNivel } from "@/hooks/useResolveNivel";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { matriculaService } from "@/services/matriculaService";
import { personaService } from "@/services/personaService";
import { downloadCsv } from "@/utils/csvMinTrabajo";
import {
  MATRICULA_COLUMN_CATALOG,
  MATRICULA_COLUMN_GROUPS,
  MatriculaColumnDef,
  buildMatriculasCsv,
} from "@/utils/exportMatriculas";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_KEYS = MATRICULA_COLUMN_CATALOG.filter((c) => c.defaultSelected || c.mandatory).map((c) => c.key);
const ALL_KEYS = MATRICULA_COLUMN_CATALOG.map((c) => c.key);

type DateScope = "ninguno" | "creacion" | "inicio";

export function ExportarMatriculasCsvDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const { data: empresas = [] } = useEmpresas();
  const { data: niveles = [] } = useNivelesFormacion();
  const resolveNivel = useResolveNivel();

  const [empresaId, setEmpresaId] = useState<string>("");
  const [personaId, setPersonaId] = useState<string>("");
  const [tipoVinculacion, setTipoVinculacion] = useState<string>("todos");
  const [nivelFormacionId, setNivelFormacionId] = useState<string>("todos");
  const [dateScope, setDateScope] = useState<DateScope>("ninguno");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set(DEFAULT_KEYS));
  const [loading, setLoading] = useState(false);

  // Búsqueda de personas (lazy)
  const [personaSearch, setPersonaSearch] = useState("");
  const [personaOptions, setPersonaOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (open) {
      setEmpresaId("");
      setPersonaId("");
      setTipoVinculacion("todos");
      setNivelFormacionId("todos");
      setDateScope("ninguno");
      setDateFrom("");
      setDateTo("");
      setSelected(new Set(DEFAULT_KEYS));
      setPersonaSearch("");
      setPersonaOptions([]);
    }
  }, [open]);

  // Búsqueda de personas con debounce
  useEffect(() => {
    if (!open || personaSearch.trim().length < 2) {
      setPersonaOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const results = await personaService.search(personaSearch.trim());
        setPersonaOptions(
          results.slice(0, 50).map((p) => ({
            value: p.id,
            label: `${p.nombres} ${p.apellidos} — ${p.numeroDocumento}`,
          })),
        );
      } catch {
        setPersonaOptions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [personaSearch, open]);

  const empresaOptions = useMemo(
    () => empresas.map((e) => ({ value: e.id, label: `${e.nombreEmpresa}${e.nit ? ` — ${e.nit}` : ""}` })),
    [empresas],
  );
  const empresasMap = useMemo(() => Object.fromEntries(empresas.map((e) => [e.id, e])), [empresas]);

  const toggle = (key: string) => {
    const col = MATRICULA_COLUMN_CATALOG.find((c) => c.key === key);
    if (col?.mandatory) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(ALL_KEYS));
  const selectDefaults = () => setSelected(new Set(DEFAULT_KEYS));
  const deselectAll = () => {
    // Mantener obligatorias
    setSelected(new Set(MATRICULA_COLUMN_CATALOG.filter((c) => c.mandatory).map((c) => c.key)));
  };

  const handleExport = async () => {
    if (selected.size === 0) {
      toast({ title: "Selecciona al menos una columna", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const filters: any = {};
      if (personaId) filters.personaId = personaId;
      if (empresaId) filters.empresaId = empresaId;
      if (nivelFormacionId !== "todos") filters.nivelFormacionId = nivelFormacionId;
      if (tipoVinculacion !== "todos") filters.tipoVinculacion = tipoVinculacion;
      if (dateScope !== "ninguno" && (dateFrom || dateTo)) {
        if (dateScope === "creacion") {
          if (dateFrom) filters.createdFrom = `${dateFrom}T00:00:00`;
          if (dateTo) filters.createdTo = `${dateTo}T23:59:59`;
        } else {
          if (dateFrom) filters.fechaInicioFrom = dateFrom;
          if (dateTo) filters.fechaInicioTo = dateTo;
        }
      }

      const { rows, personasMap } = await matriculaService.getForCsvExport(filters);

      if (rows.length === 0) {
        toast({ title: "Sin resultados", description: "No hay matrículas que cumplan los filtros." });
        setLoading(false);
        return;
      }

      const cols = MATRICULA_COLUMN_CATALOG.filter((c) => selected.has(c.key));
      const { content, filas, columnas } = buildMatriculasCsv({
        matriculas: rows,
        personasMap,
        empresasMap: empresasMap as any,
        resolveNivel,
        columnasSeleccionadas: cols,
      });

      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `Matriculas_Export_${stamp}.csv`;
      downloadCsv(content, filename);

      toast({
        title: "CSV exportado",
        description: `${filas} registro(s) con ${columnas.length} columna(s).`,
      });
      logActivity({
        action: "exportar",
        module: "matriculas",
        description: `Exportó ${filas} matrícula(s) a CSV (${columnas.length} columnas)`,
        metadata: { filtros: filters, columnas: columnas.map((c) => c.key), filas },
      });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Error al exportar", description: e?.message || "Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Exportar Matrículas a CSV</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ===== Filtros ===== */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Filtros</p>

            <div className="space-y-1.5">
              <Label className="text-xs">Empresa</Label>
              <Combobox
                options={empresaOptions}
                value={empresaId}
                onValueChange={setEmpresaId}
                placeholder="Todas las empresas"
                searchPlaceholder="Buscar empresa..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Estudiante</Label>
              <Combobox
                options={personaOptions}
                value={personaId}
                onValueChange={setPersonaId}
                placeholder="Todos los estudiantes"
                searchPlaceholder="Escribe nombre o documento..."
                emptyMessage={personaSearch.length < 2 ? "Escribe al menos 2 caracteres" : "Sin resultados"}
              />
              <Input
                placeholder="Buscar persona (≥2 caracteres)"
                value={personaSearch}
                onChange={(e) => setPersonaSearch(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Vinculación</Label>
              <Select value={tipoVinculacion} onValueChange={setTipoVinculacion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="independiente">Independiente</SelectItem>
                  <SelectItem value="arl">ARL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nivel de Formación</Label>
              <Select value={nivelFormacionId} onValueChange={setNivelFormacionId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {niveles.map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.nombreNivel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Rango de Fechas</Label>
              <Select value={dateScope} onValueChange={(v: DateScope) => setDateScope(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin filtro de fecha</SelectItem>
                  <SelectItem value="creacion">Por fecha de creación</SelectItem>
                  <SelectItem value="inicio">Por fecha de inicio del curso</SelectItem>
                </SelectContent>
              </Select>
              {dateScope !== "ninguno" && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
                </div>
              )}
            </div>
          </div>

          {/* ===== Columnas ===== */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">Columnas ({selected.size})</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="default" size="sm" onClick={selectDefaults} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Por defecto
              </Button>
              <Button variant="outline" size="sm" onClick={selectAll}>Todas</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Solo obligatorias</Button>
            </div>

            <ScrollArea className="h-[340px] rounded-md border p-3">
              {MATRICULA_COLUMN_GROUPS.map((group) => {
                const cols = MATRICULA_COLUMN_CATALOG.filter((c) => c.group === group);
                if (cols.length === 0) return null;
                return (
                  <div key={group} className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{group}</p>
                    <div className="grid grid-cols-1 gap-y-1.5">
                      {cols.map((col) => (
                        <label
                          key={col.key}
                          className={`flex items-center gap-2 text-sm cursor-pointer ${col.mandatory ? "opacity-90" : ""}`}
                        >
                          <Checkbox
                            checked={selected.has(col.key)}
                            disabled={col.mandatory}
                            onCheckedChange={() => toggle(col.key)}
                          />
                          <span className={col.mandatory ? "font-medium" : ""}>{col.header}</span>
                          {col.mandatory && (
                            <span className="text-[10px] text-primary uppercase tracking-wide">obligatoria</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleExport} disabled={loading || selected.size === 0}>
            {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
            Exportar CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
