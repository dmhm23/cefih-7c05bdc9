import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormatoById, useFirmasMatricula, useEnviarFormatoDinamico, useInfoAprendizData } from '@/hooks/usePortalEstudiante';
import PortalFormatoRenderer from '@/components/portal/PortalFormatoRenderer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { BloqueSignatureCapture } from '@/types/formatoFormacion';

interface Props {
  formatoId: string;
  documentoKey: string;
  matriculaId: string;
}

export default function DynamicPortalRenderer({ formatoId, documentoKey, matriculaId }: Props) {
  const navigate = useNavigate();
  const { data: formato, isLoading: loadingFormato } = useFormatoById(formatoId);
  const { data: contextData, isLoading: loadingContext } = useInfoAprendizData(matriculaId);
  const { data: firmas = [], isLoading: loadingFirmas } = useFirmasMatricula(matriculaId);
  const enviarMutation = useEnviarFormatoDinamico();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const handleAnswerChange = useCallback((key: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const isLoading = loadingFormato || loadingContext || loadingFirmas;

  // Find signature block to extract firma from answers on submit
  const signatureBlock = useMemo(() => {
    if (!formato) return undefined;
    return formato.bloques.find(
      b => b.type === 'signature_capture' && ((b as BloqueSignatureCapture).props?.mode === 'capture' || !(b as BloqueSignatureCapture).props?.mode)
    ) as BloqueSignatureCapture | undefined;
  }, [formato]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-40 w-72 rounded-xl" />
      </div>
    );
  }

  if (!formato) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-sm text-destructive">Formato no encontrado o inactivo</p>
        <Button variant="ghost" onClick={() => navigate('/estudiante/inicio')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
      </div>
    );
  }

  const firmaBase64 = signatureBlock ? (answers[signatureBlock.id] as string | undefined) || null : null;
  const needsSignature = !!signatureBlock && !firmaBase64;

  const handleSubmit = async () => {
    try {
      await enviarMutation.mutateAsync({
        matriculaId,
        formatoId,
        documentoKey,
        answers,
        firmaPayload: firmaBase64 && signatureBlock ? {
          firmaBase64,
          tipoFirmante: signatureBlock.props?.tipoFirmante || 'aprendiz',
          esOrigenFirma: formato.esOrigenFirma,
        } : undefined,
      });

      toast({ title: 'Documento enviado correctamente' });
      navigate('/estudiante/inicio');
    } catch (err: any) {
      toast({ title: 'Error al enviar', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/estudiante/inicio')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{formato.nombre}</h1>
            {formato.descripcion && (
              <p className="text-sm text-muted-foreground">{formato.descripcion}</p>
            )}
          </div>
        </div>

        {/* Semantic portal renderer */}
        <PortalFormatoRenderer
          formato={formato}
          persona={contextData?.persona ?? null}
          matricula={contextData?.matricula ?? { id: matriculaId } as any}
          curso={contextData?.curso ?? null}
          answers={answers}
          onAnswerChange={handleAnswerChange}
          readOnly={false}
          firmasMatricula={firmas}
        />

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={enviarMutation.isPending || needsSignature}
        >
          {enviarMutation.isPending ? (
            'Enviando...'
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar documento
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
