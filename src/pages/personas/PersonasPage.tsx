import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/DataTable";
import { SearchInput } from "@/components/shared/SearchInput";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { usePersonas, useDeletePersona } from "@/hooks/usePersonas";
import { Persona } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function PersonasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: personas = [], isLoading } = usePersonas();
  const deletePersona = useDeletePersona();

  const filteredPersonas = personas.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.numeroDocumento.includes(searchQuery) ||
      p.nombres.toLowerCase().includes(query) ||
      p.apellidos.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query)
    );
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

  const columns = [
    { key: "numeroDocumento", header: "Documento" },
    {
      key: "nombre",
      header: "Nombre Completo",
      render: (p: Persona) => `${p.nombres} ${p.apellidos}`,
    },
    { key: "email", header: "Email" },
    { key: "telefono", header: "Teléfono" },
    { key: "eps", header: "EPS" },
    {
      key: "actions",
      header: "Acciones",
      render: (p: Persona) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personas</h1>
          <p className="text-muted-foreground">Gestión de identidad - Hoja de Vida Digital</p>
        </div>
        <Button onClick={() => navigate("/personas/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Persona
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Listado de Personas</CardTitle>
            <SearchInput
              placeholder="Buscar por cédula, nombre o email..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="w-80"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredPersonas}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No se encontraron personas"
            onRowClick={(p) => navigate(`/personas/${p.id}`)}
          />
        </CardContent>
      </Card>

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
