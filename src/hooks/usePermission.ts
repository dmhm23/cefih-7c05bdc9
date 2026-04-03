import { useAuth } from "@/contexts/AuthContext";

export const usePermission = (modulo: string, accion: string): boolean => {
  const { permisos, perfil } = useAuth();
  
  // Superadministrador has all permissions
  if (perfil?.rol_nombre === "superadministrador") return true;
  
  return permisos.some((p) => p.modulo === modulo && p.accion === accion);
};

export const useModuleAccess = (modulo: string) => {
  const { permisos, perfil } = useAuth();
  
  if (perfil?.rol_nombre === "superadministrador") {
    return { ver: true, crear: true, editar: true, eliminar: true };
  }
  
  return {
    ver: permisos.some((p) => p.modulo === modulo && p.accion === "ver"),
    crear: permisos.some((p) => p.modulo === modulo && p.accion === "crear"),
    editar: permisos.some((p) => p.modulo === modulo && p.accion === "editar"),
    eliminar: permisos.some((p) => p.modulo === modulo && p.accion === "eliminar"),
  };
};
