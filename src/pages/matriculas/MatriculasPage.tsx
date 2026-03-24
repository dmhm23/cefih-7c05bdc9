import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { ColumnSelector, ColumnConfig } from "@/components/shared/ColumnSelector";
import { RowActions, createViewAction } from "@/components/shared/RowActions";
import { BulkAction } from "@/components/shared/BulkActionsBar";
import { CopyableCell } from "@/components/shared/CopyableCell";
import { MatriculaDetailSheet } from "@/components/matriculas/MatriculaDetailSheet";
import { useMatriculas } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { Matricula } from "@/types";
import { TipoDocumento, TIPO_VINCULACION_LABELS, NIVEL_FORMACION_EMPRESA_LABELS, NIVEL_PREVIO_LABELS, FORMA_PAGO_LABELS } from "@/types/matricula";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { mockGruposCartera } from "@/data/mockCartera";
import { ESTADO_GRUPO_CARTERA_LABELS, EstadoGrupoCartera } from "@/types/cartera";

const STORAGE_KEY = "matriculas_visible_columns";

const ESTADO_DOCUMENTAL_OPTIONS = [
  { value: "completo", label: "Completo" },
  { value: "pendiente", label: "Pendiente" },
];

const ESTADO_CARTERA_OPTIONS = Object.entries(ESTADO_GRUPO_CARTERA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: "fechaCreacion", header: "Fecha Creación", visible: true },
  { key: "empresa", header: "Empresa", visible: true },
  { key: "asistente", header: "Asistente", visible: true },
  { key: "fechaArl", header: "Fecha Cobertura ARL", visible: true },
  { key: "fechaExamen", header: "Fecha Examen", visible: true },
  { key: "estadoDocumental", header: "Estado Documental", visible: true },
  { key: "estadoCartera", header: "Estado de Cartera", visible: true },
  { key: "tipoVinculacion", header: "Vinculación", visible: false },
  { key: "nit", header: "NIT Empresa", visible: false },
  { key: "cargo", header: "Cargo", visible: false },
  { key: "nivelFormacion", header: "Nivel Formación", visible: false },
  { key: "eps", header: "EPS", visible: false },
  { key: "arl", header: "ARL", visible: false },
  { key: "valorCupo", header: "Valor Cupo", visible: false },
  { key: "abono", header: "Abono", visible: false },
  { key: "saldo", header: "Saldo", visible: false },
  { key: "formaPago", header: "Forma de Pago", visible: false },
  { key: "fechaPago", header: "Fecha Pago", visible: false },
  { key: "ctaFactNumero", header: "No. CTA-FACT", visible: false },
  { key: "nivelPrevio", header: "Nivel Previo", visible: false },
  { key: "actions", header: "", visible: true, alwaysVisible: true },
];

export default function MatriculasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    estadoDocumental: "todos",
    estadoCartera: "todos",
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

  const { data: matriculas = [], isLoading } = useMatriculas();
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();

  // Persist column config
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnConfig));
  }, [columnConfig]);

  const getDocumentoFecha = (matricula: Matricula, tipo: TipoDocumento, campo: 'fechaInicioCobertura' | 'fechaDocumento') => {
    const doc = matricula.documentos?.find((d) => d.tipo === tipo);
    if (!doc) return "-";
    const fecha = doc[campo];
    return fecha ? format(new Date(fecha), "dd/MM/yyyy") : "-";
  };

  const getEstadoDocumental = (matricula: Matricula): "Completo" | "Pendiente" => {
    const docsObligatorios = (matricula.documentos || []).filter((d) => !d.opcional);
    if (docsObligatorios.length === 0) return "Pendiente";
    return docsObligatorios.every((d) => d.estado === "cargado")
      ? "Completo"
      : "Pendiente";
  };

  const getEstadoCartera = (matricula: Matricula): EstadoGrupoCartera => {
    const grupo = mockGruposCartera.find((g) =>
      g.matriculaIds.includes(matricula.id)
    );
    return grupo?.estado ?? "sin_facturar";
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: "estadoDocumental",
      label: "Estado Documental",
      type: "select",
      options: ESTADO_DOCUMENTAL_OPTIONS,
    },
    {
      key: "estadoCartera",
      label: "Estado de Cartera",
      type: "select",
      options: ESTADO_CARTERA_OPTIONS,
    },
  ];

  const activeFilterCount = Object.entries(filters).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return value && value !== "todos";
  }).length;

  const getPersonaNombre = (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    return persona ? `${persona.nombres} ${persona.apellidos}` : "N/A";
  };

  const getPersonaDocumento = (personaId: string) => {
    const persona = personas.find((p) => p.id === personaId);
    return persona?.numeroDocumento || "N/A";
  };

  const getCursoNombre = (cursoId: string) => {
    const curso = cursos.find((c) => c.id === cursoId);
    return curso?.nombre || "N/A";
  };

  const filteredMatriculas = matriculas.filter((m) => {
    const persona = personas.find((p) => p.id === m.personaId);
    
    const matchesSearch =
      !searchQuery ||
      persona?.numeroDocumento.includes(searchQuery) ||
      persona?.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona?.apellidos.toLowerCase().includes(searchQuery.toLowerCase());

    const estadoDoc = getEstadoDocumental(m).toLowerCase();
    const matchesEstadoDoc = filters.estadoDocumental === "todos" || estadoDoc === filters.estadoDocumental;
    const matchesPago =
      filters.pago === "todos" ||
      (filters.pago === "pagado" && m.pagado) ||
      (filters.pago === "pendiente" && !m.pagado);

    return matchesSearch && matchesEstadoDoc && matchesPago;
  });

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      estadoDocumental: "todos",
      pago: "todos",
    });
  };

  const selectedMatricula = selectedIndex !== null ? filteredMatriculas[selectedIndex] : null;

  const handleNavigate = (direction: "prev" | "next") => {
    if (selectedIndex === null) return;
    const newIndex =
      direction === "prev"
        ? Math.max(0, selectedIndex - 1)
        : Math.min(filteredMatriculas.length - 1, selectedIndex + 1);
    setSelectedIndex(newIndex);
  };

  const handleRowClick = (matricula: Matricula) => {
    const index = filteredMatriculas.findIndex((m) => m.id === matricula.id);
    // SOLO abrir/actualizar el panel, NO seleccionar
    setSelectedIndex(index);
  };

  // Handler para "Ver" - cambia a solo ese registro
  const handleViewRow = (matricula: Matricula) => {
    const index = filteredMatriculas.findIndex((m) => m.id === matricula.id);
    // Cambiar selección a SOLO este registro
    setSelectedIds([matricula.id]);
    // Actualizar panel
    setSelectedIndex(index);
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Eliminar",
      icon: Trash2,
      variant: "destructive",
      onClick: (ids) => {
        toast({ title: `Eliminar ${ids.length} matrículas (pendiente)` });
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

  const columns: Column<Matricula>[] = [
    {
      key: "fechaCreacion",
      header: "Fecha Creación",
      sortable: true,
      sortKey: "createdAt",
      sortValue: (m: Matricula) => m.createdAt,
      render: (m: Matricula) => format(new Date(m.createdAt), "dd/MM/yyyy"),
    },
    {
      key: "empresa",
      header: "Empresa",
      className: "min-w-[180px]",
      sortable: true,
      sortValue: (m: Matricula) => m.tipoVinculacion === "empresa" && m.empresaNombre ? m.empresaNombre : "Independiente",
      render: (m: Matricula) => (
        <span>
          {m.tipoVinculacion === "empresa" && m.empresaNombre ? m.empresaNombre : "Independiente"}
        </span>
      ),
    },
    {
      key: "asistente",
      header: "Asistente",
      className: "min-w-[180px]",
      sortable: true,
      sortValue: (m: Matricula) => getPersonaNombre(m.personaId).toLowerCase(),
      render: (m: Matricula) => (
        <span className="font-medium">{getPersonaNombre(m.personaId)}</span>
      ),
    },
    {
      key: "fechaArl",
      header: "Fecha Cobertura ARL",
      className: "min-w-[140px]",
      sortable: true,
      sortValue: (m: Matricula) => {
        const doc = m.documentos?.find((d) => d.tipo === "arl");
        return doc?.fechaInicioCobertura || "";
      },
      render: (m: Matricula) => getDocumentoFecha(m, "arl", "fechaInicioCobertura"),
    },
    {
      key: "fechaExamen",
      header: "Fecha Examen",
      className: "min-w-[120px]",
      sortable: true,
      sortValue: (m: Matricula) => {
        const doc = m.documentos?.find((d) => d.tipo === "examen_medico");
        return doc?.fechaDocumento || "";
      },
      render: (m: Matricula) => getDocumentoFecha(m, "examen_medico", "fechaDocumento"),
    },
    {
      key: "estadoDocumental",
      header: "Estado Documental",
      sortable: true,
      sortValue: (m: Matricula) => getEstadoDocumental(m),
      render: (m: Matricula) => {
        const estado = getEstadoDocumental(m);
        return (
          <Badge
            variant={estado === "Completo" ? "default" : "secondary"}
            className={estado === "Completo" ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-600"}
          >
            {estado}
          </Badge>
        );
      },
    },
    {
      key: "estadoFinanciero",
      header: "Estado Financiero",
      sortable: true,
      sortValue: (m: Matricula) => m.pagado ? "Pagado" : "Pendiente",
      render: (m: Matricula) => (
        <Badge
          variant={m.pagado ? "default" : "secondary"}
          className={m.pagado ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-600"}
        >
          {m.pagado ? "Pagado" : "Pendiente"}
        </Badge>
      ),
    },
    {
      key: "tipoVinculacion",
      header: "Vinculación",
      render: (m: Matricula) =>
        m.tipoVinculacion ? TIPO_VINCULACION_LABELS[m.tipoVinculacion] : "-",
    },
    {
      key: "nit",
      header: "NIT Empresa",
      render: (m: Matricula) => m.empresaNit || "-",
    },
    {
      key: "cargo",
      header: "Cargo",
      render: (m: Matricula) => m.empresaCargo || "-",
    },
    {
      key: "nivelFormacion",
      header: "Nivel Formación",
      render: (m: Matricula) =>
        m.empresaNivelFormacion
          ? NIVEL_FORMACION_EMPRESA_LABELS[m.empresaNivelFormacion]
          : "-",
    },
    {
      key: "eps",
      header: "EPS",
      className: "min-w-[140px]",
      render: (m: Matricula) => m.epsOtra || m.eps || "-",
    },
    {
      key: "arl",
      header: "ARL",
      className: "min-w-[140px]",
      render: (m: Matricula) => m.arlOtra || m.arl || "-",
    },
    {
      key: "valorCupo",
      header: "Valor Cupo",
      render: (m: Matricula) =>
        m.valorCupo != null
          ? `$${m.valorCupo.toLocaleString("es-CO")}`
          : "-",
    },
    {
      key: "abono",
      header: "Abono",
      render: (m: Matricula) =>
        m.abono != null ? `$${m.abono.toLocaleString("es-CO")}` : "-",
    },
    {
      key: "saldo",
      header: "Saldo",
      render: (m: Matricula) => {
        if (m.valorCupo == null) return "-";
        const saldo = (m.valorCupo ?? 0) - (m.abono ?? 0);
        return `$${saldo.toLocaleString("es-CO")}`;
      },
    },
    {
      key: "formaPago",
      header: "Forma de Pago",
      render: (m: Matricula) =>
        m.formaPago ? FORMA_PAGO_LABELS[m.formaPago] : "-",
    },
    {
      key: "fechaPago",
      header: "Fecha Pago",
      render: (m: Matricula) =>
        m.fechaPago ? format(new Date(m.fechaPago), "dd/MM/yyyy") : "-",
    },
    {
      key: "ctaFactNumero",
      header: "No. CTA-FACT",
      render: (m: Matricula) => m.ctaFactNumero || "-",
    },
    {
      key: "nivelPrevio",
      header: "Nivel Previo",
      render: (m: Matricula) =>
        m.nivelPrevio ? NIVEL_PREVIO_LABELS[m.nivelPrevio] : "-",
    },
    {
      key: "actions",
      header: "",
      className: "w-[80px]",
      render: (m: Matricula) => (
        <RowActions
          showOnHover
          actions={[
            createViewAction(() => navigate(`/matriculas/${m.id}`)),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold">Matrículas</h1>
          <p className="text-sm text-muted-foreground">Gestión de inscripciones y seguimiento</p>
        </div>
        <Button onClick={() => navigate("/matriculas/nueva")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Matrícula
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
          placeholder="Buscar por cédula o nombre..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-72"
        />
      </div>


      <DataTable
        data={filteredMatriculas}
        columns={columns}
        columnConfig={columnConfig}
        isLoading={isLoading}
        emptyMessage="No se encontraron matrículas"
        onRowClick={handleRowClick}
        countLabel="matrículas"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={bulkActions}
        isPanelOpen={selectedIndex !== null}
        activeRowId={selectedMatricula?.id}
        onViewRow={handleViewRow}
        containerClassName="flex-1 min-h-0 mt-4"
      />

      {/* Detail Sheet */}
      <MatriculaDetailSheet
        open={selectedIndex !== null}
        onOpenChange={(open) => !open && setSelectedIndex(null)}
        matricula={selectedMatricula}
        currentIndex={selectedIndex ?? 0}
        totalCount={filteredMatriculas.length}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
