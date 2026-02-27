import { useState, useMemo } from 'react';
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
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterPopover, FilterConfig } from '@/components/shared/FilterPopover';
import { MonitoreoDetalleDialog } from './MonitoreoDetalleDialog';
import { usePortalMonitoreo } from '@/hooks/usePortalMonitoreo';
import { getFilterOptions, MonitoreoRow, MonitoreoFiltros } from '@/services/portalMonitoreoService';
import { portalDocumentosCatalogo } from '@/data/portalAdminConfig';
import { Filter, Eye } from 'lucide-react';

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

  const { data: rows, isLoading } = usePortalMonitoreo(filtros);
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

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estudiante</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Nivel</TableHead>
              {docColumns.map((doc) => (
                <TableHead key={doc.key} className="text-center">
                  {doc.nombre}
                </TableHead>
              ))}
              <TableHead className="text-center">Portal</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!rows || rows.length === 0) ? (
              <TableRow>
                <TableCell colSpan={4 + docColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  No se encontraron matrículas.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
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
                  {docColumns.map((docCol) => {
                    const docEstado = row.documentosEstado.find((d) => d.key === docCol.key);
                    const estado = docEstado?.estado ?? 'bloqueado';
                    return (
                      <TableCell key={docCol.key} className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${estadoChipClass[estado]}`}
                        >
                          {estadoChipLabel[estado]}
                        </Badge>
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    <Badge variant={row.portalHabilitado ? 'default' : 'secondary'} className="text-[10px]">
                      {row.portalHabilitado ? 'Sí' : 'No'}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail dialog */}
      <MonitoreoDetalleDialog
        row={selectedRow}
        open={!!selectedRow}
        onOpenChange={(open) => { if (!open) setSelectedRow(null); }}
      />
    </div>
  );
}
