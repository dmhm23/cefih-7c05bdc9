import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Trash2, Download, Filter } from "lucide-react";
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
import { Curso } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STORAGE_KEY = "cursos_visible_columns";

const ESTADO_OPTIONS = [
  { value: "abierto", label: "Abierto" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "cerrado", label: "Cerrado" },
];

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "nombre", header: "Nombre del Curso", visible: true },
  { key: "entrenador", header: "Entrenador", visible: true },
  { key: "fechas", header: "Fechas", visible: true },
  { key: "duracion", header: "Duración", visible: true },
  { key: "capacidad", header: "Inscritos", visible: true },
  { key: "estado", header: "Estado", visible: true },
  { key: "actions", header: "", visible: true, alwaysVisible: true },
];

export default function CursosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    estado: "todos",
  });
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const { data: cursos = [], isLoading } = useCursos();

  // Persist column config
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const filterConfigs: FilterConfig[] = [
    {
      key: "estado",
      label: "Estado del Curso",
      type: "select",
      options: ESTADO_OPTIONS,
    },
  ];

  const activeFilterCount = Object.entries(filters).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== "todos";
  }).length;

  const filteredCursos = cursos.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.entrenadorNombre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEstado = filters.estado === "todos" || c.estado === filters.estado;

    return matchesSearch && matchesEstado;
  });

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ estado: "todos" });
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
    // Agregar a selección si no está
    if (!selectedIds.includes(curso.id)) {
      setSelectedIds((prev) => [...prev, curso.id]);
    }
    // Abrir panel
    setSelectedIndex(index);
  };

  // Handler para "Ver" - cambia a solo ese registro
  const handleViewRow = (curso: Curso) => {
    const index = filteredCursos.findIndex((c) => c.id === curso.id);
    // Cambiar selección a SOLO este registro
    setSelectedIds([curso.id]);
    // Actualizar panel
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
      key: "nombre",
      header: "Nombre del Curso",
      render: (c: Curso) => (
        <span className="font-medium max-w-[300px] truncate block">{c.nombre}</span>
      ),
    },
    {
      key: "entrenador",
      header: "Entrenador",
      render: (c: Curso) => c.entrenadorNombre,
    },
    {
      key: "fechas",
      header: "Fechas",
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
          ? "text-red-600" 
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
      render: (c: Curso) => <StatusBadge status={c.estado} />,
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
            createEditAction(() => navigate(`/cursos/${c.id}/editar`)),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cursos</h1>
          <p className="text-sm text-muted-foreground">Gestión de cursos y grupos de formación</p>
        </div>
        <Button onClick={() => navigate("/cursos/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

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
          <ColumnSelector columns={columnConfig} onChange={setColumnConfig} />
        </div>
        <SearchInput
          placeholder="Buscar por nombre o entrenador..."
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
