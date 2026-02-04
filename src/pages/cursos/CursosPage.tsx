import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCursos } from "@/hooks/useCursos";
import { Curso, ESTADO_CURSO_LABELS } from "@/types";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CursosPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("todos");

  const { data: cursos = [], isLoading } = useCursos();

  const filteredCursos = cursos.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.entrenadorNombre.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEstado = estadoFilter === "todos" || c.estado === estadoFilter;

    return matchesSearch && matchesEstado;
  });

  const columns = [
    {
      key: "nombre",
      header: "Nombre del Curso",
      render: (c: Curso) => (
        <span className="font-medium max-w-[300px] truncate block">{c.nombre}</span>
      ),
    },
    {
      key: "entrenador",
      header: "Entrenador",
      render: (c: Curso) => c.entrenadorNombre,
    },
    {
      key: "fechas",
      header: "Fechas",
      render: (c: Curso) => (
        <div className="text-sm">
          <p>{format(new Date(c.fechaInicio), "dd/MM/yyyy")}</p>
          <p className="text-muted-foreground">al {format(new Date(c.fechaFin), "dd/MM/yyyy")}</p>
        </div>
      ),
    },
    {
      key: "duracion",
      header: "Duración",
      render: (c: Curso) => `${c.duracionDias} días (${c.horasTotales}h)`,
    },
    {
      key: "capacidad",
      header: "Inscritos",
      render: (c: Curso) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{c.matriculasIds.length} / {c.capacidadMaxima}</span>
        </div>
      ),
    },
    {
      key: "estado",
      header: "Estado",
      render: (c: Curso) => <StatusBadge status={c.estado} />,
    },
    {
      key: "actions",
      header: "Acciones",
      render: (c: Curso) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/cursos/${c.id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  // Stats
  const stats = {
    total: cursos.length,
    abiertos: cursos.filter((c) => c.estado === "abierto").length,
    enProgreso: cursos.filter((c) => c.estado === "en_progreso").length,
    cerrados: cursos.filter((c) => c.estado === "cerrado").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cursos</h1>
          <p className="text-muted-foreground">Gestión de cursos y grupos de formación</p>
        </div>
        <Button onClick={() => navigate("/cursos/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Cursos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{stats.abiertos}</div>
            <p className="text-sm text-muted-foreground">Abiertos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.enProgreso}</div>
            <p className="text-sm text-muted-foreground">En Progreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.cerrados}</div>
            <p className="text-sm text-muted-foreground">Cerrados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Cursos</CardTitle>
            <div className="flex gap-4">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="abierto">Abierto</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
              <SearchInput
                placeholder="Buscar por nombre o entrenador..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredCursos}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No se encontraron cursos"
            onRowClick={(c) => navigate(`/cursos/${c.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
