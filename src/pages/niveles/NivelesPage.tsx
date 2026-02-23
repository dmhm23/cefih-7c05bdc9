import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ColumnSelector, ColumnConfig } from "@/components/shared/ColumnSelector";
import { RowActions, createViewAction, createEditAction, createDeleteAction } from "@/components/shared/RowActions";
import { useNivelesFormacion, useDeleteNivelFormacion } from "@/hooks/useNivelesFormacion";
import { NivelFormacion } from "@/types/nivelFormacion";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const STORAGE_KEY = "niveles_visible_columns";

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "nombreNivel", header: "Nombre del Nivel", visible: true },
  { key: "duracion", header: "Duración", visible: true },
  { key: "documentos", header: "Documentos", visible: true },
  { key: "updatedAt", header: "Actualización", visible: true },
  { key: "actions", header: "", visible: true, alwaysVisible: true },
];

export default function NivelesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_COLUMNS;
    const parsed: ColumnConfig[] = JSON.parse(saved);
    return DEFAULT_COLUMNS.map(def => {
      const existing = parsed.find(c => c.key === def.key);
      return existing ? { ...def, visible: existing.visible } : def;
    });
  });

  const { data: niveles = [], isLoading } = useNivelesFormacion();
  const deleteNivel = useDeleteNivelFormacion();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const filteredNiveles = niveles.filter((n) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return n.nombreNivel.toLowerCase().includes(q);
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteNivel.mutateAsync(deleteId);
      toast({ title: "Nivel eliminado correctamente" });
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const columns: Column<NivelFormacion>[] = [
    {
      key: "nombreNivel",
      header: "Nombre del Nivel",
      sortable: true,
      className: "min-w-[180px]",
      render: (n) => <span className="font-medium">{n.nombreNivel}</span>,
    },
    {
      key: "duracion",
      header: "Duración",
      render: (n) => {
        if (!n.duracionDias && !n.duracionHoras) return <span className="text-muted-foreground">—</span>;
        const parts: string[] = [];
        if (n.duracionDias) parts.push(`${n.duracionDias} día${n.duracionDias > 1 ? 's' : ''}`);
        if (n.duracionHoras) parts.push(`${n.duracionHoras} h`);
        return parts.join(' / ');
      },
    },
    {
      key: "documentos",
      header: "Documentos",
      render: (n) => (
        <Badge variant="secondary">
          {n.documentosRequeridos.length} documento{n.documentosRequeridos.length !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      header: "Actualización",
      sortable: true,
      render: (n) => format(new Date(n.updatedAt), "dd/MM/yyyy"),
    },
    {
      key: "actions",
      header: "",
      className: "w-[100px]",
      render: (n) => (
        <RowActions
          showOnHover
          actions={[
            createViewAction(() => navigate(`/niveles/${n.id}`)),
            createEditAction(() => navigate(`/niveles/${n.id}/editar`)),
            createDeleteAction(() => setDeleteId(n.id)),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Niveles de Formación</h1>
          <p className="text-sm text-muted-foreground">Gestión de niveles y requisitos documentales</p>
        </div>
        <Button onClick={() => navigate("/niveles/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Nivel
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
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
        data={filteredNiveles}
        columns={columns}
        columnConfig={columnConfig}
        isLoading={isLoading}
        emptyMessage="No se encontraron niveles de formación"
        onRowClick={(n) => navigate(`/niveles/${n.id}`)}
        countLabel="niveles"
        defaultSortKey="updatedAt"
        defaultSortDirection="desc"
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="¿Eliminar nivel de formación?"
        description="Esta acción no se puede deshacer. Se eliminará el nivel y su configuración documental."
        confirmText="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
