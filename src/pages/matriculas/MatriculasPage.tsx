import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { useMatriculas } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { Matricula, TIPO_FORMACION_LABELS } from "@/types";
import { format } from "date-fns";

const ESTADO_OPTIONS = [
  { value: "creada", label: "Creada" },
  { value: "pendiente", label: "Pendiente" },
  { value: "completa", label: "Completa" },
  { value: "certificada", label: "Certificada" },
  { value: "cerrada", label: "Cerrada" },
];

const TIPO_FORMACION_OPTIONS = [
  { value: "inicial", label: "Formación Inicial" },
  { value: "periodica", label: "Formación Periódica" },
  { value: "actualizacion", label: "Actualización" },
];

const PAGO_OPTIONS = [
  { value: "pagado", label: "Pagado" },
  { value: "pendiente", label: "Pendiente" },
];

export default function MatriculasPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    estado: "todos",
    tipoFormacion: "todos",
    pago: "todos",
  });

  const { data: matriculas = [], isLoading } = useMatriculas();
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();

  const filterConfigs: FilterConfig[] = [
    {
      key: "estado",
      label: "Estado",
      type: "select",
      options: ESTADO_OPTIONS,
    },
    {
      key: "tipoFormacion",
      label: "Tipo de Formación",
      type: "select",
      options: TIPO_FORMACION_OPTIONS,
    },
    {
      key: "pago",
      label: "Estado de Pago",
      type: "select",
      options: PAGO_OPTIONS,
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
    
    // Text search
    const matchesSearch =
      !searchQuery ||
      persona?.numeroDocumento.includes(searchQuery) ||
      persona?.nombres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      persona?.apellidos.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter: Estado
    const matchesEstado =
      filters.estado === "todos" || m.estado === filters.estado;

    // Filter: Tipo Formación
    const matchesTipo =
      filters.tipoFormacion === "todos" || m.tipoFormacion === filters.tipoFormacion;

    // Filter: Pago
    const matchesPago =
      filters.pago === "todos" ||
      (filters.pago === "pagado" && m.pagado) ||
      (filters.pago === "pendiente" && !m.pagado);

    return matchesSearch && matchesEstado && matchesTipo && matchesPago;
  });

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      estado: "todos",
      tipoFormacion: "todos",
      pago: "todos",
    });
  };

  const columns = [
    {
      key: "documento",
      header: "Documento",
      render: (m: Matricula) => getPersonaDocumento(m.personaId),
    },
    {
      key: "persona",
      header: "Estudiante",
      render: (m: Matricula) => (
        <span className="font-medium">{getPersonaNombre(m.personaId)}</span>
      ),
    },
    {
      key: "curso",
      header: "Curso",
      render: (m: Matricula) => (
        <span className="max-w-[200px] truncate block">
          {getCursoNombre(m.cursoId)}
        </span>
      ),
    },
    {
      key: "tipoFormacion",
      header: "Tipo",
      render: (m: Matricula) => (
        <Badge variant="outline" className="font-normal">
          {TIPO_FORMACION_LABELS[m.tipoFormacion]}
        </Badge>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (m: Matricula) => <StatusBadge status={m.estado} />,
    },
    {
      key: "pago",
      header: "Pago",
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
      key: "fecha",
      header: "Fecha",
      render: (m: Matricula) => format(new Date(m.createdAt), "dd/MM/yyyy"),
    },
    {
      key: "actions",
      header: "",
      render: (m: Matricula) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/matriculas/${m.id}`);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Matrículas</h1>
          <p className="text-sm text-muted-foreground">Gestión de inscripciones y seguimiento</p>
        </div>
        <Button onClick={() => navigate("/matriculas/nueva")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Matrícula
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
          placeholder="Buscar por cédula o nombre..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="w-72"
        />
      </div>

      {/* Table */}
      <DataTable
        data={filteredMatriculas}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No se encontraron matrículas"
        onRowClick={(m) => navigate(`/matriculas/${m.id}`)}
        countLabel="matrículas"
      />
    </div>
  );
}
