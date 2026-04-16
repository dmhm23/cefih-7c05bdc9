import { useState, useCallback, useMemo } from 'react';
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { empresaService } from '@/services/empresaService';
import { EmpresaImportRow, parsearArchivoEmpresas } from '@/utils/empresaPlantilla';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterTab = 'todas' | 'validas' | 'errores';

function hasFieldError(errors: string[], fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return errors.some(e => e.toLowerCase().includes(lower));
}

export function ImportarEmpresasDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<EmpresaImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: { row: number; error: string }[] } | null>(null);
  const [filter, setFilter] = useState<FilterTab>('todas');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const validRows = rows.filter(r => r.errors.length === 0);
  const errorRows = rows.filter(r => r.errors.length > 0);

  const filteredRows = useMemo(() => {
    if (filter === 'validas') return validRows;
    if (filter === 'errores') return errorRows;
    return rows;
  }, [rows, validRows, errorRows, filter]);

  const toggleRow = (rowIndex: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex);
      return next;
    });
  };

  const handleFile = useCallback(async (file: File) => {
    try {
      const parsed = await parsearArchivoEmpresas(file);
      setRows(parsed);
      setFileName(file.name);
      setResult(null);
      setFilter('todas');
      setExpandedRows(new Set());
    } catch {
      toast({ title: 'Error al leer el archivo', variant: 'destructive' });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const empresas = validRows.map(r => ({
        nombreEmpresa: r.nombreEmpresa,
        nit: r.nit,
        representanteLegal: r.representanteLegal,
        sectorEconomico: r.sectorEconomico,
        arl: r.arl,
        direccion: r.direccion,
        telefonoEmpresa: r.telefonoEmpresa,
        personaContacto: r.personaContacto,
        telefonoContacto: '',
        emailContacto: r.emailContacto,
        contactos: [],
        ciudad: r.ciudad,
        departamento: r.departamento,
        observaciones: r.observaciones,
      }));
      const res = await empresaService.createBulk(empresas as any);
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      toast({ title: `${res.created} empresas importadas correctamente` });
      logActivity({ action: "importar", module: "empresas", description: `Importó ${res.created} empresa(s) desde archivo "${fileName}"`, entityType: "empresa", metadata: { archivo: fileName, total_filas: rows.length, importadas: res.created, errores: res.errors.length } });
    } catch {
      toast({ title: 'Error al importar', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setRows([]);
    setFileName('');
    setResult(null);
    setFilter('todas');
    setExpandedRows(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Empresas</DialogTitle>
        </DialogHeader>

        {rows.length === 0 && !result ? (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls,.csv';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFile(file);
              };
              input.click();
            }}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Arrastra tu archivo o haz clic para seleccionar</p>
            <p className="text-sm text-muted-foreground mt-1">Formatos: .xlsx, .xls, .csv</p>
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium">{result.created} empresas creadas exitosamente</p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-destructive">{result.errors.length} filas con errores</p>
                )}
              </div>
            </div>
            {result.errors.length > 0 && (
              <ScrollArea className="max-h-48">
                <div className="space-y-1">
                  {result.errors.map((e, i) => (
                    <div key={i} className="text-sm flex gap-2">
                      <Badge variant="destructive" className="shrink-0">Fila {e.row}</Badge>
                      <span className="text-muted-foreground">{e.error}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <div className="space-y-3 flex-1 min-h-0">
            {/* File header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setRows([]); setFileName(''); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary badges */}
            <div className="flex gap-3">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> {validRows.length} válidas
              </Badge>
              {errorRows.length > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" /> {errorRows.length} con errores
                </Badge>
              )}
            </div>

            {/* Filter tabs */}
            <Tabs value={filter} onValueChange={v => setFilter(v as FilterTab)}>
              <TabsList className="h-8">
                <TabsTrigger value="todas" className="text-xs px-3 py-1">Todas ({rows.length})</TabsTrigger>
                <TabsTrigger value="validas" className="text-xs px-3 py-1">Válidas ({validRows.length})</TabsTrigger>
                <TabsTrigger value="errores" className="text-xs px-3 py-1">Con errores ({errorRows.length})</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Table */}
            <ScrollArea className="max-h-[300px] border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left w-8"></th>
                    <th className="px-2 py-2 text-left">Fila</th>
                    <th className="px-2 py-2 text-left">Nombre</th>
                    <th className="px-2 py-2 text-left">NIT</th>
                    <th className="px-2 py-2 text-left">Sector</th>
                    <th className="px-2 py-2 text-left">ARL</th>
                    <th className="px-2 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(r => {
                    const hasErrors = r.errors.length > 0;
                    const isExpanded = expandedRows.has(r.rowIndex);
                    return (
                      <>
                        <tr
                          key={r.rowIndex}
                          className={`${hasErrors ? 'bg-destructive/5' : ''} ${hasErrors ? 'cursor-pointer hover:bg-destructive/10' : ''}`}
                          onClick={() => hasErrors && toggleRow(r.rowIndex)}
                        >
                          <td className="px-2 py-1.5">
                            {hasErrors && (
                              isExpanded
                                ? <ChevronDown className="h-3.5 w-3.5 text-destructive" />
                                : <ChevronRight className="h-3.5 w-3.5 text-destructive" />
                            )}
                          </td>
                          <td className="px-2 py-1.5">{r.rowIndex}</td>
                          <td className={`px-2 py-1.5 ${hasFieldError(r.errors, 'nombre') ? 'bg-destructive/15 rounded' : ''}`}>
                            {r.nombreEmpresa || '—'}
                          </td>
                          <td className={`px-2 py-1.5 ${hasFieldError(r.errors, 'nit') ? 'bg-destructive/15 rounded' : ''}`}>
                            {r.nit || '—'}
                          </td>
                          <td className={`px-2 py-1.5 ${hasFieldError(r.errors, 'sector') ? 'bg-destructive/15 rounded' : ''}`}>
                            {r.sectorEconomico || '—'}
                          </td>
                          <td className={`px-2 py-1.5 ${hasFieldError(r.errors, 'arl') ? 'bg-destructive/15 rounded' : ''}`}>
                            {r.arl || '—'}
                          </td>
                          <td className="px-2 py-1.5">
                            {hasErrors ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                {r.errors.length} error{r.errors.length > 1 ? 'es' : ''}
                              </Badge>
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </td>
                        </tr>
                        {hasErrors && isExpanded && (
                          <tr key={`${r.rowIndex}-errors`} className="bg-destructive/5">
                            <td colSpan={7} className="px-4 py-2">
                              <ul className="space-y-1">
                                {r.errors.map((err, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-destructive">
                                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                    <span>{err}</span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={handleClose}>Cerrar</Button>
          ) : rows.length > 0 ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0 || importing}>
                {importing ? 'Importando...' : `Importar ${validRows.length} empresas`}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
