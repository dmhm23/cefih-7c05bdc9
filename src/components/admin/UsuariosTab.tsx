import { useState } from "react";
import { UserPlus, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/hooks/useRoles";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

export default function UsuariosTab() {
  const { toast } = useToast();
  const { rolesQuery, usuariosQuery, assignRole } = useRoles();
  const roles = rolesQuery.data || [];
  const usuarios = usuariosQuery.data || [];

  const [nombres, setNombres] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rolId, setRolId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Email y contraseña son obligatorios", variant: "destructive" });
      return;
    }
    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-crear-usuario", {
        body: { email, password, nombres, rol_id: rolId || undefined },
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      toast({ title: "¡Usuario creado!", description: `Se creó el usuario ${email}` });
      setNombres("");
      setEmail("");
      setPassword("");
      setRolId("");
      usuariosQuery.refetch();
    } catch {
      toast({ title: "Error", description: "Ocurrió un error inesperado", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleChangeRole = async (userId: string, newRolId: string) => {
    await assignRole.mutateAsync({ userId, rolId: newRolId });
  };

  return (
    <div className="space-y-8">
      {/* Create user form */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-5">
          <UserPlus className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Crear Usuario</h2>
        </div>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nombres</label>
            <Input placeholder="Juan Pérez" value={nombres} onChange={e => setNombres(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Correo Electrónico *</label>
            <Input type="email" placeholder="usuario@ejemplo.com" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Contraseña *</label>
            <Input type="password" placeholder="Mínimo 6 caracteres" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Rol</label>
            <Select value={rolId} onValueChange={setRolId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol (default: Administrador)" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isCreating}>
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Usuario
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Users list */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Usuarios del Sistema</h2>
          <Button variant="ghost" size="sm" onClick={() => usuariosQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Email</th>
                <th className="text-left p-3 font-medium">Nombres</th>
                <th className="text-left p-3 font-medium w-52">Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-border/50 hover:bg-muted/30">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.nombres || "—"}</td>
                  <td className="p-3">
                    <Select
                      value={u.rol_id}
                      onValueChange={(val) => handleChangeRole(u.id, val)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted-foreground">No hay usuarios registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
