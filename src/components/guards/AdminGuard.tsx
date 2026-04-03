import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { session, perfil, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin" replace />;
  }

  if (perfil && perfil.rol_nombre !== "superadministrador") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

export default AdminGuard;
