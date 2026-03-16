import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Download, Filter, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { ColumnSelector, ColumnConfig } from "@/components/shared/ColumnSelector";
import { RowActions, createViewAction, createEditAction, createDeleteAction } from "@/components/shared/RowActions";
import { BulkAction } from "@/components/shared/BulkActionsBar";
import { PersonalDetailSheet } from "@/components/personal/PersonalDetailSheet";
import { GestionCargosModal } from "@/components/personal/GestionCargosModal";
import { usePersonalList, useDeletePersonal, useCargos } from "@/hooks/usePersonal";
import { Personal } from "@/types/personal";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "personal_visible_columns";

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "nombre", header: "Nombre Completo", visible: true },
  { key: "cargo", header: "Cargo", visible: true },
  { key: "actions", header: "", visible: true, alwaysVisible: true },
];

export default function GestionPersonalPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [cargosModalOpen, setCargosModalOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    cargo: "todos",
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

  const { data: personal = [], isLoading } = usePersonalList();
  const { data: cargos = [] } = useCargos();
  const deletePersonal = useDeletePersonal();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const filterConfigs: FilterConfig[] = [
    {
      key: "cargo",
      label: "Cargo",
      type: "select",
      options: cargos.map(c => ({ value: c.id, label: c.nombre })),
    },
  ];

  const activeFilterCount = Object.entries(filters).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== "todos";
  }).length;

  const filteredPersonal = personal.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.nombres.toLowerCase().includes(query) ||
      p.apellidos.toLowerCase().includes(query);

    const matchesCargo = filters.cargo === "todos" || p.cargoId === filters.cargo;

    return matchesSearch && matchesCargo;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePersonal.mutateAsync(deleteId);
      toast({ title: "Perfil eliminado correctamente" });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await deletePersonal.mutateAsync(id);
      }
      toast({ title: `${selectedIds.length} perfiles eliminados` });
      setSelectedIds([]);
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
    setBulkDeleteConfirm(false);
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ cargo: "todos" });
  };

  const selectedPersonal = selectedIndex !== null ? filteredPersonal[selectedIndex] : null;

  const handleNavigate = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    const newIndex =
      direction === "prev"
        ? Math.max(0, selectedIndex - 1)
        : Math.min(filteredPersonal.length - 1, selectedIndex + 1);
    setSelectedIndex(newIndex);
  };

  const handleRowClick = (p: Personal) => {
    const index = filteredPersonal.findIndex(x => x.id === p.id);
    setSelectedIndex(index);
  };

  const handleViewRow = (p: Personal) => {
    const index = filteredPersonal.findIndex(x => x.id === p.id);
    setSelectedIds([p.id]);
    setSelectedIndex(index);
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Eliminar",
      icon: Trash2,
      variant: "destructive",
      onClick: () => setBulkDeleteConfirm(true),
    },
  ];

  const columns: Column<Personal>[] = [
    {
      key: "nombre",
      header: "Nombre Completo",
      className: "min-w-[200px]",
      sortable: true,
      sortValue: (p: Personal) => `${p.nombres} ${p.apellidos}`.toLowerCase(),
      render: (p: Personal) => (
        <span className="font-medium">{p.nombres} {p.apellidos}</span>
      ),
    },
    {
      key: "cargo",
      header: "Cargo",
      sortable: true,
      sortKey: "cargoNombre",
      render: (p: Personal) => (
        <Badge variant="secondary" className="font-normal">
          {p.cargoNombre}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[100px]",
      render: (p: Personal) => (
        <RowActions
          showOnHover
          actions={[
            createViewAction(() => navigate(`/gestion-personal/${p.id}`)),
            createEditAction(() => navigate(`/gestion-personal/${p.id}/editar`)),
            createDeleteAction(() => setDeleteId(p.id)),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Personal</h1>
          <p className="text-sm text-muted-foreground">Perfiles del equipo de trabajo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCargosModalOpen(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Gestionar Cargos
          </Button>
          <Button onClick={() => navigate("/gestion-personal/nuevo")}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Perfil
          </Button>
        </div>
      </div>

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
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-80"
        />
      </div>

      <DataTable
        data={filteredPersonal}
        columns={columns}
        columnConfig={columnConfig}
        isLoading={isLoading}
        emptyMessage="No se encontró personal"
        onRowClick={handleRowClick}
        countLabel="perfiles"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={bulkActions}
        isPanelOpen={selectedIndex !== null}
        activeRowId={selectedPersonal?.id}
        onViewRow={handleViewRow}
      />

      <PersonalDetailSheet
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
        personal={selectedPersonal}
        currentIndex={selectedIndex ?? 0}
        totalCount={filteredPersonal.length}
        onNavigate={handleNavigate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar perfil?"
        description="Esta acción no se puede deshacer. Se eliminará el perfil del personal."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title={`¿Eliminar ${selectedIds.length} perfiles?`}
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar todos"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />

      <GestionCargosModal
        open={cargosModalOpen}
        onOpenChange={setCargosModalOpen}
      />
    </div>
  );
}
