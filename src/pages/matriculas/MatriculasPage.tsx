import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useMatriculas } from "@/hooks/useMatriculas";
import { usePersonas } from "@/hooks/usePersonas";
import { useCursos } from "@/hooks/useCursos";
import { Matricula, TIPO_FORMACION_LABELS } from "@/types";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MatriculasPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");

  const { data: matriculas = [], isLoading } = useMatriculas();
  const { data: personas = [] } = usePersonas();
  const { data: cursos = [] } = useCursos();

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

    const matchesEstado = estadoFilter === "todos" || m.estado === estadoFilter;

    return matchesSearch && matchesEstado;
  });

  const columns = [
    {
      key: "documento",
      header: "Documento",
      render: (m: Matricula) => getPersonaDocumento(m.personaId),
    },
    {
      key: "persona",
      header: "Estudiante",
      render: (m: Matricula) => getPersonaNombre(m.personaId),
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
      render: (m: Matricula) => TIPO_FORMACION_LABELS[m.tipoFormacion],
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
        <span className={m.pagado ? "text-emerald-600" : "text-amber-600"}>
          {m.pagado ? "✓ Pagado" : "Pendiente"}
        </span>
      ),
    },
    {
      key: "fecha",
      header: "Fecha",
      render: (m: Matricula) => format(new Date(m.createdAt), "dd/MM/yyyy"),
    },
    {
      key: "actions",
      header: "Acciones",
      render: (m: Matricula) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
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

  // Estadísticas rápidas
  const stats = {
    total: matriculas.length,
    pendientes: matriculas.filter((m) => m.estado === "pendiente" || m.estado === "creada").length,
    completas: matriculas.filter((m) => m.estado === "completa").length,
    sinPago: matriculas.filter((m) => !m.pagado).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Matrículas</h1>
          <p className="text-muted-foreground">Gestión de inscripciones y seguimiento</p>
        </div>
        <Button onClick={() => navigate("/matriculas/nueva")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Matrícula
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Matrículas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.pendientes}</div>
            <p className="text-sm text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{stats.completas}</div>
            <p className="text-sm text-muted-foreground">Completas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.sinPago}</div>
            <p className="text-sm text-muted-foreground">Sin Pago</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Matrículas</CardTitle>
            <div className="flex gap-4">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="creada">Creada</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="completa">Completa</SelectItem>
                  <SelectItem value="certificada">Certificada</SelectItem>
                  <SelectItem value="cerrada">Cerrada</SelectItem>
                </SelectContent>
              </Select>
              <SearchInput
                placeholder="Buscar por cédula o nombre..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredMatriculas}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No se encontraron matrículas"
            onRowClick={(m) => navigate(`/matriculas/${m.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
