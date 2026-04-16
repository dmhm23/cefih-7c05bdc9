import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { preloadNiveles } from "@/utils/resolveNivelLabel";

// Preload niveles cache for sync label resolution
preloadNiveles();
import AuthGuard from "@/components/guards/AuthGuard";
import AdminGuard from "@/components/guards/AdminGuard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Layout
import { MainLayout } from "./components/layout/MainLayout";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Personas (Módulo A)
import PersonasPage from "./pages/personas/PersonasPage";
import PersonaDetallePage from "./pages/personas/PersonaDetallePage";
import PersonaFormPage from "./pages/personas/PersonaFormPage";

// Matrículas (Módulo B)
import MatriculasPage from "./pages/matriculas/MatriculasPage";
import MatriculaDetallePage from "./pages/matriculas/MatriculaDetallePage";
import MatriculaFormPage from "./pages/matriculas/MatriculaFormPage";

// Cursos (Módulo C)
import CursosPage from "./pages/cursos/CursosPage";
import CursoDetallePage from "./pages/cursos/CursoDetallePage";
import CursoFormPage from "./pages/cursos/CursoFormPage";

// Niveles de Formación (Módulo D)
import NivelesPage from "./pages/niveles/NivelesPage";
import NivelDetallePage from "./pages/niveles/NivelDetallePage";
import NivelFormPage from "./pages/niveles/NivelFormPage";

// Gestión de Personal (Módulo E)
import GestionPersonalPage from "./pages/personal/GestionPersonalPage";
import PersonalFormPage from "./pages/personal/PersonalFormPage";
import PersonalDetallePage from "./pages/personal/PersonalDetallePage";

// Gestión de Formatos (Módulo F)
import FormatosPage from "./pages/formatos/FormatosPage";
import FormatoEditorPage from "./pages/formatos/FormatoEditorPage";

// Portal Admin (Módulo G)
import PortalAdminPage from "./pages/portal-admin/PortalAdminPage";

// Certificación (Módulo H)
import HistorialCertificadosPage from "./pages/certificacion/HistorialCertificadosPage";
import PlantillasPage from "./pages/certificacion/PlantillasPage";
import PlantillaEditorPage from "./pages/certificacion/PlantillaEditorPage";

// Cartera (Módulo I)
import CarteraPage from "./pages/cartera/CarteraPage";
import GrupoCarteraDetallePage from "./pages/cartera/GrupoCarteraDetallePage";

// Empresas (Módulo J)
import EmpresasPage from "./pages/empresas/EmpresasPage";
import EmpresaFormPage from "./pages/empresas/EmpresaFormPage";
import EmpresaDetallePage from "./pages/empresas/EmpresaDetallePage";

// Admin
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminLogsPage from "./pages/admin/AdminLogsPage";
import UserActivityLogPage from "./pages/admin/UserActivityLogPage";
import BackupsPage from "./pages/admin/BackupsPage";

// Portal Estudiante (público)
import AccesoEstudiantePage from "./pages/estudiante/AccesoEstudiantePage";
import PanelDocumentosPage from "./pages/estudiante/PanelDocumentosPage";
import DocumentoRendererPage from "./pages/estudiante/DocumentoRendererPage";
import PortalGuard from "./pages/estudiante/PortalGuard";
import { PortalEstudianteProvider } from "./contexts/PortalEstudianteContext";
import { ActivityLoggerProvider } from "./contexts/ActivityLoggerContext";

const queryClient = new QueryClient();

// Wrapper component for pages that need the main layout + auth
const WithLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthGuard>
    <ActivityLoggerProvider>
      <MainLayout>{children}</MainLayout>
    </ActivityLoggerProvider>
  </AuthGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/admin/dashboard" element={<AdminGuard><ActivityLoggerProvider><MainLayout><AdminDashboardPage /></MainLayout></ActivityLoggerProvider></AdminGuard>} />
            <Route path="/admin/logs" element={<AdminGuard><ActivityLoggerProvider><MainLayout><AdminLogsPage /></MainLayout></ActivityLoggerProvider></AdminGuard>} />
            <Route path="/admin/logs/:userId" element={<AdminGuard><ActivityLoggerProvider><MainLayout><UserActivityLogPage /></MainLayout></ActivityLoggerProvider></AdminGuard>} />
            <Route path="/admin/backups" element={<AdminGuard><ActivityLoggerProvider><MainLayout><BackupsPage /></MainLayout></ActivityLoggerProvider></AdminGuard>} />

            {/* Protected routes with layout */}
            <Route path="/dashboard" element={<WithLayout><Dashboard /></WithLayout>} />
            
            {/* Módulo A - Personas */}
            <Route path="/personas" element={<WithLayout><PersonasPage /></WithLayout>} />
            <Route path="/personas/nuevo" element={<WithLayout><PersonaFormPage /></WithLayout>} />
            <Route path="/personas/:id" element={<WithLayout><PersonaDetallePage /></WithLayout>} />
            <Route path="/personas/:id/editar" element={<WithLayout><PersonaFormPage /></WithLayout>} />

            {/* Módulo J - Empresas */}
            <Route path="/empresas" element={<WithLayout><EmpresasPage /></WithLayout>} />
            <Route path="/empresas/nueva" element={<WithLayout><EmpresaFormPage /></WithLayout>} />
            <Route path="/empresas/:id" element={<WithLayout><EmpresaDetallePage /></WithLayout>} />
            <Route path="/empresas/:id/editar" element={<WithLayout><EmpresaFormPage /></WithLayout>} />
            
            {/* Módulo B - Matrículas */}
            <Route path="/matriculas" element={<WithLayout><MatriculasPage /></WithLayout>} />
            <Route path="/matriculas/nueva" element={<WithLayout><MatriculaFormPage /></WithLayout>} />
            <Route path="/matriculas/:id" element={<WithLayout><MatriculaDetallePage /></WithLayout>} />

            {/* Módulo I - Cartera */}
            <Route path="/cartera" element={<WithLayout><CarteraPage /></WithLayout>} />
            <Route path="/cartera/:id" element={<WithLayout><GrupoCarteraDetallePage /></WithLayout>} />
            
            {/* Módulo C - Cursos */}
            <Route path="/cursos" element={<WithLayout><CursosPage /></WithLayout>} />
            <Route path="/cursos/nuevo" element={<WithLayout><CursoFormPage /></WithLayout>} />
            <Route path="/cursos/:id" element={<WithLayout><CursoDetallePage /></WithLayout>} />

            {/* Módulo D - Niveles de Formación */}
            <Route path="/niveles" element={<WithLayout><NivelesPage /></WithLayout>} />
            <Route path="/niveles/nuevo" element={<WithLayout><NivelFormPage /></WithLayout>} />
            <Route path="/niveles/:id" element={<WithLayout><NivelDetallePage /></WithLayout>} />
            <Route path="/niveles/:id/editar" element={<WithLayout><NivelFormPage /></WithLayout>} />

            {/* Módulo E - Gestión de Personal */}
            <Route path="/gestion-personal" element={<WithLayout><GestionPersonalPage /></WithLayout>} />
            <Route path="/gestion-personal/nuevo" element={<WithLayout><PersonalFormPage /></WithLayout>} />
            <Route path="/gestion-personal/:id" element={<WithLayout><PersonalDetallePage /></WithLayout>} />
            <Route path="/gestion-personal/:id/editar" element={<WithLayout><PersonalFormPage /></WithLayout>} />

            {/* Módulo F - Gestión de Formatos */}
            <Route path="/gestion-formatos" element={<WithLayout><FormatosPage /></WithLayout>} />
            <Route path="/gestion-formatos/nuevo" element={<AuthGuard><FormatoEditorPage /></AuthGuard>} />
            <Route path="/gestion-formatos/:id/editar" element={<AuthGuard><FormatoEditorPage /></AuthGuard>} />

            {/* Módulo G - Portal Estudiante Admin */}
            <Route path="/portal-estudiante" element={<WithLayout><PortalAdminPage /></WithLayout>} />

            {/* Módulo H - Certificación */}
            <Route path="/certificacion/historial" element={<WithLayout><HistorialCertificadosPage /></WithLayout>} />
            <Route path="/certificacion/plantillas" element={<WithLayout><PlantillasPage /></WithLayout>} />
            <Route path="/certificacion/plantillas/:id/editar" element={<AuthGuard><PlantillaEditorPage /></AuthGuard>} />

            {/* Portal Estudiante (público, mobile-first) */}
            <Route path="/estudiante" element={<PortalEstudianteProvider><AccesoEstudiantePage /></PortalEstudianteProvider>} />
            <Route path="/estudiante/inicio" element={<PortalEstudianteProvider><PortalGuard><PanelDocumentosPage /></PortalGuard></PortalEstudianteProvider>} />
            <Route path="/estudiante/documentos/:documentoKey" element={<PortalEstudianteProvider><PortalGuard><DocumentoRendererPage /></PortalGuard></PortalEstudianteProvider>} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
