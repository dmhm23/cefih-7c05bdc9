import { useState, useCallback, useMemo, useEffect } from 'react';
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Upload, CheckCircle2, AlertCircle, AlertTriangle, FileSpreadsheet, X, ChevronDown, ChevronRight, Copy, Check, Merge } from 'lucide-react';
import { CopyableCell } from '@/components/shared/CopyableCell';
import { useToast } from '@/hooks/use-toast';
import { personaService } from '@/services/personaService';
import { PersonaImportRow, parsearArchivoPersonas } from '@/utils/personaPlantilla';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FilterTab = 'todas' | 'validas' | 'errores' | 'duplicados';

function hasFieldError(errors: string[], fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return errors.some(e => e.toLowerCase().includes(lower));
}

function CopyErrorsButton({ rowIndex, errors }: { rowIndex: number; errors: string[] }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `Fila ${rowIndex}: ${errors.join('; ')}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-destructive/10 transition-colors" title="Copiar errores">
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-destructive" />}
    </button>
  );
}

function CopyAllErrorsButton({ errorRows }: { errorRows: PersonaImportRow[] }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const text = errorRows
      .map(r => `${r.nombres || '—'} ${r.apellidos || ''}, ${r.numeroDocumento || '—'}, ${r.errors.join('; ')}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-xs text-destructive hover:text-destructive" onClick={handleCopy}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Copiar todos'}
    </Button>
  );
}

export function ImportarPersonasDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<PersonaImportRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: { row: number; error: string }[] } | null>(null);
  const [filter, setFilter] = useState<FilterTab>('todas');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [existingDocs, setExistingDocs] = useState<Set<string>>(new Set());
  const [checkingBD, setCheckingBD] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);

  const validRows = useMemo(() => rows.filter(r => r.errors.length === 0 && !r.duplicadoEnArchivo), [rows]);
  const errorRows = useMemo(() => rows.filter(r => r.errors.length > 0), [rows]);
  const duplicadosArchivo = useMemo(() => rows.filter(r => r.duplicadoEnArchivo), [rows]);
  const existentesEnBD = useMemo(() => rows.filter(r => r.existeEnBD && !r.duplicadoEnArchivo && r.errors.length === 0), [rows]);
  const nuevas = useMemo(() => validRows.filter(r => !r.existeEnBD), [validRows, existingDocs]);
  const duplicadosTotal = useMemo(() => rows.filter(r => r.duplicadoEnArchivo || r.existeEnBD), [rows]);

  const importableRows = useMemo(() => {
    if (updateExisting) return validRows;
    return validRows.filter(r => !r.existeEnBD);
  }, [validRows, updateExisting]);

  const filteredRows = useMemo(() => {
    if (filter === 'validas') return validRows;
    if (filter === 'errores') return errorRows;
    if (filter === 'duplicados') return duplicadosTotal;
    return rows;
  }, [rows, validRows, errorRows, duplicadosTotal, filter]);

  // Check BD for existing documents after parsing
  useEffect(() => {
    if (rows.length === 0) return;
    const docs = rows.filter(r => r.numeroDocumento && r.errors.length === 0 && !r.duplicadoEnArchivo).map(r => r.numeroDocumento);
    if (docs.length === 0) return;

    setCheckingBD(true);
    personaService.checkExisting(docs).then(existing => {
      setExistingDocs(existing);
      if (existing.size > 0) {
        setRows(prev => prev.map(r => ({
          ...r,
          existeEnBD: existing.has(r.numeroDocumento) && !r.duplicadoEnArchivo && r.errors.length === 0,
          warnings: existing.has(r.numeroDocumento) && !r.duplicadoEnArchivo && r.errors.length === 0
            ? [...(r.warnings || []).filter(w => !w.includes('Ya existe en el sistema')), 'Ya existe en el sistema']
            : (r.warnings || []),
        })));
      }
    }).catch(() => {
      // silent fail — import will still work
    }).finally(() => setCheckingBD(false));
  }, [rows.length]); // intentionally only on initial parse

  const toggleRow = (rowIndex: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex);
      return next;
    });
  };

  const handleFile = useCallback(async (file: File) => {
    try {
      const parsed = await parsearArchivoPersonas(file);
      setRows(parsed);
      setFileName(file.name);
      setResult(null);
      setFilter('todas');
      setExpandedRows(new Set());
      setExistingDocs(new Set());
      setUpdateExisting(false);
    } catch {
      toast({ title: 'Error al leer el archivo', variant: 'destructive' });
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleMergeDuplicates = () => {
    setRows(prev => prev.filter(r => !r.duplicadoEnArchivo));
    toast({ title: `${duplicadosArchivo.length} duplicados fusionados (conservando primeros registros)` });
  };

  const handleImport = async () => {
    if (importableRows.length === 0) return;
    setImporting(true);
    try {
      const personas = importableRows.map(r => ({
        tipoDocumento: r.tipoDocumento,
        numeroDocumento: r.numeroDocumento,
        nombres: r.nombres,
        apellidos: r.apellidos,
        genero: r.genero || 'M',
        fechaNacimiento: r.fechaNacimiento || '',
        paisNacimiento: r.paisNacimiento || '',
        rh: r.rh || '',
        nivelEducativo: r.nivelEducativo || 'primaria',
        email: r.email || '',
        telefono: r.telefono || '',
        contactoEmergencia: (r.contactoEmergenciaNombre || r.contactoEmergenciaTelefono)
          ? { nombre: r.contactoEmergenciaNombre, telefono: r.contactoEmergenciaTelefono, parentesco: r.contactoEmergenciaParentesco }
          : { nombre: '', telefono: '', parentesco: '' },
      }));
      const res = await personaService.upsertBulk(personas as any, existingDocs, updateExisting);
      setResult(res);
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      const parts = [];
      if (res.created > 0) parts.push(`${res.created} creadas`);
      if (res.updated > 0) parts.push(`${res.updated} actualizadas`);
      if (res.skipped > 0) parts.push(`${res.skipped} omitidas`);
      toast({ title: `Importación completada: ${parts.join(', ')}` });
      logActivity({ action: "importar", module: "personas", description: `Importó ${res.created} persona(s) desde archivo "${fileName}"`, entityType: "persona", metadata: { archivo: fileName, total_filas: rows.length, importadas: res.created, actualizadas: res.updated, omitidas: res.skipped, errores: res.errors.length } });
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
    setExistingDocs(new Set());
    setUpdateExisting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Personas</DialogTitle>
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
                <p className="font-medium">
                  {result.created > 0 && `${result.created} personas creadas`}
                  {result.created > 0 && result.updated > 0 && ', '}
                  {result.updated > 0 && `${result.updated} actualizadas`}
                </p>
                {result.skipped > 0 && (
                  <p className="text-sm text-muted-foreground">{result.skipped} omitidas (ya existían)</p>
                )}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{fileName}</span>
                {checkingBD && <span className="text-xs text-muted-foreground animate-pulse">Verificando duplicados...</span>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setRows([]); setFileName(''); setExistingDocs(new Set()); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" /> {nuevas.length} nuevas
              </Badge>
              {existentesEnBD.length > 0 && (
                <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                  <AlertTriangle className="h-3 w-3" /> {existentesEnBD.length} ya en BD
                </Badge>
              )}
              {duplicadosArchivo.length > 0 && (
                <div className="flex items-center gap-1">
                  <Badge className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                    <AlertTriangle className="h-3 w-3" /> {duplicadosArchivo.length} duplicados archivo
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 px-2 gap-1 text-xs text-amber-700 hover:text-amber-900" onClick={handleMergeDuplicates}>
                    <Merge className="h-3.5 w-3.5" />
                    Fusionar
                  </Button>
                </div>
              )}
              {errorRows.length > 0 && (
                <>
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" /> {errorRows.length} con errores
                  </Badge>
                  <CopyAllErrorsButton errorRows={errorRows} />
                </>
              )}
            </div>

            {/* Update existing toggle */}
            {existentesEnBD.length > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200">
                <Switch checked={updateExisting} onCheckedChange={setUpdateExisting} id="update-existing" />
                <label htmlFor="update-existing" className="text-sm text-amber-800 cursor-pointer">
                  Actualizar existentes con datos del archivo
                </label>
              </div>
            )}

            <Tabs value={filter} onValueChange={v => setFilter(v as FilterTab)}>
              <TabsList className="h-8">
                <TabsTrigger value="todas" className="text-xs px-3 py-1">Todas ({rows.length})</TabsTrigger>
                <TabsTrigger value="validas" className="text-xs px-3 py-1">Válidas ({validRows.length})</TabsTrigger>
                {duplicadosTotal.length > 0 && (
                  <TabsTrigger value="duplicados" className="text-xs px-3 py-1">Duplicados ({duplicadosTotal.length})</TabsTrigger>
                )}
                <TabsTrigger value="errores" className="text-xs px-3 py-1">Con errores ({errorRows.length})</TabsTrigger>
              </TabsList>
            </Tabs>

            <ScrollArea className="max-h-[40vh] border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left w-8"></th>
                    <th className="px-2 py-2 text-left">Fila</th>
                    <th className="px-2 py-2 text-left">Documento</th>
                    <th className="px-2 py-2 text-left">Nombre</th>
                    <th className="px-2 py-2 text-left">Teléfono</th>
                    <th className="px-2 py-2 text-left">Email</th>
                    <th className="px-2 py-2 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map(r => {
                    const hasErrors = r.errors.length > 0;
                    const hasWarnings = (r.warnings?.length || 0) > 0 || r.existeEnBD || r.duplicadoEnArchivo;
                    const isExpandable = hasErrors || hasWarnings;
                    const isExpanded = expandedRows.has(r.rowIndex);
                    const bgClass = hasErrors
                      ? 'bg-destructive/5'
                      : (r.duplicadoEnArchivo || r.existeEnBD)
                        ? 'bg-amber-50/70'
                        : '';
                    return (
                      <>
                        <tr
                          key={r.rowIndex}
                          className={`${bgClass} ${isExpandable ? 'cursor-pointer hover:bg-muted/30' : ''}`}
                          onClick={() => isExpandable && toggleRow(r.rowIndex)}
                        >
                          <td className="px-2 py-1.5">
                            {isExpandable && (
                              isExpanded
                                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </td>
                          <td className="px-2 py-1.5">{r.rowIndex}</td>
                          <td className={`px-2 py-1.5 ${hasFieldError(r.errors, 'documento') ? 'bg-destructive/15 rounded' : ''}`}>
                            {r.numeroDocumento ? <CopyableCell value={`${r.tipoDocumento} ${r.numeroDocumento}`} /> : '—'}
                          </td>
                          <td className={`px-2 py-1.5 ${hasFieldError(r.errors, 'nombre') || hasFieldError(r.errors, 'apellido') ? 'bg-destructive/15 rounded' : ''}`}>
                            {(r.nombres || r.apellidos) ? <CopyableCell value={`${r.nombres} ${r.apellidos}`.trim()} /> : '—'}
                          </td>
                          <td className="px-2 py-1.5">{r.telefono || '—'}</td>
                          <td className="px-2 py-1.5">{r.email || '—'}</td>
                          <td className="px-2 py-1.5">
                            {hasErrors ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                {r.errors.length} error{r.errors.length > 1 ? 'es' : ''}
                              </Badge>
                            ) : r.duplicadoEnArchivo ? (
                              <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                                Dup. fila {r.duplicadoFilaOriginal}
                              </Badge>
                            ) : r.existeEnBD ? (
                              <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
                                Ya existe
                              </Badge>
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                          </td>
                        </tr>
                        {isExpandable && isExpanded && (
                          <tr key={`${r.rowIndex}-details`} className={bgClass}>
                            <td colSpan={7} className="px-4 py-2">
                              <div className="flex items-start justify-between gap-2">
                                <ul className="space-y-1 flex-1">
                                  {r.errors.map((err, i) => (
                                    <li key={`e-${i}`} className="flex items-start gap-2 text-xs text-destructive">
                                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                      <span>{err}</span>
                                    </li>
                                  ))}
                                  {(r.warnings || []).map((w, i) => (
                                    <li key={`w-${i}`} className="flex items-start gap-2 text-xs text-amber-700">
                                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                                      <span>{w}</span>
                                    </li>
                                  ))}
                                </ul>
                                {hasErrors && <CopyErrorsButton rowIndex={r.rowIndex} errors={r.errors} />}
                              </div>
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
              <Button onClick={handleImport} disabled={importableRows.length === 0 || importing || checkingBD}>
                {importing ? 'Importando...' : `Importar ${importableRows.length} personas`}
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
