import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Perfil {
  id: string;
  email: string;
  nombres: string | null;
  rol: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  perfil: Perfil | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  perfil: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerfil = async (userId: string) => {
    const { data, error } = await supabase
      .from("perfiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) {
      setPerfil(data as Perfil);
    }
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchPerfil(session.user.id), 0);
        } else {
          setPerfil(null);
        }
        setLoading(false);
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchPerfil(session.user.id);
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
  };

  return (
    <AuthContext.Provider value={{ session, user, perfil, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
