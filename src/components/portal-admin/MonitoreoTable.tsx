import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterPopover, FilterConfig } from '@/components/shared/FilterPopover';
import { MonitoreoDetalleDialog } from './MonitoreoDetalleDialog';
import { usePortalMonitoreo } from '@/hooks/usePortalMonitoreo';
import { getFilterOptions, MonitoreoRow, MonitoreoFiltros } from '@/services/portalMonitoreoService';
import { portalDocumentosCatalogo } from '@/data/portalAdminConfig';
import { Filter, Eye, CheckCircle2, Clock, Users } from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

const estadoChipClass: Record<string, string> = {
  completado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  bloqueado: 'bg-muted text-muted-foreground border-border',
};

const estadoChipLabel: Record<string, string> = {
  completado: 'Completado',
  pendiente: 'Pendiente',
  bloqueado: 'Bloqueado',
};

function getRowProgress(row: MonitoreoRow) {
  const total = row.documentosEstado.length;
  const completados = row.documentosEstado.filter(d => d.estado === 'completado').length;
  return { total, completados, percent: total > 0 ? Math.round((completados / total) * 100) : 0 };
}

export function MonitoreoTable() {
  const [busqueda, setBusqueda] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string | string[]>>({});
  const [selectedRow, setSelectedRow] = useState<MonitoreoRow | null>(null);

  const filtros: MonitoreoFiltros = useMemo(
    () => ({
      busqueda,
      cursoId: filterValues.cursoId as string,
      tipoFormacion: filterValues.tipoFormacion as string,
      documentoPendiente: filterValues.documentoPendiente as string,
    }),
    [busqueda, filterValues]
  );

  const { data: rows, isLoading, refetch } = usePortalMonitoreo(filtros);
  const options = useMemo(() => getFilterOptions(), []);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      { key: 'cursoId', label: 'Curso', type: 'select', options: options.cursos },
      { key: 'tipoFormacion', label: 'Nivel de formación', type: 'select', options: options.niveles },
      { key: 'documentoPendiente', label: 'Documento pendiente', type: 'select', options: options.documentos },
    ],
    [options]
  );

  const activeFilterCount = Object.values(filterValues).filter(
    (v) => (Array.isArray(v) ? v.length > 0 : v && v !== 'todos')
  ).length;

  // Summary stats
  const stats = useMemo(() => {
    if (!rows) return { total: 0, completados: 0, pendientes: 0 };
    const total = rows.length;
    const completados = rows.filter(r => r.documentosEstado.every(d => d.estado === 'completado')).length;
    const pendientes = rows.filter(r => r.documentosEstado.some(d => d.estado === 'pendiente')).length;
    return { total, completados, pendientes };
  }, [rows]);

  // Refresh selected row after mutations
  const handleDataChange = useCallback(async () => {
    const result = await refetch();
    if (selectedRow && result.data) {
      const updated = result.data.find(r => r.matriculaId === selectedRow.matriculaId);
      setSelectedRow(updated ?? null);
    }
  }, [refetch, selectedRow]);

  // Dynamic doc columns from catalog
  const docColumns = portalDocumentosCatalogo;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{stats.total}</span>
          <span className="text-muted-foreground">matrículas</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-emerald-700">{stats.completados}</span>
          <span className="text-emerald-600">todo completo</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm">
          <Clock className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-amber-700">{stats.pendientes}</span>
          <span className="text-amber-600">con pendientes</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <SearchInput
          value={busqueda}
          onChange={setBusqueda}
          placeholder="Buscar por nombre, cédula o curso…"
          className="w-full sm:max-w-sm"
        />
        <FilterPopover
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={filterConfigs}
          values={filterValues}
          onChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
          onClear={() => setFilterValues({})}
          trigger={
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          }
        />
      </div>

      {/* Results counter */}
      {rows && (
        <p className="text-xs text-muted-foreground">
          Mostrando {rows.length} matrícula{rows.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Table */}
      <TooltipProvider delayDuration={200}>
        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead className="text-center">Progreso</TableHead>
                {docColumns.map((doc) => (
                  <TableHead key={doc.key} className="text-center">
                    {doc.nombre}
                  </TableHead>
                ))}
                <TableHead className="text-center">Acceso</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!rows || rows.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5 + docColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    No se encontraron matrículas.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const progress = getRowProgress(row);
                  return (
                    <TableRow
                      key={row.matriculaId}
                      className="cursor-pointer"
                      onClick={() => setSelectedRow(row)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{row.personaNombre}</p>
                          <p className="text-xs text-muted-foreground">{row.personaCedula}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{row.cursoNumeroCurso}</TableCell>
                      <TableCell className="text-sm">{row.tipoFormacionLabel}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <Progress value={progress.percent} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {progress.completados}/{progress.total}
                          </span>
                        </div>
                      </TableCell>
                      {docColumns.map((docCol) => {
                        const docEstado = row.documentosEstado.find((d) => d.key === docCol.key);
                        const estado = docEstado?.estado ?? 'bloqueado';
                        const badge = (
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${estadoChipClass[estado]}`}
                          >
                            {estadoChipLabel[estado]}
                          </Badge>
                        );
                        return (
                          <TableCell key={docCol.key} className="text-center">
                            {estado === 'bloqueado' ? (
                              <Tooltip>
                                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                                  Este documento aún no está disponible. Puede deberse a que el portal no está habilitado para esta matrícula o a que existe un documento previo que debe completarse primero.
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              badge
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">
                        <Badge variant={row.portalHabilitado ? 'default' : 'secondary'} className="text-[10px]">
                          {row.portalHabilitado ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRow(row);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {/* Detail dialog */}
      <MonitoreoDetalleDialog
        row={selectedRow}
        open={!!selectedRow}
        onOpenChange={(open) => { if (!open) setSelectedRow(null); }}
        onDataChange={handleDataChange}
      />
    </div>
  );
}
