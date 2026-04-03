import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, UserPlus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, perfil } = useAuth();
  const [nombres, setNombres] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin");
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Error", description: "Email y contraseña son obligatorios", variant: "destructive" });
      return;
    }
    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke("admin-crear-usuario", {
        body: { email, password, nombres },
      });

      if (error) {
        toast({ title: "Error", description: error.message || "No se pudo crear el usuario", variant: "destructive" });
        setIsCreating(false);
        return;
      }

      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        setIsCreating(false);
        return;
      }

      toast({ title: "¡Usuario creado!", description: `Se creó el usuario ${email} con rol global` });
      setNombres("");
      setEmail("");
      setPassword("");
    } catch {
      toast({ title: "Error", description: "Ocurrió un error inesperado", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-destructive" />
            <h1 className="text-xl font-semibold text-foreground">Panel de Administración</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{perfil?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Crear Usuario Global</h2>
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
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Usuario Global
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
