import { useState } from "react";
import { UserPlus, RefreshCw, Eye, EyeOff, Pencil, KeyRound, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/hooks/useRoles";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export default function UsuariosTab() {
  const { toast } = useToast();
  const { perfil } = useAuth();
  const { rolesQuery, usuariosQuery, assignRole, updateUser, resetPassword, deleteUser } = useRoles();
  const roles = rolesQuery.data || [];
  const usuarios = usuariosQuery.data || [];

  const callerRoleName = perfil?.rol_nombre || "";

  // Create user form state
  const [nombres, setNombres] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rolId, setRolId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit dialog state
  const [editUser, setEditUser] = useState<{ id: string; nombres: string } | null>(null);
  const [editNombres, setEditNombres] = useState("");

  // Reset password dialog state
  const [resetResult, setResetResult] = useState<{ email: string; tempPassword: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);

  // Role hierarchy helpers
  const ROLE_HIERARCHY: Record<string, number> = {
    superadministrador: 100,
    administrador: 50,
  };

  function getRoleLevel(roleName: string): number {
    return ROLE_HIERARCHY[roleName] ?? 0;
  }

  function canManageUser(targetRoleName: string, targetId: string): boolean {
    if (targetId === perfil?.id) return false;
    const callerLevel = getRoleLevel(callerRoleName);
    const targetLevel = getRoleLevel(targetRoleName);
    return callerLevel > targetLevel;
  }

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

  const handleEditSave = async () => {
    if (!editUser) return;
    await updateUser.mutateAsync({ userId: editUser.id, nombres: editNombres });
    setEditUser(null);
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    const result = await resetPassword.mutateAsync(userId);
    if (result?.tempPassword) {
      setResetResult({ email: userEmail, tempPassword: result.tempPassword });
      setCopied(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteUser.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleCopyPassword = async () => {
    if (!resetResult) return;
    await navigator.clipboard.writeText(resetResult.tempPassword);
    setCopied(true);
    toast({ title: "Contraseña copiada al portapapeles" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Create user form */}
      <div className="bg-card border border-border rounded-lg p-6 max-w-lg">
        <h2 className="text-base font-semibold text-foreground mb-4">Crear Usuario</h2>

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
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password}
                onChange={e => setPassword(e.target.value)} required className="pr-10" />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Rol</label>
            <Select value={rolId} onValueChange={setRolId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol (default: Operador)" />
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Usuarios del Sistema</h2>
          <Button variant="ghost" size="sm" onClick={() => usuariosQuery.refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="text-left p-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombres</th>
                <th className="text-left p-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-52">Rol</th>
                <th className="text-right p-3 text-xs font-medium uppercase tracking-wider text-muted-foreground w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const canManage = canManageUser(u.rol_nombre, u.id);
                return (
                  <tr key={u.id} className="border-t border-border/50 bg-card hover:bg-muted/30">
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">{u.nombres || "—"}</td>
                    <td className="p-3">
                      <Select
                        value={u.rol_id}
                        onValueChange={(val) => handleChangeRole(u.id, val)}
                        disabled={!canManage}
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
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        {canManage && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Editar nombres"
                              onClick={() => {
                                setEditUser({ id: u.id, nombres: u.nombres || "" });
                                setEditNombres(u.nombres || "");
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Reiniciar contraseña"
                              onClick={() => handleResetPassword(u.id, u.email)}
                            >
                              <KeyRound className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Eliminar usuario"
                              onClick={() => setDeleteTarget({ id: u.id, email: u.email })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">No hay usuarios registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Modifique los nombres del usuario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nombres</label>
              <Input value={editNombres} onChange={(e) => setEditNombres(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleEditSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Result Dialog */}
      <Dialog open={!!resetResult} onOpenChange={(open) => !open && setResetResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contraseña Temporal Generada</DialogTitle>
            <DialogDescription>
              Se ha generado una nueva contraseña temporal para <strong>{resetResult?.email}</strong>. Copie y compártala de forma segura.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
              <code className="flex-1 text-sm font-mono break-all select-all">
                {resetResult?.tempPassword}
              </code>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyPassword}>
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              El usuario deberá cambiar esta contraseña en su próximo inicio de sesión.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetResult(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar Usuario"
        description={`¿Está seguro que desea eliminar al usuario "${deleteTarget?.email}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
