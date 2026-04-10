import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Trash2, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { ColumnSelector, ColumnConfig } from "@/components/shared/ColumnSelector";
import { RowActions, createViewAction, createEditAction } from "@/components/shared/RowActions";
import { BulkAction } from "@/components/shared/BulkActionsBar";
import { CursoDetailSheet } from "@/components/cursos/CursoDetailSheet";
import { useCursos } from "@/hooks/useCursos";
import { usePersonalByTipoCargo } from "@/hooks/usePersonal";
import { Curso } from "@/types";
import { resolveNivelCursoLabel } from "@/utils/resolveNivelLabel";
import { useNivelesFormacion } from "@/hooks/useNivelesFormacion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STORAGE_KEY = "cursos_visible_columns";

const ESTADO_OPTIONS = [
  { value: "abierto", label: "Abierto" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "cerrado", label: "Cerrado" },
];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "fechaCreacion", header: "Fecha Creación", visible: true },
  { key: "curso", header: "Curso", visible: true },
  { key: "entrenador", header: "Entrenador", visible: true },
  { key: "fechas", header: "Fechas", visible: true },
  { key: "duracion", header: "Duración", visible: true },
  { key: "capacidad", header: "Inscritos", visible: true },
  { key: "estado", header: "Estado", visible: true },
  { key: "supervisor", header: "Supervisor", visible: false },
  { key: "numeroCurso", header: "N° Curso", visible: false },
  { key: "tipoFormacion", header: "Tipo Formación", visible: false },
  { key: "minTrabajoRegistro", header: "Registro Min. Trabajo", visible: false },
  { key: "minTrabajoResponsable", header: "Responsable Min. Trabajo", visible: false },
  { key: "horasTotales", header: "Horas Totales", visible: false },
  { key: "actions", header: "", visible: true, alwaysVisible: true },
];

export default function CursosListView() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    estado: "todos",
    tipoFormacion: "todos",
    entrenador: "todos",
  });
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_COLUMNS;
    const parsed: ColumnConfig[] = JSON.parse(saved);
    return DEFAULT_COLUMNS.map(def => {
      const existing = parsed.find(c => c.key === def.key);
      return existing ? { ...def, visible: existing.visible } : def;
    });
  });

  const { data: cursos = [], isLoading } = useCursos();
  const { data: entrenadores = [] } = usePersonalByTipoCargo('entrenador');
  const { data: niveles = [] } = useNivelesFormacion();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const entrenadorOptions = entrenadores.map(e => ({
    value: e.id,
    label: `${e.nombres} ${e.apellidos}`,
  }));

  const filterConfigs: FilterConfig[] = [
    {
      key: "estado",
      label: "Estado del Curso",
      type: "select",
      options: ESTADO_OPTIONS,
    },
    {
      key: "tipoFormacion",
      label: "Nivel de Formación",
      type: "select",
      options: niveles.map(n => ({ value: n.id, label: n.nombreNivel })),
    },
    {
      key: "entrenador",
      label: "Entrenador",
      type: "select",
      options: entrenadorOptions,
    },
  ];

  const activeFilterCount = Object.entries(filters).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== "todos";
  }).length;

  const getCursoLabel = (c: Curso) =>
    `${c.numeroCurso}—${resolveNivelCursoLabel(c.nivelFormacionId || c.tipoFormacion)}`;

  const filteredCursos = cursos.filter((c) => {
    const label = getCursoLabel(c).toLowerCase();
    const matchesSearch =
      !searchQuery ||
      label.includes(searchQuery.toLowerCase()) ||
      c.entrenadorNombre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEstado = filters.estado === "todos" || c.estado === filters.estado;
    const matchesNivel = filters.tipoFormacion === "todos" || c.nivelFormacionId === filters.tipoFormacion;
    const matchesEntrenador = filters.entrenador === "todos" || c.entrenadorId === filters.entrenador;

    return matchesSearch && matchesEstado && matchesNivel && matchesEntrenador;
  });

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ estado: "todos", tipoFormacion: "todos", entrenador: "todos" });
  };

  const selectedCurso = selectedIndex !== null ? filteredCursos[selectedIndex] : null;

  const handleNavigate = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    const newIndex =
      direction === "prev"
        ? Math.max(0, selectedIndex - 1)
        : Math.min(filteredCursos.length - 1, selectedIndex + 1);
    setSelectedIndex(newIndex);
  };

  const handleRowClick = (curso: Curso) => {
    const index = filteredCursos.findIndex((c) => c.id === curso.id);
    setSelectedIndex(index);
  };

  const handleViewRow = (curso: Curso) => {
    const index = filteredCursos.findIndex((c) => c.id === curso.id);
    setSelectedIds([curso.id]);
    setSelectedIndex(index);
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Eliminar",
      icon: Trash2,
      variant: "destructive",
      onClick: (ids) => {
        toast({ title: `Eliminar ${ids.length} cursos (pendiente)` });
      },
    },
    {
      label: "Exportar",
      icon: Download,
      variant: "outline",
      onClick: (ids) => {
        toast({ title: `Exportando ${ids.length} registros...` });
      },
    },
  ];

  const columns: Column<Curso>[] = [
    {
      key: "fechaCreacion",
      header: "Fecha Creación",
      className: "min-w-[120px]",
      sortable: true,
      sortKey: "createdAt",
      render: (c: Curso) => format(new Date(c.createdAt), "dd/MM/yyyy"),
    },
    {
      key: "curso",
      header: "Curso",
      className: "min-w-[250px]",
      sortable: true,
      sortValue: (c: Curso) => getCursoLabel(c).toLowerCase(),
      render: (c: Curso) => (
        <span className="font-medium max-w-[300px] truncate block">
          {getCursoLabel(c)}
        </span>
      ),
    },
    {
      key: "entrenador",
      header: "Entrenador",
      className: "min-w-[160px]",
      sortable: true,
      sortKey: "entrenadorNombre",
      render: (c: Curso) => c.entrenadorNombre,
    },
    {
      key: "fechas",
      header: "Fechas",
      className: "min-w-[180px]",
      sortable: true,
      sortKey: "fechaInicio",
      render: (c: Curso) => (
        <div className="text-sm">
          <span>{format(new Date(c.fechaInicio), "dd/MM/yyyy")}</span>
          <span className="text-muted-foreground"> - {format(new Date(c.fechaFin), "dd/MM/yyyy")}</span>
        </div>
      ),
    },
    {
      key: "duracion",
      header: "Duración",
      sortable: true,
      sortValue: (c: Curso) => c.duracionDias,
      render: (c: Curso) => (
        <span className="text-sm">{c.duracionDias}d ({c.horasTotales}h)</span>
      ),
    },
    {
      key: "capacidad",
      header: "Inscritos",
      render: (c: Curso) => {
        const ocupacion = c.matriculasIds.length / c.capacidadMaxima;
        const colorClass = ocupacion >= 0.9
          ? "text-destructive"
          : ocupacion >= 0.7
            ? "text-amber-600"
            : "text-muted-foreground";
        return (
          <div className="flex items-center gap-1.5">
            <Users className={`h-4 w-4 ${colorClass}`} />
            <span className={colorClass}>
              {c.matriculasIds.length}/{c.capacidadMaxima}
            </span>
          </div>
        );
      },
    },
    {
      key: "estado",
      header: "Estado",
      sortable: true,
      sortKey: "estado",
      render: (c: Curso) => <StatusBadge status={c.estado} />,
    },
    {
      key: "supervisor",
      header: "Supervisor",
      render: (c: Curso) => c.supervisorNombre || "-",
    },
    {
      key: "numeroCurso",
      header: "N° Curso",
      render: (c: Curso) => c.numeroCurso,
    },
    {
      key: "tipoFormacion",
      header: "Tipo Formación",
      render: (c: Curso) => resolveNivelCursoLabel(c.nivelFormacionId || c.tipoFormacion),
    },
    {
      key: "minTrabajoRegistro",
      header: "Registro Min. Trabajo",
      render: (c: Curso) => c.minTrabajoRegistro || "-",
    },
    {
      key: "minTrabajoResponsable",
      header: "Responsable Min. Trabajo",
      render: (c: Curso) => c.minTrabajoResponsable || "-",
    },
    {
      key: "horasTotales",
      header: "Horas Totales",
      render: (c: Curso) => `${c.horasTotales}h`,
    },
    {
      key: "actions",
      header: "",
      className: "w-[80px]",
      render: (c: Curso) => (
        <RowActions
          showOnHover
          actions={[
            createViewAction(() => navigate(`/cursos/${c.id}`)),
            createEditAction(() => navigate(`/cursos/${c.id}`)),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FilterPopover
            open={filterOpen}
            onOpenChange={setFilterOpen}
            filters={filterConfigs}
            values={filters}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
            trigger={
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-4 w-4" />
                Filtro
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            }
          />
          <ColumnSelector columns={columnConfig} onChange={setColumnConfig} defaultColumns={DEFAULT_COLUMNS} />
        </div>
        <SearchInput
          placeholder="Buscar por tipo, número o entrenador..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-72"
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredCursos}
        columns={columns}
        columnConfig={columnConfig}
        isLoading={isLoading}
        emptyMessage="No se encontraron cursos"
        onRowClick={handleRowClick}
        countLabel="cursos"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={bulkActions}
        isPanelOpen={selectedIndex !== null}
        activeRowId={selectedCurso?.id}
        onViewRow={handleViewRow}
      />

      {/* Detail Sheet */}
      <CursoDetailSheet
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
        curso={selectedCurso}
        currentIndex={selectedIndex ?? 0}
        totalCount={filteredCursos.length}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
