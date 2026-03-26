import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Copy, Power, PowerOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { ColumnSelector, ColumnConfig } from "@/components/shared/ColumnSelector";
import { RowActions } from "@/components/shared/RowActions";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useFormatos, useToggleFormatoActivo, useDuplicateFormato, useArchiveFormato, useDeleteFormato } from "@/hooks/useFormatosFormacion";
import { FormatoFormacion, CategoriaFormato } from "@/types/formatoFormacion";
import { resolveNivelCursoLabel } from "@/utils/resolveNivelLabel";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { FileText, PenLine, CheckCircle2, XCircle, Archive, History, Layers, FileCode2 } from "lucide-react";

const CATEGORIA_LABELS: Record<string, string> = {
  formacion: 'Formación',
  evaluacion: 'Evaluación',
  asistencia: 'Asistencia',
  pta_ats: 'PTA / ATS',
  personalizado: 'Personalizado',
};

const STORAGE_KEY = "formatos_visible_columns";

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "nombre", header: "Nombre", visible: true },
  { key: "tipo", header: "Tipo", visible: true },
  { key: "categoria", header: "Categoría", visible: true },
  { key: "codigo", header: "Código", visible: true },
  { key: "scope", header: "Alcance", visible: true },
  { key: "firmas", header: "Firmas", visible: false },
  { key: "estado", header: "Estado", visible: true },
  { key: "updatedAt", header: "Actualización", visible: true },
  { key: "actions", header: "", visible: true, alwaysVisible: true },
];

function ScopeBadges({ formato }: { formato: FormatoFormacion }) {
  if (formato.asignacionScope === "tipo_curso") {
    return (
      <div className="flex flex-wrap gap-1">
        {formato.tipoCursoKeys.map((k) => (
          <Badge key={k} variant="outline" className="text-[10px] font-normal">
            {resolveNivelCursoLabel(k)}
          </Badge>
        ))}
      </div>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px]">
      {formato.nivelFormacionIds.length} nivel(es)
    </Badge>
  );
}

function FirmaIcons({ formato }: { formato: FormatoFormacion }) {
  const items: { label: string; active: boolean }[] = [
    { label: "Aprendiz", active: formato.requiereFirmaAprendiz },
    { label: "Entrenador", active: formato.requiereFirmaEntrenador },
    { label: "Supervisor", active: formato.requiereFirmaSupervisor },
  ];
  const active = items.filter((i) => i.active);
  if (active.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {active.map((i) => (
        <Badge key={i.label} variant="secondary" className="text-[10px] font-normal">
          {i.label}
        </Badge>
      ))}
    </div>
  );
}

export default function FormatosPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [toggleActivo, setToggleActivo] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const [columnConfig, setColumnConfig] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_COLUMNS;
    const parsed: ColumnConfig[] = JSON.parse(saved);
    return DEFAULT_COLUMNS.map((def) => {
      const existing = parsed.find((c) => c.key === def.key);
      return existing ? { ...def, visible: existing.visible } : def;
    });
  });

  const { data: formatos = [], isLoading } = useFormatos();
  const toggleActMutation = useToggleFormatoActivo();
  const duplicateMutation = useDuplicateFormato();
  const archiveMutation = useArchiveFormato();
  const deleteMutation = useDeleteFormato();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const filtered = formatos.filter((f) => {
    if (f.estado === 'archivado') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.nombre.toLowerCase().includes(q) || f.codigo.toLowerCase().includes(q) || f.descripcion.toLowerCase().includes(q);
  });

  const handleToggle = async () => {
    if (!toggleId) return;
    try {
      await toggleActMutation.mutateAsync(toggleId);
      toast({ title: toggleActivo ? "Formato desactivado" : "Formato activado" });
    } catch { toast({ title: "Error al cambiar estado", variant: "destructive" }); }
    setToggleId(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      const nuevo = await duplicateMutation.mutateAsync(id);
      toast({ title: "Formato duplicado", description: nuevo.nombre });
    } catch { toast({ title: "Error al duplicar", variant: "destructive" }); }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveMutation.mutateAsync(id);
      toast({ title: "Formato archivado" });
    } catch { toast({ title: "Error al archivar", variant: "destructive" }); }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await deleteMutation.mutateAsync(id);
      }
      toast({ title: `${selectedIds.length} formato(s) eliminado(s)` });
      setSelectedIds([]);
    } catch {
      toast({ title: "Error al eliminar formatos", variant: "destructive" });
    }
    setBulkDeleteConfirm(false);
  };

  const bulkActions = [
    {
      label: "Eliminar",
      icon: Trash2,
      variant: "destructive" as const,
      onClick: () => setBulkDeleteConfirm(true),
    },
  ];

  const columns: Column<FormatoFormacion>[] = [
    {
      key: "nombre", header: "Nombre", sortable: true, className: "min-w-[220px]",
      render: (f) => (
        <div className="flex items-center gap-2">
          {f.motorRender === 'plantilla_html' ? <FileCode2 className="h-4 w-4 text-muted-foreground shrink-0" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0" />}
          <div className="min-w-0">
            <p className="font-medium truncate">{f.nombre}</p>
            <p className="text-xs text-muted-foreground truncate">{f.descripcion}</p>
          </div>
        </div>
      ),
    },
    {
      key: "tipo", header: "Tipo", className: "w-[100px]",
      render: (f) => (
        <Badge variant="outline" className="text-[10px]">
          {f.motorRender === 'plantilla_html' ? 'Plantilla' : 'Bloques'}
        </Badge>
      ),
    },
    {
      key: "categoria", header: "Categoría", className: "w-[110px]",
      render: (f) => (
        <Badge variant="secondary" className="text-[10px]">
          {CATEGORIA_LABELS[f.categoria] || f.categoria}
        </Badge>
      ),
    },
    {
      key: "codigo", header: "Código", sortable: true, className: "w-[120px]",
      render: (f) => <span className="font-mono text-xs">{f.codigo} v{f.version}</span>,
    },
    {
      key: "scope", header: "Alcance", className: "min-w-[160px]",
      render: (f) => <ScopeBadges formato={f} />,
    },
    {
      key: "firmas", header: "Firmas", className: "min-w-[140px]",
      render: (f) => <FirmaIcons formato={f} />,
    },
    {
      key: "estado", header: "Estado", sortable: true, className: "w-[110px]",
      render: (f) => {
        if (f.estado === 'activo') return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"><CheckCircle2 className="h-3 w-3 mr-1" />Activo</Badge>;
        if (f.estado === 'borrador') return <Badge variant="outline" className="text-amber-600 border-amber-300">Borrador</Badge>;
        return <Badge variant="secondary" className="text-muted-foreground"><XCircle className="h-3 w-3 mr-1" />Archivado</Badge>;
      },
    },
    {
      key: "updatedAt", header: "Actualización", sortable: true, className: "w-[120px]",
      render: (f) => <span className="text-sm text-muted-foreground">{format(new Date(f.updatedAt), "dd/MM/yyyy")}</span>,
    },
    {
      key: "actions", header: "", className: "w-[120px]",
      render: (f) => (
        <RowActions showOnHover actions={[
          { label: "Editar", icon: PenLine, onClick: () => navigate(`/gestion-formatos/${f.id}/editar`) },
          { label: "Duplicar", icon: Copy, onClick: () => handleDuplicate(f.id) },
          { label: f.activo ? "Desactivar" : "Activar", icon: f.activo ? PowerOff : Power, onClick: () => { setToggleId(f.id); setToggleActivo(f.activo); }, variant: f.activo ? "destructive" : "default" },
          { label: "Archivar", icon: Archive, onClick: () => handleArchive(f.id), variant: "destructive" },
        ]} />
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de Formatos</h1>
          <p className="text-sm text-muted-foreground">
            Administra los formatos de formación y entrenamiento
          </p>
        </div>
        <Button onClick={() => navigate("/gestion-formatos/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Formato
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4 shrink-0 mt-4">
        <div className="flex items-center gap-2">
          <ColumnSelector
            columns={columnConfig}
            onChange={setColumnConfig}
            defaultColumns={DEFAULT_COLUMNS}
          />
        </div>
        <SearchInput
          placeholder="Buscar por nombre o código..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-80"
        />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        columnConfig={columnConfig}
        isLoading={isLoading}
        emptyMessage="No se encontraron formatos de formación"
        onRowClick={(f) => navigate(`/gestion-formatos/${f.id}/editar`)}
        countLabel="formatos"
        defaultSortKey="nombre"
        defaultSortDirection="asc"
        containerClassName="flex-1 min-h-0 mt-4"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={bulkActions}
      />

      <ConfirmDialog
        open={!!toggleId}
        onOpenChange={(open) => !open && setToggleId(null)}
        title={toggleActivo ? "¿Desactivar formato?" : "¿Activar formato?"}
        description={
          toggleActivo
            ? "El formato dejará de estar disponible en matrículas y cursos."
            : "El formato volverá a estar disponible según su configuración de alcance."
        }
        confirmText={toggleActivo ? "Desactivar" : "Activar"}
        variant={toggleActivo ? "destructive" : "default"}
        onConfirm={handleToggle}
      />
    </div>
  );
}
