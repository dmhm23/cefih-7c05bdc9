import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Database, Plus, Calendar, Upload, ShieldAlert } from "lucide-react";
import { useBackups } from "@/hooks/useBackups";
import { BackupsTable } from "@/components/admin/backups/BackupsTable";
import { CrearBackupDialog } from "@/components/admin/backups/CrearBackupDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const BackupsPage = () => {
  const { perfil } = useAuth();
  const { backups, isLoading, crear, isCreating, eliminar, descargar } = useBackups();
  const [crearOpen, setCrearOpen] = useState(false);

  // Solo superadmin
  if (perfil && perfil.rol_nombre !== "superadministrador") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-7 w-7" />
            Backups del sistema
          </h1>
          <p className="text-muted-foreground mt-1">
            Respaldos completos de la base de datos y archivos. Solo superadministradores.
          </p>
        </div>
        <Button onClick={() => setCrearOpen(true)} disabled={isCreating}>
          <Plus className="h-4 w-4 mr-2" />
          Crear backup ahora
        </Button>
      </div>

      <Tabs defaultValue="listado" className="space-y-6">
        <TabsList>
          <TabsTrigger value="listado" className="gap-2">
            <Database className="h-4 w-4" />
            Listado
          </TabsTrigger>
          <TabsTrigger value="programaciones" className="gap-2">
            <Calendar className="h-4 w-4" />
            Programaciones
          </TabsTrigger>
          <TabsTrigger value="importar" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar / Restaurar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listado" className="space-y-4">
          <BackupsTable
            backups={backups}
            isLoading={isLoading}
            onDownload={descargar}
            onDelete={eliminar}
          />
        </TabsContent>

        <TabsContent value="programaciones">
          <Card className="p-8 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-foreground mb-1">Programaciones automáticas</p>
            <p className="text-sm">
              Próximamente: define respaldos recurrentes (diarios, semanales) con retención
              configurable. Esta sección se habilita en la siguiente fase del sistema de backups.
            </p>
          </Card>
        </TabsContent>

        <TabsContent value="importar">
          <Card className="p-8 text-center text-muted-foreground">
            <ShieldAlert className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium text-foreground mb-1">Restauración desde backup</p>
            <p className="text-sm max-w-lg mx-auto">
              Próximamente: sube un archivo .zip de backup y restaura en modo "Reemplazar"
              (wipe + restore) o "Enriquecer" (solo agrega datos faltantes). Incluye validación
              de esquema y confirmación textual obligatoria.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <CrearBackupDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        onConfirm={(alcance) => {
          crear(alcance);
          setCrearOpen(false);
        }}
        isCreating={isCreating}
      />
    </div>
  );
};

export default BackupsPage;
