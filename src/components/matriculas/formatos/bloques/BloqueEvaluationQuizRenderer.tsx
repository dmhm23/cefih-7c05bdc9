import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import type { BloqueEvaluationQuiz } from '@/types/formatoFormacion';

interface Props {
  bloque: BloqueEvaluationQuiz;
  answers: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export default function BloqueEvaluationQuizRenderer({ bloque, answers, onChange, readOnly }: Props) {
  const preguntas = bloque.props?.preguntas || [];
  const umbral = bloque.props?.umbralAprobacion ?? 70;

  const quizKey = (pregId: number) => `${bloque.id}_q${pregId}`;
  const getSelected = (pregId: number) => answers[quizKey(pregId)] as number | undefined;

  // Calculate result if all questions answered
  const result = useMemo(() => {
    if (preguntas.length === 0) return null;
    const answered = preguntas.filter((p) => getSelected(p.id) !== undefined);
    if (answered.length < preguntas.length) return null;
    const correctas = preguntas.filter((p) => getSelected(p.id) === p.correcta).length;
    const puntaje = Math.round((correctas / preguntas.length) * 100);
    return { correctas, total: preguntas.length, puntaje, aprobado: puntaje >= umbral };
  }, [answers, preguntas, umbral]);

  // Expose result via answers when it changes
  React.useEffect(() => {
    if (result && onChange) {
      onChange(`${bloque.id}_result`, result);
    }
  }, [result?.puntaje]);

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

      {preguntas.map((preg, idx) => {
        const selected = getSelected(preg.id);
        const showResult = readOnly && selected !== undefined;
        const isCorrect = selected === preg.correcta;

        return (
          <div key={preg.id} className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium">
              {idx + 1}. {preg.texto}
            </p>
            <div className="space-y-1.5">
              {preg.opciones.map((opt, optIdx) => {
                const isSelected = selected === optIdx;
                let optClass = 'border-border bg-background';
                if (isSelected && !showResult) optClass = 'border-primary bg-primary/5';
                if (showResult && isSelected && isCorrect) optClass = 'border-emerald-500 bg-emerald-50';
                if (showResult && isSelected && !isCorrect) optClass = 'border-red-500 bg-red-50';
                if (showResult && !isSelected && optIdx === preg.correcta) optClass = 'border-emerald-300 bg-emerald-50/50';

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={readOnly}
                    onClick={() => !readOnly && onChange?.(quizKey(preg.id), optIdx)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 text-left transition-colors ${optClass} ${
                      readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-muted/50'
                    }`}
                  >
                    <span className="shrink-0 w-6 h-6 rounded border flex items-center justify-center text-xs font-bold">
                      {LETTERS[optIdx]}
                    </span>
                    <span className="text-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {result && (
        <div className={`p-4 rounded-lg border-2 text-center ${
          result.aprobado ? 'border-emerald-500 bg-emerald-50' : 'border-red-500 bg-red-50'
        }`}>
          <p className="text-lg font-bold">
            {result.puntaje}% — {result.aprobado ? 'APROBADO' : 'NO APROBADO'}
          </p>
          <p className="text-sm text-muted-foreground">
            {result.correctas} de {result.total} correctas
          </p>
        </div>
      )}
    </div>
  );
}
