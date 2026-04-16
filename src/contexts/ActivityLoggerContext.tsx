import { createContext, useContext, useCallback, useEffect, useRef, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

interface LogActivityParams {
  action: string;
  module?: string;
  description: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityLoggerContextType {
  logActivity: (params: LogActivityParams) => void;
}

const noop = () => {};

const ActivityLoggerContext = createContext<ActivityLoggerContextType>({
  logActivity: noop,
});

export const useActivityLogger = () => useContext(ActivityLoggerContext);

export function ActivityLoggerProvider({ children }: { children: ReactNode }) {
  const { user, perfil } = useAuth();
  const location = useLocation();
  const prevPath = useRef<string>("");

  const logActivity = useCallback(
    (params: LogActivityParams) => {
      if (!user) return;
      const row = {
        user_id: user.id,
        user_email: user.email ?? "",
        user_name: perfil?.nombres ?? null,
        action: params.action,
        module: params.module ?? null,
        description: params.description,
        metadata: (params.metadata ?? {}) as Json,
      supabase.from("user_activity_logs").insert([row]).then(() => {});
    },
    [user, perfil, location.pathname],
  );

  // Auto-log navigation
  useEffect(() => {
    const path = location.pathname;
    if (path === prevPath.current) return;
    prevPath.current = path;
    if (!user) return;

    const moduleMap: Record<string, string> = {
      dashboard: "dashboard",
      personas: "personas",
      empresas: "empresas",
      matriculas: "matriculas",
      cursos: "cursos",
      niveles: "niveles",
      "gestion-personal": "personal",
      "gestion-formatos": "formatos",
      "portal-estudiante": "portal_estudiante",
      certificacion: "certificacion",
      cartera: "cartera",
      admin: "admin",
    };

    const segment = path.split("/").filter(Boolean)[0] ?? "dashboard";
    const mod = moduleMap[segment] ?? segment;

    const row = {
      user_id: user.id,
      user_email: user.email ?? "",
      user_name: perfil?.nombres ?? null,
      action: "navegar",
      module: mod,
      description: `Navegó a ${path}`,
      entity_type: null,
      entity_id: null,
      metadata: {},
      route: path,
    };
    supabase.from("user_activity_logs").insert([row]).then(() => {});
  }, [location.pathname, user, perfil]);

  return (
    <ActivityLoggerContext.Provider value={{ logActivity }}>
      {children}
    </ActivityLoggerContext.Provider>
  );
}
