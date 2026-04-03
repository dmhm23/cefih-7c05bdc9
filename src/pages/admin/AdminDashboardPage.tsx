import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, KeyRound } from "lucide-react";
import RolesTab from "@/components/admin/RolesTab";
import UsuariosTab from "@/components/admin/UsuariosTab";

const AdminDashboardPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Administración</h1>
        <p className="text-muted-foreground mt-1">Gestión de usuarios, roles y permisos del sistema</p>
      </div>

      <Tabs defaultValue="usuarios" className="space-y-6">
        <TabsList>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <KeyRound className="w-4 h-4" />
            Roles y Permisos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <UsuariosTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;
