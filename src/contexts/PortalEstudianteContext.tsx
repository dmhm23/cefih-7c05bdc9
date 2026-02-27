import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface PortalSession {
  matriculaId: string;
  personaId: string;
  cedula: string;
  nombreEstudiante: string;
  cursoNombre: string;
  cursoFechaInicio?: string;
  cursoFechaFin?: string;
}

interface PortalEstudianteContextType {
  session: PortalSession | null;
  setSession: (session: PortalSession) => void;
  clearSession: () => void;
}

const STORAGE_KEY = 'portal_estudiante_session';

const PortalEstudianteContext = createContext<PortalEstudianteContextType | undefined>(undefined);

export function PortalEstudianteProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<PortalSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSession = useCallback((newSession: PortalSession) => {
    setSessionState(newSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <PortalEstudianteContext.Provider value={{ session, setSession, clearSession }}>
      {children}
    </PortalEstudianteContext.Provider>
  );
}

export function usePortalEstudianteSession() {
  const context = useContext(PortalEstudianteContext);
  if (!context) {
    throw new Error('usePortalEstudianteSession must be used within PortalEstudianteProvider');
  }
  return context;
}
