import { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { ColumnSelector, ColumnConfig } from "@/components/shared/ColumnSelector";
import { RowActions, createViewAction, createEditAction, createDeleteAction } from "@/components/shared/RowActions";
import { BulkAction } from "@/components/shared/BulkActionsBar";
import { CopyableCell } from "@/components/shared/CopyableCell";
import { PersonaDetailSheet } from "@/components/personas/PersonaDetailSheet";
import { usePersonas, useDeletePersona } from "@/hooks/usePersonas";
import { Persona } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { GENEROS, NIVELES_EDUCATIVOS } from "@/data/formOptions";
import { format } from "date-fns";

const STORAGE_KEY = "personas_visible_columns";

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "numeroDocumento", header: "Documento", visible: true },
  { key: "nombre", header: "Nombre Completo", visible: true },
  { key: "telefono", header: "Teléfono", visible: true },
  { key: "email", header: "Email", visible: false },
  { key: "email", header: "Email", visible: false },
  { key: "genero", header: "Género", visible: false },
  { key: "nivelEducativo", header: "Nivel Educativo", visible: false },
  { key: "tipoDocumento", header: "Tipo Doc.", visible: false },
  { key: "fechaNacimiento", header: "Fecha Nac.", visible: false },
  { key: "paisNacimiento", header: "País Nacimiento", visible: false },
  { key: "rh", header: "RH", visible: false },
  { key: "contactoEmergencia", header: "Contacto Emergencia", visible: false },
  { key: "contactoEmergencia", header: "Contacto Emergencia", visible: false },
  { key: "actions", header: "", visible: true, alwaysVisible: true },
];

export default function PersonasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    genero: "todos",
    nivelEducativo: "todos",
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

  const { data: personas = [], isLoading } = usePersonas();
  const deletePersona = useDeletePersona();

  // Persist column config
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const filterConfigs: FilterConfig[] = [
    {
      key: "genero",
      label: "Género",
      type: "select",
      options: GENEROS.map((g) => ({ value: g.value, label: g.label })),
    },
    {
      key: "nivelEducativo",
      label: "Nivel Educativo",
      type: "select",
      options: NIVELES_EDUCATIVOS.map((n) => ({ value: n.value, label: n.label })),
    },
  ];

  const activeFilterCount = Object.entries(filters).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== "todos";
  }).length;

  const filteredPersonas = personas.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.numeroDocumento.includes(searchQuery) ||
      p.nombres.toLowerCase().includes(query) ||
      p.apellidos.toLowerCase().includes(query) ||
      `${p.nombres} ${p.apellidos}`.toLowerCase().includes(query) ||
      (p.telefono?.includes(searchQuery) ?? false) ||
      (p.email?.toLowerCase().includes(query) ?? false);

    const matchesGenero = filters.genero === "todos" || p.genero === filters.genero;
    const matchesNivel = filters.nivelEducativo === "todos" || p.nivelEducativo === filters.nivelEducativo;

    return matchesSearch && matchesGenero && matchesNivel;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePersona.mutateAsync(deleteId);
      toast({ title: "Persona eliminada correctamente" });
    } catch (err: any) {
      toast({ title: err?.message || "Error al eliminar", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await deletePersona.mutateAsync(id);
      }
      toast({ title: `${selectedIds.length} personas eliminadas` });
      setSelectedIds([]);
    } catch (err: any) {
      toast({ title: err?.message || "Error al eliminar", variant: "destructive" });
    }
    setBulkDeleteConfirm(false);
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      genero: "todos",
      nivelEducativo: "todos",
    });
  };

  const selectedPersona = selectedIndex !== null ? filteredPersonas[selectedIndex] : null;

  const handleNavigate = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    const newIndex =
      direction === "prev"
        ? Math.max(0, selectedIndex - 1)
        : Math.min(filteredPersonas.length - 1, selectedIndex + 1);
    setSelectedIndex(newIndex);
  };

  const handleRowClick = (persona: Persona) => {
    const index = filteredPersonas.findIndex((p) => p.id === persona.id);
    // SOLO abrir/actualizar el panel, NO seleccionar
    setSelectedIndex(index);
  };

  // Handler para "Ver" - cambia a solo ese registro
  const handleViewRow = (persona: Persona) => {
    const index = filteredPersonas.findIndex((p) => p.id === persona.id);
    // Cambiar selección a SOLO este registro
    setSelectedIds([persona.id]);
    // Actualizar panel
    setSelectedIndex(index);
  };

  const getGeneroLabel = (value: string) => {
    const genero = GENEROS.find((g) => g.value === value);
    return genero?.label || value;
  };

  const getNivelLabel = (value: string) => {
    const nivel = NIVELES_EDUCATIVOS.find((n) => n.value === value);
    return nivel?.label || value;
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

  const columns: Column<Persona>[] = [
    {
      key: "numeroDocumento",
      header: "Documento",
      sortable: true,
      render: (p: Persona) => <CopyableCell value={p.numeroDocumento} />,
    },
    {
      key: "nombre",
      header: "Nombre Completo",
      className: "min-w-[200px]",
      sortable: true,
      sortValue: (p: Persona) => `${p.nombres} ${p.apellidos}`.toLowerCase(),
      render: (p: Persona) => (
        <span className="font-medium">{p.nombres} {p.apellidos}</span>
      ),
    },
    { key: "telefono", header: "Teléfono" },
    { key: "email", header: "Email", className: "min-w-[200px]", sortable: true },
    {
      key: "genero",
      header: "Género",
      sortable: true,
      render: (p: Persona) => getGeneroLabel(p.genero),
    },
    {
      key: "nivelEducativo",
      header: "Nivel Educativo",
      sortable: true,
      render: (p: Persona) => getNivelLabel(p.nivelEducativo),
    },
    {
      key: "tipoDocumento",
      header: "Tipo Doc.",
      render: (p: Persona) => p.tipoDocumento,
    },
    {
      key: "fechaNacimiento",
      header: "Fecha Nac.",
      sortable: true,
      render: (p: Persona) =>
        p.fechaNacimiento
          ? format(new Date(p.fechaNacimiento), "dd/MM/yyyy")
          : "-",
    },
    { key: "paisNacimiento", header: "País Nacimiento" },
    { key: "rh", header: "RH" },
    {
      key: "contactoEmergencia",
      header: "Contacto Emergencia",
      className: "min-w-[200px]",
      render: (p: Persona) =>
        p.contactoEmergencia
          ? `${p.contactoEmergencia.nombre} (${p.contactoEmergencia.telefono})`
          : "-",
    },
    {
      key: "actions",
      header: "",
      className: "w-[100px]",
      render: (p: Persona) => (
        <RowActions
          showOnHover
          actions={[
            createViewAction(() => navigate(`/personas/${p.id}`)),
            createEditAction(() => navigate(`/personas/${p.id}/editar`)),
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
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-sm text-muted-foreground">Gestión de identidad - Hoja de Vida Digital</p>
        </div>
        <Button onClick={() => navigate("/personas/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Persona
        </Button>
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
          placeholder="Buscar por cédula, nombre, celular o email..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-80"
        />
      </div>


      <DataTable
        data={filteredPersonas}
        columns={columns}
        columnConfig={columnConfig}
        isLoading={isLoading}
        emptyMessage="No se encontraron personas"
        onRowClick={handleRowClick}
        countLabel="personas"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={bulkActions}
        isPanelOpen={selectedIndex !== null}
        activeRowId={selectedPersona?.id}
        onViewRow={handleViewRow}
        containerClassName="flex-1 min-h-0 mt-4"
      />

      {/* Detail Sheet */}
      <PersonaDetailSheet
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
        persona={selectedPersona}
        currentIndex={selectedIndex ?? 0}
        totalCount={filteredPersonas.length}
        onNavigate={handleNavigate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar persona?"
        description="Esta acción no se puede deshacer. Se eliminará la persona y todos sus datos asociados."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        title={`¿Eliminar ${selectedIds.length} personas?`}
        description="Esta acción no se puede deshacer. Se eliminarán las personas seleccionadas y todos sus datos asociados."
        confirmText="Eliminar todos"
        variant="destructive"
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
