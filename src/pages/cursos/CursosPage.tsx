import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CursosListView from "@/components/cursos/CursosListView";
import CursosCalendarioView from "@/components/cursos/CursosCalendarioView";

export default function CursosPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cursos</h1>
          <p className="text-sm text-muted-foreground">Gestión de cursos y grupos de formación</p>
        </div>
        <Button onClick={() => navigate("/cursos/nuevo")}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      <Tabs defaultValue="listado" className="space-y-4">
        <TabsList>
          <TabsTrigger value="listado" className="gap-2">
            <List className="h-4 w-4" />
            Todos los cursos
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado">
          <CursosListView />
        </TabsContent>

        <TabsContent value="calendario">
          <CursosCalendarioView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
