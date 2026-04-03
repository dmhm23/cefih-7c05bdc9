import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";

interface AuthGuardProps {
  children: React.ReactNode;
  modulo?: string;
}

const AuthGuard = ({ children, modulo }: AuthGuardProps) => {
  const { session, loading } = useAuth();
  const canView = usePermission(modulo || "dashboard", "ver");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  // If a specific module is required, check permission
  if (modulo && !canView) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
