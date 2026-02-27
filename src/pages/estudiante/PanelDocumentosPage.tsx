import { useNavigate } from 'react-router-dom';
import { usePortalEstudianteSession } from '@/contexts/PortalEstudianteContext';
import { useDocumentosPortal } from '@/hooks/usePortalEstudiante';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LogOut,
  FileText,
  ClipboardCheck,
  Lock,
  CheckCircle2,
  Clock,
  ChevronRight,
  PartyPopper,
} from 'lucide-react';
import { DocumentoPortalConfig, EstadoDocPortal } from '@/types/portalEstudiante';

const ICON_MAP: Record<string, React.ElementType> = {
  firma_autorizacion: FileText,
  evaluacion: ClipboardCheck,
  formulario: FileText,
  solo_lectura: FileText,
};

const ESTADO_BADGE: Record<EstadoDocPortal, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  bloqueado: { label: 'Bloqueado', variant: 'secondary', icon: Lock },
  pendiente: { label: 'Pendiente', variant: 'outline', icon: Clock },
  completado: { label: 'Completado', variant: 'default', icon: CheckCircle2 },
};

export default function PanelDocumentosPage() {
  const navigate = useNavigate();
  const { session, clearSession } = usePortalEstudianteSession();
  const { data, isLoading } = useDocumentosPortal(session?.matriculaId ?? null);

  if (!session) return null;

  const handleSalir = () => {
    clearSession();
    navigate('/estudiante');
  };

  const completados = data?.estados.filter(e => e.estado === 'completado').length ?? 0;
  const total = data?.config.length ?? 0;
  const todosCompletados = total > 0 && completados === total;
  const progreso = total > 0 ? Math.round((completados / total) * 100) : 0;

  const getDependenciaNombre = (key: string) => {
    const doc = data?.config.find(c => c.key === key);
    return doc?.nombre ?? key;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">
              {session.nombreEstudiante}
            </h1>
            <p className="text-sm text-muted-foreground">
              C.C. {session.cedula}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSalir}
            className="shrink-0 text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Salir
          </Button>
        </div>

        {/* Curso info */}
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-sm font-medium text-foreground">{session.cursoNombre}</p>
            {session.cursoFechaInicio && (
              <p className="text-xs text-muted-foreground mt-1">
                {session.cursoFechaInicio}
                {session.cursoFechaFin ? ` — ${session.cursoFechaFin}` : ''}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Progreso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium text-foreground">
              {completados} de {total}
            </span>
          </div>
          <Progress value={progreso} className="h-2" />
        </div>

        {/* Mensaje de finalización */}
        {todosCompletados && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <PartyPopper className="h-6 w-6 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  ¡Todos los documentos completados!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Has finalizado el proceso exitosamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de documentos */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : (
            data?.config
              .sort((a, b) => a.orden - b.orden)
              .map((docConfig) => {
                const estado = data.estados.find(e => e.key === docConfig.key);
                const estadoActual = estado?.estado ?? 'pendiente';
                const badgeInfo = ESTADO_BADGE[estadoActual];
                const IconDoc = ICON_MAP[docConfig.tipo] ?? FileText;
                const IconEstado = badgeInfo.icon;
                const bloqueado = estadoActual === 'bloqueado';
                const completado = estadoActual === 'completado';

                return (
                  <Card
                    key={docConfig.key}
                    className={`transition-colors ${
                      bloqueado
                        ? 'opacity-60'
                        : 'cursor-pointer hover:border-primary/40'
                    }`}
                    onClick={() => {
                      if (!bloqueado) {
                        navigate(`/estudiante/documentos/${docConfig.key}`);
                      }
                    }}
                  >
                    <CardContent className="py-4 px-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <IconDoc className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {docConfig.nombre}
                        </p>
                        {bloqueado && docConfig.dependeDe.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Completa primero: {docConfig.dependeDe.map(getDependenciaNombre).join(', ')}
                          </p>
                        )}
                        {completado && estado?.enviadoEn && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Enviado: {new Date(estado.enviadoEn).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={badgeInfo.variant} className="text-xs gap-1">
                          <IconEstado className="h-3 w-3" />
                          {badgeInfo.label}
                        </Badge>
                        {!bloqueado && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
