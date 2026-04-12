import { Award, Search, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPopover, type FilterConfig } from "@/components/shared/FilterPopover";
import { useCertificados } from "@/hooks/useCertificados";
import { descargarCertificadoPdf } from "@/utils/certificadoPdf";
import { useState } from "react";
import type { EstadoCertificado } from "@/types/certificado";

const ESTADO_BADGE: Record<EstadoCertificado, string> = {
  elegible: "bg-emerald-100 text-emerald-700 border-emerald-200",
  generado: "bg-blue-100 text-blue-700 border-blue-200",
  bloqueado: "bg-red-100 text-red-700 border-red-200",
  revocado: "bg-gray-100 text-gray-700 border-gray-200",
};

const filterConfigs: FilterConfig[] = [
  {
    key: "estado",
    label: "Estado",
    type: "select",
    options: [
      { label: "Listo para certificar", value: "elegible" },
      { label: "Generado", value: "generado" },
      { label: "Bloqueado", value: "bloqueado" },
      { label: "Revocado", value: "revocado" },
    ],
  },
  {
    key: "excepcional",
    label: "Excepcional",
    type: "select",
    options: [
      { label: "Sí", value: "si" },
      { label: "No", value: "no" },
    ],
  },
];

export default function HistorialCertificadosPage() {
  const { data: certificados, isLoading } = useCertificados();
  const [busqueda, setBusqueda] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string | string[]>>({
    estado: "todos",
    excepcional: "todos",
  });

  const activeFilterCount = Object.values(filters).filter(v =>
    Array.isArray(v) ? v.length > 0 : v && v !== "todos"
  ).length;

  const filtered = (certificados ?? []).filter(c => {
    if (filters.estado !== "todos" && c.estado !== filters.estado) return false;
    if (filters.excepcional !== "todos") {
      const esExc = c.autorizadoExcepcional ? "si" : "no";
      if (esExc !== filters.excepcional) return false;
    }
    if (busqueda && !c.codigo.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Award className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historial de Certificados</h1>
          <p className="text-sm text-muted-foreground">Consulta y auditoría de certificados emitidos</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
        </div>
        <FilterPopover
          open={filterOpen}
          onOpenChange={setFilterOpen}
          filters={filterConfigs}
          values={filters}
          onChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
          onClear={() => setFilters({ estado: "todos", excepcional: "todos" })}
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Award className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Sin certificados</p>
          <p className="text-sm">Los certificados generados aparecerán aquí.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Versión</TableHead>
              <TableHead>Excepcional</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Motivo Revocación</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-medium">{c.codigo}</TableCell>
                <TableCell>
                  <Badge className={ESTADO_BADGE[c.estado]}>{c.estado}</Badge>
                </TableCell>
                <TableCell>v{c.version}</TableCell>
                <TableCell>
                  {c.autorizadoExcepcional ? (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Sí</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">No</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">{c.fechaGeneracion ? new Date(c.fechaGeneracion).toLocaleDateString("es-CO") : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {c.motivoRevocacion || "—"}
                </TableCell>
                <TableCell>
                  {c.svgFinal && (
                    <Button size="sm" variant="ghost" className="h-7" onClick={() => descargarCertificadoPdf(c.svgFinal, c.codigo)}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
