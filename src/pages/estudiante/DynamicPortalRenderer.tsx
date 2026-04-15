import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormatoById, useFirmasMatricula, useEnviarFormatoDinamico, useInfoAprendizData } from '@/hooks/usePortalEstudiante';
import DynamicFormatoDocument from '@/components/matriculas/formatos/DynamicFormatoDocument';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import SignatureCanvas from 'react-signature-canvas';
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
  const [firmaBase64, setFirmaBase64] = useState<string | null>(null);
  const [autorizaReutilizacion, setAutorizaReutilizacion] = useState(false);
  const sigCanvasRef = useRef<SignatureCanvas | null>(null);
  const isEmptyRef = useRef(true);

  const handleAnswerChange = useCallback((key: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const isLoading = loadingFormato || loadingContext || loadingFirmas;

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

  // Check if this format has a signature_capture block in capture mode
  const signatureBlock = formato.bloques.find(
    b => b.type === 'signature_capture' && ((b as BloqueSignatureCapture).props?.mode === 'capture' || !(b as BloqueSignatureCapture).props?.mode)
  ) as BloqueSignatureCapture | undefined;

  const needsSignatureCapture = !!signatureBlock && !answers[signatureBlock.id];

  const handleClearSignature = () => {
    sigCanvasRef.current?.clear();
    isEmptyRef.current = true;
    setFirmaBase64(null);
    if (signatureBlock) {
      setAnswers(prev => {
        const next = { ...prev };
        delete next[signatureBlock.id];
        return next;
      });
    }
  };

  const handleEndStroke = () => {
    if (!sigCanvasRef.current || isEmptyRef.current) return;
    const data = sigCanvasRef.current.getCanvas().toDataURL('image/png');
    setFirmaBase64(data);
    if (signatureBlock) {
      setAnswers(prev => ({ ...prev, [signatureBlock.id]: data }));
    }
  };

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
          autorizaReutilizacion,
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
      <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
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

        {/* Dynamic format document */}
        <div className="border rounded-lg overflow-hidden">
          <DynamicFormatoDocument
            formato={formato}
            persona={contextData?.persona ?? null}
            matricula={contextData?.matricula ?? { id: matriculaId } as any}
            curso={contextData?.curso ?? null}
            entrenador={null}
            supervisor={null}
            answers={answers}
            onAnswerChange={handleAnswerChange}
            readOnly={false}
            firmasMatricula={firmas}
          />
        </div>

        {/* Signature capture section (if format needs it and block is in capture mode) */}
        {signatureBlock && !answers[signatureBlock.id] && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">
              {signatureBlock.label || 'Firma del estudiante'}
            </h3>
            <div className="border-2 border-dashed border-primary/30 rounded-lg bg-background">
              <SignatureCanvas
                ref={sigCanvasRef}
                canvasProps={{
                  className: 'w-full h-40',
                  style: { width: '100%', height: '160px' },
                }}
                onBegin={() => { isEmptyRef.current = false; }}
                onEnd={handleEndStroke}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClearSignature}>
                Limpiar
              </Button>
            </div>
          </div>
        )}

        {signatureBlock && answers[signatureBlock.id] && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Firma capturada</span>
              <Button variant="ghost" size="sm" onClick={handleClearSignature}>
                Limpiar
              </Button>
            </div>
          </div>
        )}

        {/* Authorization checkbox for signature reuse */}
        {signatureBlock && formato.esOrigenFirma && (
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autorizaReutilizacion}
              onChange={(e) => setAutorizaReutilizacion(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-muted-foreground">
              Autorizo la reutilización de mi firma en los demás documentos de esta matrícula
            </span>
          </label>
        )}

        {/* Submit */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={enviarMutation.isPending || (needsSignatureCapture && !firmaBase64)}
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
