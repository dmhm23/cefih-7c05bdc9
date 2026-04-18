import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useActivityLogger } from "@/contexts/ActivityLoggerContext";
import { Plus, Trash2, Download, Filter, MoreVertical, FileDown, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { ColumnSelector, ColumnConfig } from "@/components/shared/ColumnSelector";
import { RowActions, createViewAction, createEditAction, createDeleteAction } from "@/components/shared/RowActions";
import { BulkAction } from "@/components/shared/BulkActionsBar";
import { CopyableCell } from "@/components/shared/CopyableCell";
import { EmpresaDetailSheet } from "@/components/empresas/EmpresaDetailSheet";
import { ImportarEmpresasDialog } from "@/components/empresas/ImportarEmpresasDialog";
import { useEmpresasPaginated, useDeleteEmpresa } from "@/hooks/useEmpresas";
import { descargarPlantillaEmpresas } from "@/utils/empresaPlantilla";
import { useMatriculas } from "@/hooks/useMatriculas";
import { Empresa } from "@/types/empresa";
import { useToast } from "@/hooks/use-toast";
import { SECTORES_ECONOMICOS, ARL_OPTIONS } from "@/data/formOptions";
import { StatusBadge } from "@/components/shared/StatusBadge";

const STORAGE_KEY = "empresas_visible_columns";

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "nombreEmpresa", header: "Nombre", visible: true },
  { key: "nit", header: "NIT", visible: true },
  { key: "sectorEconomico", header: "Sector", visible: true },
  { key: "arl", header: "ARL", visible: true },
  { key: "personaContacto", header: "Persona Contacto", visible: true },
  { key: "telefonoContacto", header: "Teléfono Contacto", visible: true },
  { key: "emailContacto", header: "Email", visible: true },
  { key: "estudiantesEnviados", header: "Estudiantes", visible: true },
  { key: "representanteLegal", header: "Representante Legal", visible: false },
  { key: "direccion", header: "Dirección", visible: false },
  { key: "telefonoEmpresa", header: "Teléfono Empresa", visible: false },
  
  { key: "actions", header: "", visible: true, alwaysVisible: true },
];

export default function EmpresasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    sectorEconomico: "todos",
    arl: "todos",
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

  const { data: empresas = [], isLoading } = useEmpresas();
  const { data: matriculas = [] } = useMatriculas();
  const deleteEmpresa = useDeleteEmpresa();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const filterConfigs: FilterConfig[] = [
    {
      key: "sectorEconomico",
      label: "Sector Económico",
      type: "select",
      options: SECTORES_ECONOMICOS.map(s => ({ value: s.value, label: s.label })),
    },
    {
      key: "arl",
      label: "ARL",
      type: "select",
      options: ARL_OPTIONS.map(a => ({ value: a.value, label: a.label })),
    },
  ];

  const activeFilterCount = Object.entries(filters).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== "todos";
  }).length;

  const getSectorLabel = (value: string) =>
    SECTORES_ECONOMICOS.find(s => s.value === value)?.label || value;

  const getArlLabel = (value: string) =>
    ARL_OPTIONS.find(a => a.value === value)?.label || value;

  const getEstudiantesCount = (empresa: Empresa) => {
    return matriculas.filter(m => m.empresaId === empresa.id || m.empresaNit === empresa.nit).length;
  };

  const filteredEmpresas = empresas.filter((e) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      e.nombreEmpresa.toLowerCase().includes(query) ||
      e.nit.includes(searchQuery) ||
      e.personaContacto.toLowerCase().includes(query) ||
      e.emailContacto.toLowerCase().includes(query);

    const matchesSector = filters.sectorEconomico === "todos" || e.sectorEconomico === filters.sectorEconomico;
    const matchesArl = filters.arl === "todos" || e.arl === filters.arl;

    return matchesSearch && matchesSector && matchesArl;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    const emp = empresas.find(e => e.id === deleteId);
    try {
      await deleteEmpresa.mutateAsync(deleteId);
      toast({ title: "Empresa eliminada correctamente" });
      logActivity({ action: "eliminar", module: "empresas", description: `Eliminó empresa ${emp?.nombreEmpresa || ""} (NIT: ${emp?.nit || ""})`, entityType: "empresa", entityId: deleteId, metadata: { nombre: emp?.nombreEmpresa, nit: emp?.nit } });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    try {
      const nombres = selectedIds.map(id => empresas.find(e => e.id === id)?.nombreEmpresa).filter(Boolean);
      for (const id of selectedIds) {
        await deleteEmpresa.mutateAsync(id);
      }
      toast({ title: `${selectedIds.length} empresas eliminadas` });
      logActivity({ action: "eliminar", module: "empresas", description: `Eliminó ${selectedIds.length} empresas en lote`, metadata: { cantidad: selectedIds.length, nombres } });
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
    setFilters({ sectorEconomico: "todos", arl: "todos" });
  };

  const selectedEmpresa = selectedIndex !== null ? filteredEmpresas[selectedIndex] : null;

  const handleNavigate = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    const newIndex =
      direction === "prev"
        ? Math.max(0, selectedIndex - 1)
        : Math.min(filteredEmpresas.length - 1, selectedIndex + 1);
    setSelectedIndex(newIndex);
  };

  const handleRowClick = (empresa: Empresa) => {
    const index = filteredEmpresas.findIndex(e => e.id === empresa.id);
    setSelectedIndex(index);
  };

  const handleViewRow = (empresa: Empresa) => {
    const index = filteredEmpresas.findIndex(e => e.id === empresa.id);
    setSelectedIds([empresa.id]);
    setSelectedIndex(index);
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Eliminar",
      icon: Trash2,
      variant: "destructive",
      onClick: () => setBulkDeleteConfirm(true),
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

  const columns: Column<Empresa>[] = [
    {
      key: "nombreEmpresa",
      header: "Nombre",
      className: "min-w-[200px]",
      sortable: true,
      render: (e) => <span className="font-medium">{e.nombreEmpresa}</span>,
    },
    {
      key: "nit",
      header: "NIT",
      sortable: true,
      render: (e) => <CopyableCell value={e.nit} />,
    },
    {
      key: "sectorEconomico",
      header: "Sector",
      sortable: true,
      render: (e) => getSectorLabel(e.sectorEconomico),
    },
    {
      key: "arl",
      header: "ARL",
      sortable: true,
      render: (e) => getArlLabel(e.arl),
    },
    {
      key: "personaContacto",
      header: "Persona Contacto",
      sortable: true,
      render: (e) => {
        const principal = e.contactos?.find(c => c.esPrincipal) || e.contactos?.[0];
        const nombre = principal?.nombre || e.personaContacto;
        const extras = (e.contactos?.length || 1) - 1;
        return (
          <div className="flex items-center gap-1.5">
            <span>{nombre}</span>
            {extras > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">+{extras}</Badge>
            )}
          </div>
        );
      },
    },
    { key: "telefonoContacto", header: "Teléfono Contacto" },
    {
      key: "emailContacto",
      header: "Email",
      className: "min-w-[200px]",
      sortable: true,
    },
    { key: "representanteLegal", header: "Representante Legal" },
    {
      key: "estudiantesEnviados",
      header: "Estudiantes",
      sortable: true,
      render: (e) => {
        const count = getEstudiantesCount(e);
        return (
          <Badge variant={count > 0 ? "default" : "secondary"}>
            {count}
          </Badge>
        );
      },
    },
    { key: "direccion", header: "Dirección", className: "min-w-[200px]" },
    { key: "telefonoEmpresa", header: "Teléfono Empresa" },
    {
      key: "actions",
      header: "",
      className: "w-[100px]",
      render: (e) => (
        <RowActions
          showOnHover
          actions={[
            createViewAction(() => navigate(`/empresas/${e.id}`)),
            createEditAction(() => navigate(`/empresas/${e.id}/editar`)),
            createDeleteAction(() => setDeleteId(e.id)),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold">Empresas</h1>
          <p className="text-sm text-muted-foreground">Directorio de empresas vinculadas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/empresas/nueva")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Empresa
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => descargarPlantillaEmpresas()}>
                <FileDown className="h-4 w-4 mr-2" />
                Descargar plantilla
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setImportOpen(true)}>
                <FileUp className="h-4 w-4 mr-2" />
                Importar empresas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 shrink-0 mt-4">
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
          placeholder="Buscar por nombre, NIT, contacto o email..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-80"
        />
      </div>

      <DataTable
        data={filteredEmpresas}
        columns={columns}
        columnConfig={columnConfig}
        isLoading={isLoading}
        emptyMessage="No se encontraron empresas"
        onRowClick={handleRowClick}
        countLabel="empresas"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={bulkActions}
        isPanelOpen={selectedIndex !== null}
        activeRowId={selectedEmpresa?.id}
        onViewRow={handleViewRow}
        containerClassName="flex-1 min-h-0 mt-4"
      />

      <EmpresaDetailSheet
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
        empresa={selectedEmpresa}
        currentIndex={selectedIndex ?? 0}
        totalCount={filteredEmpresas.length}
        onNavigate={handleNavigate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar empresa?"
        description="Esta acción no se puede deshacer. Se eliminará la empresa del directorio."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title={`¿Eliminar ${selectedIds.length} empresas?`}
        description="Esta acción no se puede deshacer."
        confirmText="Eliminar todos"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />

      <ImportarEmpresasDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
