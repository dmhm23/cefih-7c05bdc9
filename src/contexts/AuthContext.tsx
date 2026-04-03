import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface Perfil {
  id: string;
  email: string;
  nombres: string | null;
  rol_id: string;
  rol_nombre?: string;
}

export interface PermisoItem {
  modulo: string;
  accion: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  permisos: PermisoItem[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  perfil: null,
  permisos: [],
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [permisos, setPermisos] = useState<PermisoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerfilAndPermisos = async (userId: string) => {
    // Fetch perfil with rol name
    const { data: perfilData, error: perfilError } = await supabase
      .from("perfiles")
      .select("id, email, nombres, rol_id, roles!inner(nombre)")
      .eq("id", userId)
      .single();

    if (!perfilError && perfilData) {
      const rolNombre = (perfilData as any)?.roles?.nombre || "";
      setPerfil({
        id: perfilData.id,
        email: perfilData.email,
        nombres: perfilData.nombres,
        rol_id: perfilData.rol_id,
        rol_nombre: rolNombre,
      });

      // Fetch permissions via RPC
      const { data: permData } = await supabase.rpc("get_user_permissions", {
        p_user_id: userId,
      });
      if (permData) {
        setPermisos(permData as PermisoItem[]);
      }
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchPerfilAndPermisos(session.user.id), 0);
        } else {
          setPerfil(null);
          setPermisos([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfilAndPermisos(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setPerfil(null);
    setPermisos([]);
  };

  return (
    <AuthContext.Provider value={{ session, user, perfil, permisos, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
