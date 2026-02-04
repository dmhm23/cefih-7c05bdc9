import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

// Wrapper component for pages that need the main layout
const WithLayout = ({ children }: { children: React.ReactNode }) => (
  <MainLayout>{children}</MainLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />

          {/* Protected routes with layout */}
          <Route path="/dashboard" element={<WithLayout><Dashboard /></WithLayout>} />
          
          {/* Módulo A - Personas */}
          <Route path="/personas" element={<WithLayout><PersonasPage /></WithLayout>} />
          <Route path="/personas/nuevo" element={<WithLayout><PersonaFormPage /></WithLayout>} />
          <Route path="/personas/:id" element={<WithLayout><PersonaDetallePage /></WithLayout>} />
          <Route path="/personas/:id/editar" element={<WithLayout><PersonaFormPage /></WithLayout>} />
          
          {/* Módulo B - Matrículas */}
          <Route path="/matriculas" element={<WithLayout><MatriculasPage /></WithLayout>} />
          <Route path="/matriculas/nueva" element={<WithLayout><MatriculaFormPage /></WithLayout>} />
          <Route path="/matriculas/:id" element={<WithLayout><MatriculaDetallePage /></WithLayout>} />
          
          {/* Módulo C - Cursos */}
          <Route path="/cursos" element={<WithLayout><CursosPage /></WithLayout>} />
          <Route path="/cursos/nuevo" element={<WithLayout><CursoFormPage /></WithLayout>} />
          <Route path="/cursos/:id" element={<WithLayout><CursoDetallePage /></WithLayout>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
