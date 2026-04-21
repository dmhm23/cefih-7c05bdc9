import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormatoById, useFirmasMatricula, useEnviarFormatoDinamico, useInfoAprendizData } from '@/hooks/usePortalEstudiante';
import { useFormatoRespuesta, useSaveFormatoRespuesta } from '@/hooks/useFormatoRespuestas';
import PortalFormatoRenderer from '@/components/portal/PortalFormatoRenderer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowLeft, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { BloqueSignatureCapture, BloqueEvaluationQuiz } from '@/modules/formatos/plugins/safa';

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
  const { data: existingResp, isLoading: loadingResp } = useFormatoRespuesta(matriculaId, formatoId);
  const enviarMutation = useEnviarFormatoDinamico();
  const saveRespuestaMutation = useSaveFormatoRespuesta();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate answers from existing response
  useEffect(() => {
    if (hydrated || loadingResp) return;
    if (existingResp) {
      const saved = existingResp.answers || {};
      if (Object.keys(saved).length > 0) {
        // Strip legacy "_intentos_evaluacion" key if present (now stored in dedicated column)
        const { _intentos_evaluacion, ...clean } = saved as Record<string, unknown>;
        setAnswers(clean);
      }
      // Note: for quizzes we DON'T set submitted=true on hydration so the student
      // can always run a new attempt. For non-quiz formats, completed → readOnly via isCompleted.
    }
    setHydrated(true);
  }, [existingResp, loadingResp, hydrated]);

  const handleAnswerChange = useCallback((key: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const isLoading = loadingFormato || loadingContext || loadingFirmas || loadingResp;

  // Detect if format has quiz blocks
  const hasQuiz = useMemo(() => {
    if (!formato) return false;
    return formato.bloques.some(b => b.type === 'evaluation_quiz');
  }, [formato]);

  // Find signature block
  const signatureBlock = useMemo(() => {
    if (!formato) return undefined;
    return formato.bloques.find(
      b => b.type === 'signature_capture' && ((b as BloqueSignatureCapture).props?.mode === 'capture' || !(b as BloqueSignatureCapture).props?.mode)
    ) as BloqueSignatureCapture | undefined;
  }, [formato]);

  // Quiz retry handler — clears only incorrect answers (passed by the quiz block)
  const handleQuizRetry = useCallback((keysToReset: string[]) => {
    setAnswers(prev => {
      const next = { ...prev };
      keysToReset.forEach(k => {
        delete next[k];
      });
      // Also clear all *_result keys so the next attempt recalculates fresh
      Object.keys(next).forEach(k => {
        if (k.endsWith('_result')) delete next[k];
      });
      return next;
    });
    setSubmitted(false);
  }, []);

  if (isLoading || !hydrated) {
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

      // For quizzes: append this attempt to the canonical intentos_evaluacion column
      let intentosEvaluacion: Record<string, unknown>[] | undefined;
      if (hasQuiz) {
        const quizBlocks = formato.bloques.filter(b => b.type === 'evaluation_quiz') as BloqueEvaluationQuiz[];
        const intentoEntries: Record<string, unknown> = {};
        quizBlocks.forEach(qb => {
          const resultKey = `${qb.id}_result`;
          const r = answers[resultKey] as { puntaje?: number; correctas?: number; total?: number; aprobado?: boolean } | undefined;
          if (r) {
            // schema v2: incluir snapshot de preguntas con respuesta y correcta
            const preguntasSnapshot = (qb.props?.preguntas || []).map(preg => {
              const ansKey = `${qb.id}_q${preg.id}`;
              const respondidaRaw = answers[ansKey];
              const respondida = typeof respondidaRaw === 'number'
                ? respondidaRaw
                : (respondidaRaw == null ? null : Number(respondidaRaw));
              const respondidaFinal = respondida === null || Number.isNaN(respondida) ? null : respondida;
              return {
                id: preg.id,
                texto: preg.texto,
                opciones: [...preg.opciones],
                correcta: preg.correcta,
                respondida: respondidaFinal,
                esCorrecta: respondidaFinal !== null && respondidaFinal === preg.correcta,
              };
            });
            intentoEntries[qb.id] = {
              puntaje: r.puntaje,
              correctas: r.correctas,
              total: r.total,
              aprobado: r.aprobado,
              preguntas: preguntasSnapshot,
            };
          }
        });
        const previos = (existingResp?.intentosEvaluacion || []) as Record<string, unknown>[];
        intentosEvaluacion = [
          ...previos,
          {
            timestamp: new Date().toISOString(),
            schema_version: 2,
            resultados: intentoEntries,
          },
        ];
      }

      // Also persist to formato_respuestas as completed
      saveRespuestaMutation.mutate({
        matriculaId,
        formatoId,
        answers,
        estado: 'completado',
        intentosEvaluacion,
      });

      if (hasQuiz) {
        // Stay on page and show results
        setSubmitted(true);
        toast({ title: 'Evaluación enviada correctamente' });
      } else {
        toast({ title: 'Documento enviado correctamente' });
        navigate('/estudiante/inicio');
      }
    } catch (err: any) {
      toast({ title: 'Error al enviar', description: err.message, variant: 'destructive' });
    }
  };

  // For formats with quiz: completion is local-only so the student can always retry.
  // For non-quiz formats: respect the persisted "completado" state to lock the form.
  const isCompleted = hasQuiz ? submitted : (submitted || existingResp?.estado === 'completado');

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
          readOnly={isCompleted && !hasQuiz}
          firmasMatricula={firmas}
          submitted={submitted}
          onQuizRetry={handleQuizRetry}
        />

        {/* Submit — hide if already completed (unless quiz allows retry) */}
        {!isCompleted && (
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
                {hasQuiz ? 'Enviar evaluación' : 'Enviar documento'}
              </>
            )}
          </Button>
        )}

        {/* After quiz submission, show back button */}
        {submitted && hasQuiz && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/estudiante/inicio')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Button>
        )}
      </div>
    </div>
  );
}
