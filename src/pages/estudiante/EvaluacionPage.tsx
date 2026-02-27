import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, ClipboardList, Star, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { usePortalEstudianteSession } from '@/contexts/PortalEstudianteContext';
import { useEvaluacionFormato, useDocumentosPortal, useEnviarDocumento } from '@/hooks/usePortalEstudiante';
import { BloqueEvaluationQuiz, BloqueSatisfactionSurvey } from '@/types/formatoFormacion';
import { QuizReviewCard } from '@/components/estudiante/QuizReviewCard';
import { cn } from '@/lib/utils';

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function SelectableOption({
  letter,
  text,
  value,
  selected,
  groupValue,
  onSelect,
}: {
  letter: string;
  text: string;
  value: string;
  selected: boolean;
  groupValue: string | undefined;
  onSelect: (v: string) => void;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-3 w-full p-2 rounded-xl border-2 cursor-pointer transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
      )}
      onClick={() => onSelect(value)}
    >
      <span
        className={cn(
          "shrink-0 w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground"
        )}
      >
        {letter}
      </span>
      <span className="text-base font-medium leading-snug flex-1">{text}</span>
      <RadioGroupItem value={value} className="sr-only" />
    </label>
  );
}

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
  const [isRetry, setIsRetry] = useState(false);
  const [savedSurvey, setSavedSurvey] = useState<{ escala: Record<number, string>; siNo: string | null } | null>(null);

  const docEstado = docData?.estados.find(d => d.key === 'evaluacion');
  const yaAprobado = docEstado?.estado === 'completado' && (docEstado?.metadata as any)?.aprobado === true;
  const prevReprobado = docEstado?.estado === 'pendiente' && (docEstado?.metadata as any)?.aprobado === false;

  useEffect(() => {
    if (prevReprobado && docEstado && !isRetry && !submitted) {
      setIsRetry(true);
      const prevResp = docEstado.respuestas as any;
      if (prevResp?.encuesta) {
        setSavedSurvey(prevResp.encuesta);
        const escala = prevResp.encuesta.escala || {};
        setSurveyAnswers(escala);
        setSiNoAnswer(prevResp.encuesta.siNo || null);
      }
    }
  }, [prevReprobado, docEstado, isRetry, submitted]);

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
  const allSurveyAnswered = isRetry
    ? true
    : surveyBloque
      ? Object.keys(surveyAnswers).length === (surveyProps?.escalaPreguntas.length || 0) &&
        (!surveyProps?.preguntaSiNo || siNoAnswer !== null)
      : true;
  const canSubmit = allQuizAnswered && allSurveyAnswered && !submitted;

  // --- Already approved view ---
  if (yaAprobado) {
    const prev = docEstado;
    const numIntentos = (prev?.intentos?.length || 0) + 1;
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/estudiante/inicio')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Evaluación completada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Puntaje obtenido</span>
              <span className="text-2xl font-bold">{prev?.puntaje?.toFixed(0)}%</span>
            </div>
            <Badge className="text-sm bg-success text-success-foreground hover:bg-success/90">Aprobado</Badge>
            {numIntentos > 1 && (
              <p className="text-xs text-muted-foreground">Aprobado en el intento #{numIntentos}</p>
            )}
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
    if (result.aprobado) {
      return (
        <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Resultado de la Evaluación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-4xl font-bold">{result.puntaje.toFixed(0)}%</p>
                <Badge className="text-sm bg-success text-success-foreground hover:bg-success/90">Aprobado</Badge>
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

    // Failed — show review + retry button
    return (
      <div className="min-h-screen bg-background p-4 max-w-md mx-auto space-y-4 pb-24">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Resultado de la Evaluación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-4xl font-bold">{result.puntaje.toFixed(0)}%</p>
              <Badge variant="destructive" className="text-sm">Reprobado</Badge>
              <p className="text-sm text-muted-foreground">
                {result.correctas} de {result.total} respuestas correctas · Mínimo requerido: {umbral}%
              </p>
            </div>
          </CardContent>
        </Card>

        <QuizReviewCard preguntas={preguntas} respuestas={quizAnswers} />

        <Button
          className="w-full"
          onClick={() => {
            if (!savedSurvey) {
              setSavedSurvey({ escala: { ...surveyAnswers }, siNo: siNoAnswer });
            }
            setQuizAnswers({});
            setSubmitted(false);
            setResult(null);
            setIsRetry(true);
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reintentar evaluación
        </Button>
      </div>
    );
  }

  // --- Main form ---
  const handleSubmit = async () => {
    if (!matriculaId) return;

    const correctas = preguntas.filter(p => quizAnswers[p.id] === p.correcta).length;
    const puntaje = (correctas / preguntas.length) * 100;
    const aprobado = puntaje >= umbral;

    const encuestaResp = isRetry && savedSurvey
      ? savedSurvey
      : surveyBloque
        ? { escala: surveyAnswers, siNo: siNoAnswer }
        : undefined;

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
          <h1 className="text-lg font-semibold">Evaluación{isRetry ? ' — Reintento' : ' y Encuesta'}</h1>
          <p className="text-xs text-muted-foreground">{formato.nombre}</p>
        </div>
      </div>

      {/* Quiz Section */}
      <div className="space-y-4">
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
              <p className="text-sm font-semibold">
                {idx + 1}. {pregunta.texto}
              </p>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              <RadioGroup
                value={quizAnswers[pregunta.id]?.toString()}
                onValueChange={(v) => setQuizAnswers(prev => ({ ...prev, [pregunta.id]: parseInt(v) }))}
                className="space-y-2"
              >
                {pregunta.opciones.map((opcion, oi) => (
                  <SelectableOption
                    key={oi}
                    letter={OPTION_LETTERS[oi]}
                    text={opcion}
                    value={oi.toString()}
                    selected={quizAnswers[pregunta.id] === oi}
                    groupValue={quizAnswers[pregunta.id]?.toString()}
                    onSelect={(v) => setQuizAnswers(prev => ({ ...prev, [pregunta.id]: parseInt(v) }))}
                  />
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Survey Section — hidden on retry */}
      {isRetry ? (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <span className="text-sm text-muted-foreground">Encuesta de satisfacción ya completada</span>
        </div>
      ) : surveyBloque && surveyProps ? (
        <>
          <Separator />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-base">Encuesta de Satisfacción</h2>
            </div>

            {surveyProps.escalaPreguntas.map((pregunta, idx) => (
              <Card key={idx}>
                <CardHeader className="py-3 px-4 bg-muted/30">
                  <p className="text-sm font-semibold">
                    {idx + 1}. {pregunta}
                  </p>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <RadioGroup
                    value={surveyAnswers[idx]}
                    onValueChange={(v) => setSurveyAnswers(prev => ({ ...prev, [idx]: v }))}
                    className="space-y-2"
                  >
                    {surveyProps.escalaOpciones.map((opt, oi) => (
                      <SelectableOption
                        key={opt.value}
                        letter={OPTION_LETTERS[oi]}
                        text={opt.label}
                        value={opt.value}
                        selected={surveyAnswers[idx] === opt.value}
                        groupValue={surveyAnswers[idx]}
                        onSelect={(v) => setSurveyAnswers(prev => ({ ...prev, [idx]: v }))}
                      />
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}

            {surveyProps.preguntaSiNo && (
              <Card>
                <CardHeader className="py-3 px-4 bg-muted/30">
                  <p className="text-sm font-semibold">
                    {(surveyProps.escalaPreguntas.length || 0) + 1}. {surveyProps.preguntaSiNo}
                  </p>
                </CardHeader>
                <CardContent className="p-3 space-y-2">
                  <RadioGroup
                    value={siNoAnswer || undefined}
                    onValueChange={setSiNoAnswer}
                    className="space-y-2"
                  >
                    <SelectableOption
                      letter="A"
                      text="Sí"
                      value="si"
                      selected={siNoAnswer === 'si'}
                      groupValue={siNoAnswer || undefined}
                      onSelect={setSiNoAnswer}
                    />
                    <SelectableOption
                      letter="B"
                      text="No"
                      value="no"
                      selected={siNoAnswer === 'no'}
                      groupValue={siNoAnswer || undefined}
                      onSelect={setSiNoAnswer}
                    />
                  </RadioGroup>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : null}

      {/* Progress & Submit */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Quiz: {Object.keys(quizAnswers).length}/{preguntas.length}</span>
            {!isRetry && surveyBloque && (
              <span>Encuesta: {Object.keys(surveyAnswers).length + (siNoAnswer ? 1 : 0)}/{totalSurveyQuestions}</span>
            )}
          </div>
          <Button
            className="w-full"
            disabled={!canSubmit || enviarMutation.isPending}
            onClick={handleSubmit}
          >
            {enviarMutation.isPending ? 'Enviando…' : isRetry ? 'Enviar reintento' : 'Enviar evaluación'}
          </Button>
        </div>
      </div>
    </div>
  );
}
