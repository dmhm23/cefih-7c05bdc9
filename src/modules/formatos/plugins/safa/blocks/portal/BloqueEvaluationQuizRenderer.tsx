import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RotateCcw, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BloqueEvaluationQuiz } from '../../types';

export type QuizMode = 'interactive' | 'graded-readonly';

export interface IntentoVigente {
  puntaje: number;
  correctas: number;
  total: number;
  aprobado: boolean;
  timestamp?: string;
  reconstruido?: boolean;
}

interface Props {
  bloque: BloqueEvaluationQuiz;
  answers: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
  submitted?: boolean;
  onRetry?: (keysToReset: string[]) => void;
  /**
   * 'interactive' (default) — flujo del portal (responder, retry).
   * 'graded-readonly' — vista calificada solo lectura (Matrículas → Detalle/PDF).
   *   En este modo se ignoran retry/submit y se muestra un ResumenCalificacionQuiz
   *   arriba de la primera pregunta.
   */
  mode?: QuizMode;
  /** Resumen del último intento (vigente). Solo aplica en modo graded-readonly. */
  intentoVigente?: IntentoVigente | null;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function ResumenCalificacionQuiz({ intento }: { intento: IntentoVigente }) {
  const { puntaje, correctas, total, aprobado } = intento;

  return (
    <div
      className={`quiz-graded-summary border-2 rounded-lg p-4 text-center space-y-2 ${
        aprobado
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-red-500 bg-red-50'
      }`}
      style={{ gridColumn: 'span 2' }}
    >
      <div className="flex items-center justify-center gap-3">
        <Badge
          className={`text-sm font-bold px-3 py-1 ${
            aprobado
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-red-600 text-white border-red-700'
          }`}
        >
          {aprobado ? 'APROBADO' : 'NO APROBADO'}
        </Badge>
        <span className="text-2xl font-bold leading-none">{puntaje}%</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {correctas} de {total} respuestas correctas
      </p>
    </div>
  );
}

export default function BloqueEvaluationQuizRenderer({
  bloque,
  answers,
  onChange,
  readOnly,
  submitted,
  onRetry,
  mode = 'interactive',
  intentoVigente,
}: Props) {
  const preguntas = bloque.props?.preguntas || [];
  const umbral = bloque.props?.umbralAprobacion ?? 70;

  const isGradedReadonly = mode === 'graded-readonly';

  const quizKey = (pregId: number) => `${bloque.id}_q${pregId}`;
  const lockedKey = (pregId: number) => `${bloque.id}_q${pregId}_locked`;
  const getSelected = (pregId: number) => answers[quizKey(pregId)] as number | undefined;
  const isLocked = (pregId: number) => answers[lockedKey(pregId)] === true;

  const result = useMemo(() => {
    if (preguntas.length === 0) return null;
    const answered = preguntas.filter((p) => getSelected(p.id) !== undefined);
    if (answered.length < preguntas.length) return null;
    const correctas = preguntas.filter((p) => getSelected(p.id) === p.correcta).length;
    const puntaje = Math.round((correctas / preguntas.length) * 100);
    return { correctas, total: preguntas.length, puntaje, aprobado: puntaje >= umbral };
  }, [answers, preguntas, umbral]);

  React.useEffect(() => {
    if (isGradedReadonly) return;
    if (result && onChange) {
      onChange(`${bloque.id}_result`, result);
    }
  }, [result?.puntaje, isGradedReadonly]);

  const showResult = !isGradedReadonly && submitted && result;

  const handleRetry = () => {
    if (!onRetry) return;
    // Lock correct answers and identify keys (incorrect answers) to reset
    const keysToReset: string[] = [];
    preguntas.forEach((preg) => {
      const sel = getSelected(preg.id);
      if (sel === preg.correcta) {
        // Mark correct answer as locked so it persists across retries
        onChange?.(lockedKey(preg.id), true);
      } else {
        keysToReset.push(quizKey(preg.id));
      }
    });
    onRetry(keysToReset);
  };

  return (
    <div style={{ gridColumn: 'span 2' }} className="mt-2 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
          {bloque.label || 'Evaluación'}
        </p>
        <Badge variant="outline" className="text-[10px]">
          Umbral: {umbral}%
        </Badge>
      </div>

      {/* Resumen calificación arriba de la primera pregunta (solo modo graded-readonly) */}
      {isGradedReadonly && intentoVigente && (
        <ResumenCalificacionQuiz intento={intentoVigente} />
      )}

      {isGradedReadonly && !intentoVigente && (
        <div
          className="border-2 border-dashed border-border rounded-lg p-4 text-center"
          style={{ gridColumn: 'span 2' }}
        >
          <p className="text-sm text-muted-foreground italic">Evaluación pendiente</p>
        </div>
      )}

      {preguntas.map((preg, idx) => {
        const selected = getSelected(preg.id);
        const locked = isLocked(preg.id);
        // En graded-readonly mostramos siempre el feedback (correcta/incorrecta)
        const showAnswerResult =
          isGradedReadonly || ((submitted || locked) && selected !== undefined);
        const isCorrect = selected === preg.correcta;
        const questionDisabled = isGradedReadonly || readOnly || submitted || locked;

        return (
          <div
            key={preg.id}
            className={`border rounded-lg p-3 space-y-2 ${
              !isGradedReadonly && locked ? 'bg-emerald-50/30 border-emerald-200' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium">
                {idx + 1}. {preg.texto}
              </p>
              {!isGradedReadonly && locked && (
                <Badge
                  variant="outline"
                  className="shrink-0 text-[9px] border-emerald-500 text-emerald-700 bg-emerald-50"
                >
                  <Lock className="h-2.5 w-2.5 mr-1" />
                  Correcta
                </Badge>
              )}
            </div>
            <div className="space-y-1.5">
              {preg.opciones.map((opt, optIdx) => {
                const isSelected = selected === optIdx;
                let optClass = 'quiz-option-disabled border-border bg-background';
                if (isSelected && !showAnswerResult) optClass = 'border-primary bg-primary/5';
                if (showAnswerResult && isSelected && isCorrect)
                  optClass = 'quiz-option-correct border-emerald-500 bg-emerald-50';
                if (showAnswerResult && isSelected && !isCorrect)
                  optClass = 'quiz-option-incorrect border-red-500 bg-red-50';
                if (showAnswerResult && !isSelected && optIdx === preg.correcta)
                  optClass = 'quiz-option-correct border-emerald-300 bg-emerald-50/50';

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={questionDisabled}
                    onClick={() => !questionDisabled && onChange?.(quizKey(preg.id), optIdx)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 text-left transition-colors ${optClass} ${
                      questionDisabled ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'
                    }`}
                  >
                    <span className="shrink-0 w-6 h-6 rounded border flex items-center justify-center text-xs font-bold">
                      {LETTERS[optIdx]}
                    </span>
                    <span className="text-sm flex-1">{opt}</span>
                    {showAnswerResult && isSelected && isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    {showAnswerResult && isSelected && !isCorrect && (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    {showAnswerResult && !isSelected && optIdx === preg.correcta && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 opacity-60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {showResult && (
        <div className={`p-4 rounded-lg border-2 text-center space-y-3 ${
          result.aprobado ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'
        }`}>
          <p className="text-lg font-bold">
            {result.puntaje}% — {result.aprobado ? 'APROBADO' : 'NO APROBADO'}
          </p>
          <p className="text-sm text-muted-foreground">
            {result.correctas} de {result.total} correctas
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="mt-2"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {result.aprobado ? 'Realizar nuevo intento' : 'Reintentar para aprobar'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
