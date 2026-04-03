import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        toast({ title: "Error de autenticación", description: "Correo o contraseña inválidos", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Check admin role
      const { data: perfil, error: perfilError } = await supabase
        .from("perfiles")
        .select("rol_id, roles!inner(nombre)")
        .eq("id", data.user.id)
        .single();

      const rolNombre = (perfil as any)?.roles?.nombre;
      if (perfilError || rolNombre !== "superadministrador") {
        await supabase.auth.signOut();
        toast({ title: "Acceso denegado", description: "No tienes permisos de superadministrador para ingresar aquí.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      toast({ title: "¡Bienvenido, Administrador!", description: "Acceso al panel administrativo concedido" });
      navigate("/admin/dashboard");
    } catch {
      toast({ title: "Error", description: "Ocurrió un error inesperado", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4 shadow-lg shadow-primary/20">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            Acceso Administrativo
          </h1>
          <p className="text-muted-foreground mt-2">
            Panel de administración del sistema
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-xl shadow-black/5 border border-border/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="admin-email" className="text-sm font-medium text-foreground">
                Correo electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input id="admin-email" type="email" placeholder="admin@email.com" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-12 h-12 bg-muted/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200" />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input id="admin-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 bg-muted/50 border-border/50 focus:border-destructive focus:ring-2 focus:ring-destructive/20 transition-all duration-200" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit"
              className={cn("w-full h-12 text-base font-medium rounded-xl",
                "bg-destructive hover:bg-destructive/90",
                "shadow-lg shadow-destructive/25 hover:shadow-xl hover:shadow-destructive/30",
                "transition-all duration-300 hover:-translate-y-0.5", "group")}
              disabled={isLoading}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Acceder al Panel
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
