import { useParams, Navigate } from 'react-router-dom';
import { usePortalEstudianteSession } from '@/contexts/PortalEstudianteContext';
import { useDocumentosPortal, useFormatoById, useFirmasMatricula, useInfoAprendizData } from '@/hooks/usePortalEstudiante';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Construction, BookOpen, AlertTriangle } from 'lucide-react';
import InfoAprendizPage from './InfoAprendizPage';
import EvaluacionPage from './EvaluacionPage';
import DynamicPortalRenderer from './DynamicPortalRenderer';

/* ── Legacy placeholder renderers (kept temporarily as fallback) ── */
function FormularioPlaceholder() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
      <Construction className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-sm">Formulario en construcción</p>
    </div>
  );
}

function SoloLecturaPlaceholder() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
      <BookOpen className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-sm">Documento de solo lectura</p>
    </div>
  );
}

/* ── Legacy renderer registry (fallback only when formato_id is missing) ── */
const LEGACY_RENDERERS: Record<string, React.ComponentType> = {
  firma_autorizacion: InfoAprendizPage,
  evaluacion: EvaluacionPage,
  formulario: FormularioPlaceholder,
  solo_lectura: SoloLecturaPlaceholder,
};

export default function DocumentoRendererPage() {
  const { documentoKey } = useParams<{ documentoKey: string }>();
  const { session } = usePortalEstudianteSession();
  const { data, isLoading } = useDocumentosPortal(session?.matriculaId ?? null);

  if (!session || !documentoKey) return <Navigate to="/estudiante" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-40 w-72 rounded-xl" />
      </div>
    );
  }

  const docConfig = data?.config.find(c => c.key === documentoKey);
  if (!docConfig) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <FileText className="h-12 w-12 text-destructive" />
        <p className="text-sm text-destructive">Documento no encontrado: <strong>{documentoKey}</strong></p>
      </div>
    );
  }

  const estado = data?.estados.find(e => e.key === documentoKey);
  if (estado?.estado === 'bloqueado') {
    return <Navigate to="/estudiante/inicio" replace />;
  }

  // PRIORITY: If docConfig has a formato_id, use the dynamic renderer
  if (docConfig.formatoId) {
    return (
      <DynamicPortalRenderer
        formatoId={docConfig.formatoId}
        documentoKey={documentoKey}
        matriculaId={session.matriculaId}
      />
    );
  }

  // FALLBACK: Legacy renderer for documents without formato_id
  const Renderer = LEGACY_RENDERERS[docConfig.tipo];
  if (!Renderer) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-destructive">Documento no configurado — falta formato vinculado</p>
      </div>
    );
  }

  return <Renderer />;
}
