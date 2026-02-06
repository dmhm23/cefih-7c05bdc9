import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { usePersonas, useDeletePersona } from "@/hooks/usePersonas";
import { Persona } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { GENEROS, SECTORES_ECONOMICOS, NIVELES_EDUCATIVOS } from "@/data/formOptions";

export default function PersonasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    genero: "todos",
    sectorEconomico: [],
    nivelEducativo: "todos",
  });

  const { data: personas = [], isLoading } = usePersonas();
  const deletePersona = useDeletePersona();

  const filterConfigs: FilterConfig[] = [
    {
      key: "genero",
      label: "Género",
      type: "select",
      options: GENEROS.map((g) => ({ value: g.value, label: g.label })),
    },
    {
      key: "sectorEconomico",
      label: "Sector Económico",
      type: "multiselect",
      options: SECTORES_ECONOMICOS.map((s) => ({ value: s.value, label: s.label })),
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
    // Text search
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.numeroDocumento.includes(searchQuery) ||
      p.nombres.toLowerCase().includes(query) ||
      p.apellidos.toLowerCase().includes(query) ||
      (p.email?.toLowerCase().includes(query) ?? false);

    // Filter: Género
    const matchesGenero =
      filters.genero === "todos" || p.genero === filters.genero;

    // Filter: Sector Económico (multiselect)
    const sectorFilters = filters.sectorEconomico as string[];
    const matchesSector =
      sectorFilters.length === 0 || sectorFilters.includes(p.sectorEconomico);

    // Filter: Nivel Educativo
    const matchesNivel =
      filters.nivelEducativo === "todos" || p.nivelEducativo === filters.nivelEducativo;

    return matchesSearch && matchesGenero && matchesSector && matchesNivel;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePersona.mutateAsync(deleteId);
      toast({ title: "Persona eliminada correctamente" });
    } catch (error) {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      genero: "todos",
      sectorEconomico: [],
      nivelEducativo: "todos",
    });
  };

  const getSectorLabel = (value: string) => {
    const sector = SECTORES_ECONOMICOS.find((s) => s.value === value);
    return sector?.label || value;
  };

  const columns = [
    { key: "numeroDocumento", header: "Documento" },
    {
      key: "nombre",
      header: "Nombre Completo",
      render: (p: Persona) => (
        <span className="font-medium">{p.nombres} {p.apellidos}</span>
      ),
    },
    {
      key: "sector",
      header: "Sector",
      render: (p: Persona) => (
        <Badge variant="secondary" className="font-normal">
          {getSectorLabel(p.sectorEconomico)}
        </Badge>
      ),
    },
    { key: "telefono", header: "Teléfono" },
    {
      key: "actions",
      header: "",
      render: (p: Persona) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/personas/${p.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/personas/${p.id}/editar`);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(p.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Personas</h1>
          <p className="text-sm text-muted-foreground">Gestión de identidad - Hoja de Vida Digital</p>
        </div>
        <Button onClick={() => navigate("/personas/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Persona
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
        </div>
        <SearchInput
          placeholder="Buscar por cédula, nombre o email..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-80"
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredPersonas}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No se encontraron personas"
        onRowClick={(p) => navigate(`/personas/${p.id}`)}
        countLabel="personas"
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
    </div>
  );
}
