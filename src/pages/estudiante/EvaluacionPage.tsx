import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ClipboardList, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePortalEstudianteSession } from '@/contexts/PortalEstudianteContext';
import { useEvaluacionFormato, useDocumentosPortal, useEnviarDocumento } from '@/hooks/usePortalEstudiante';
import { BloqueEvaluationQuiz, BloqueSatisfactionSurvey } from '@/types/formatoFormacion';

export default function EvaluacionPage() {
  const navigate = useNavigate();
  const { session } = usePortalEstudianteSession();
  const { toast } = useToast();

  const matriculaId = session?.matriculaId || null;
  const { data, isLoading } = useEvaluacionFormato(matriculaId);
  const { data: docData } = useDocumentosPortal(matriculaId);
  const enviarMutation = useEnviarDocumento();

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [surveyAnswers, setSurveyAnswers] = useState<Record<number, string>>({});
  const [siNoAnswer, setSiNoAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ puntaje: number; aprobado: boolean; correctas: number; total: number } | null>(null);

  const docEstado = docData?.estados.find(d => d.key === 'evaluacion');
  const yaCompletado = docEstado?.estado === 'completado';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/estudiante/inicio')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <Card className="mt-4">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No hay evaluación configurada para este tipo de curso.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { formato } = data;
  const quizBloque = formato.bloques.find(b => b.type === 'evaluation_quiz') as BloqueEvaluationQuiz | undefined;
  const surveyBloque = formato.bloques.find(b => b.type === 'satisfaction_survey') as BloqueSatisfactionSurvey | undefined;

  if (!quizBloque) return null;

  const preguntas = quizBloque.props.preguntas;
  const umbral = quizBloque.props.umbralAprobacion;

  const surveyProps = surveyBloque?.props;
  const totalSurveyQuestions = (surveyProps?.escalaPreguntas.length || 0) + (surveyProps?.preguntaSiNo ? 1 : 0);

  const allQuizAnswered = Object.keys(quizAnswers).length === preguntas.length;
  const allSurveyAnswered = surveyBloque
    ? Object.keys(surveyAnswers).length === (surveyProps?.escalaPreguntas.length || 0) &&
      (!surveyProps?.preguntaSiNo || siNoAnswer !== null)
    : true;
  const canSubmit = allQuizAnswered && allSurveyAnswered && !submitted;

  // --- Already completed view ---
  if (yaCompletado) {
    const prev = docEstado;
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/estudiante/inicio')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Evaluación completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puntaje obtenido</span>
              <span className="text-2xl font-bold">{prev?.puntaje?.toFixed(0)}%</span>
            </div>
            <Badge variant={(prev?.metadata as any)?.aprobado ? 'default' : 'destructive'} className="text-sm">
              {(prev?.metadata as any)?.aprobado ? 'Aprobado' : 'Reprobado'}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Enviado el {prev?.enviadoEn ? new Date(prev.enviadoEn).toLocaleString('es-CO') : '—'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Post-submit result view ---
  if (submitted && result) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {result.aprobado
                ? <CheckCircle2 className="h-5 w-5 text-primary" />
                : <XCircle className="h-5 w-5 text-destructive" />}
              Resultado de la Evaluación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-4xl font-bold">{result.puntaje.toFixed(0)}%</p>
              <Badge variant={result.aprobado ? 'default' : 'destructive'} className="text-sm">
                {result.aprobado ? 'Aprobado' : 'Reprobado'}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {result.correctas} de {result.total} respuestas correctas
              </p>
            </div>
            <Separator />
            <Button className="w-full" onClick={() => navigate('/estudiante/inicio')}>
              Volver al panel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Main form ---
  const handleSubmit = async () => {
    if (!matriculaId) return;

    const correctas = preguntas.filter(p => quizAnswers[p.id] === p.correcta).length;
    const puntaje = (correctas / preguntas.length) * 100;
    const aprobado = puntaje >= umbral;

    const encuestaResp = surveyBloque ? {
      escala: surveyAnswers,
      siNo: siNoAnswer,
    } : undefined;

    try {
      await enviarMutation.mutateAsync({
        matriculaId,
        documentoKey: 'evaluacion',
        payload: {
          puntaje,
          respuestas: { quiz: quizAnswers, encuesta: encuestaResp },
          metadata: { aprobado, totalPreguntas: preguntas.length, correctas },
        },
      });
      setResult({ puntaje, aprobado, correctas, total: preguntas.length });
      setSubmitted(true);
      toast({
        title: aprobado ? '¡Evaluación aprobada!' : 'Evaluación enviada',
        description: `Puntaje: ${puntaje.toFixed(0)}% — ${aprobado ? 'Aprobado' : 'Reprobado'}`,
      });
    } catch {
      toast({ title: 'Error al enviar', description: 'Intente nuevamente', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/estudiante/inicio')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Evaluación y Encuesta</h1>
          <p className="text-xs text-muted-foreground">{formato.nombre}</p>
        </div>
      </div>

      {/* Quiz Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-base">Evaluación de Conocimientos</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Responda todas las preguntas. Puntaje mínimo de aprobación: {umbral}%
        </p>

        {preguntas.map((pregunta, idx) => (
          <Card key={pregunta.id} className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">
                Pregunta {idx + 1} de {preguntas.length}
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium leading-snug">{pregunta.texto}</p>
              <RadioGroup
                value={quizAnswers[pregunta.id]?.toString()}
                onValueChange={(v) => setQuizAnswers(prev => ({ ...prev, [pregunta.id]: parseInt(v) }))}
              >
                {pregunta.opciones.map((opcion, oi) => (
                  <div key={oi} className="flex items-start gap-2">
                    <RadioGroupItem value={oi.toString()} id={`q${pregunta.id}-o${oi}`} className="mt-0.5" />
                    <Label htmlFor={`q${pregunta.id}-o${oi}`} className="text-sm leading-snug cursor-pointer">
                      {opcion}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Survey Section */}
      {surveyBloque && surveyProps && (
        <>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-base">Encuesta de Satisfacción</h2>
            </div>

            {surveyProps.escalaPreguntas.map((pregunta, idx) => (
              <Card key={idx}>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium leading-snug">{pregunta}</p>
                  <RadioGroup
                    value={surveyAnswers[idx]}
                    onValueChange={(v) => setSurveyAnswers(prev => ({ ...prev, [idx]: v }))}
                    className="flex flex-wrap gap-2"
                  >
                    {surveyProps.escalaOpciones.map(opt => (
                      <div key={opt.value} className="flex items-center gap-1.5">
                        <RadioGroupItem value={opt.value} id={`s${idx}-${opt.value}`} />
                        <Label htmlFor={`s${idx}-${opt.value}`} className="text-xs cursor-pointer whitespace-nowrap">
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}

            {surveyProps.preguntaSiNo && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-medium leading-snug">{surveyProps.preguntaSiNo}</p>
                  <RadioGroup
                    value={siNoAnswer || undefined}
                    onValueChange={setSiNoAnswer}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="si" id="sino-si" />
                      <Label htmlFor="sino-si" className="text-sm cursor-pointer">Sí</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="no" id="sino-no" />
                      <Label htmlFor="sino-no" className="text-sm cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Progress & Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Quiz: {Object.keys(quizAnswers).length}/{preguntas.length}</span>
            {surveyBloque && (
              <span>Encuesta: {Object.keys(surveyAnswers).length + (siNoAnswer ? 1 : 0)}/{totalSurveyQuestions}</span>
            )}
          </div>
          <Button
            className="w-full"
            disabled={!canSubmit || enviarMutation.isPending}
            onClick={handleSubmit}
          >
            {enviarMutation.isPending ? 'Enviando…' : 'Enviar evaluación'}
          </Button>
        </div>
      </div>
    </div>
  );
}
