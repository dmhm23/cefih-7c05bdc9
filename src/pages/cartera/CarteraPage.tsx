import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Filter, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/shared/SearchInput";
import { FilterPopover, FilterConfig } from "@/components/shared/FilterPopover";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { DataTable, Column } from "@/components/shared/DataTable";
import { useGruposCartera, useResponsablesPago } from "@/hooks/useCartera";
import { GrupoCartera, ResponsablePago, TIPO_RESPONSABLE_LABELS } from "@/types/cartera";

const TIPO_OPTIONS = [
  { value: "empresa", label: "Empresa" },
  { value: "independiente", label: "Independiente" },
  { value: "arl", label: "ARL" },
];

const ESTADO_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "facturado", label: "Facturado" },
  { value: "abonado", label: "Abonado" },
  { value: "pagado", label: "Pagado" },
  { value: "vencido", label: "Vencido" },
];

const filterConfigs: FilterConfig[] = [
  { key: "tipo", label: "Tipo Responsable", type: "select", options: TIPO_OPTIONS },
  { key: "estado", label: "Estado", type: "select", options: ESTADO_OPTIONS },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(v);

type GrupoRow = GrupoCartera & { responsable?: ResponsablePago };

export default function CarteraPage() {
  const navigate = useNavigate();
  const { data: grupos = [], isLoading: loadingGrupos } = useGruposCartera();
  const { data: responsables = [], isLoading: loadingResp } = useResponsablesPago();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({ tipo: "todos", estado: "todos" });

  const rows: GrupoRow[] = useMemo(() => {
    return grupos.map(g => ({
      ...g,
      responsable: responsables.find(r => r.id === g.responsablePagoId),
    }));
  }, [grupos, responsables]);

  const filtered = useMemo(() => {
    let result = rows;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.responsable?.nombre.toLowerCase().includes(q) ||
        r.responsable?.nit.toLowerCase().includes(q)
      );
    }

    if (filters.tipo && filters.tipo !== "todos") {
      result = result.filter(r => r.responsable?.tipo === filters.tipo);
    }

    if (filters.estado && filters.estado !== "todos") {
      result = result.filter(r => r.estado === filters.estado);
    }

    return result;
  }, [rows, search, filters]);

  const activeFilterCount = Object.values(filters).filter(
    v => (Array.isArray(v) ? v.length > 0 : v && v !== "todos")
  ).length;

  const columns: Column<GrupoRow>[] = [
    {
      key: "responsable",
      header: "Responsable de Pago",
      render: (row) => (
        <div>
          <div className="font-medium">{row.responsable?.nombre || "—"}</div>
          <div className="text-xs text-muted-foreground">{row.responsable?.nit}</div>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (row) => {
        const tipo = row.responsable?.tipo;
        if (!tipo) return "—";
        const variant = tipo === "empresa" ? "default" : tipo === "arl" ? "secondary" : "outline";
        return <Badge variant={variant}>{TIPO_RESPONSABLE_LABELS[tipo]}</Badge>;
      },
    },
    {
      key: "matriculas",
      header: "Matrículas",
      render: (row) => <span className="font-medium">{row.matriculaIds.length}</span>,
    },
    {
      key: "totalValor",
      header: "Valor Total",
      render: (row) => <span className="font-medium">{formatCurrency(row.totalValor)}</span>,
    },
    {
      key: "abonado",
      header: "Abonado",
      render: (row) => <span className="text-emerald-600">{formatCurrency(row.totalAbonos)}</span>,
    },
    {
      key: "saldo",
      header: "Saldo",
      render: (row) => (
        <span className={row.saldo > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>
          {formatCurrency(row.saldo)}
        </span>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (row) => (
        <span className="flex items-center gap-1.5">
          {row.estado === "vencido" && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
          <StatusBadge status={row.estado} />
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Cartera</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de cobros, facturación y pagos
            </p>
          </div>
        </div>
      </div>


      <div className="flex items-center gap-3 shrink-0 mt-4">
        <SearchInput
          placeholder="Buscar por nombre o NIT..."
          value={search}
          onChange={setSearch}
          className="max-w-sm"
        />
        <FilterPopover
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={filterConfigs}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onClear={() => setFilters({ tipo: "todos", estado: "todos" })}
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          }
        />
      </div>

      {/* Table */}
      <DataTable
        data={filtered}
        columns={columns}
        isLoading={loadingGrupos || loadingResp}
        onRowClick={(row) => navigate(`/cartera/${row.id}`)}
        emptyMessage="No se encontraron grupos de cartera."
      />
    </div>
  );
}
