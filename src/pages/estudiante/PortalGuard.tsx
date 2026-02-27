import { Navigate } from 'react-router-dom';
import { usePortalEstudianteSession } from '@/contexts/PortalEstudianteContext';

export default function PortalGuard({ children }: { children: React.ReactNode }) {
  const { session } = usePortalEstudianteSession();

  if (!session) {
    return <Navigate to="/estudiante" replace />;
  }

  return <>{children}</>;
}
