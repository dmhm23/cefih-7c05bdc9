import { CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface Pregunta {
  id: number;
  texto: string;
  opciones: string[];
  correcta: number;
}

interface QuizReviewCardProps {
  preguntas: Pregunta[];
  respuestas: Record<number, number>;
}

export function QuizReviewCard({ preguntas, respuestas }: QuizReviewCardProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">Revisión de respuestas</h3>
      {preguntas.map((p, idx) => {
        const answered = respuestas[p.id];
        const isCorrect = answered === p.correcta;
        return (
          <Card key={p.id} className={isCorrect ? 'border-primary/30' : 'border-destructive/30'}>
            <CardHeader className="py-2 px-4 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground">
                Pregunta {idx + 1}
              </p>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-medium">{p.texto}</p>
              {p.opciones.map((opt, oi) => {
                const isSelected = oi === answered;
                const isCorrectOption = oi === p.correcta;
                let className = 'text-sm py-1 px-2 rounded flex items-center gap-2';
                if (isSelected && isCorrect) {
                  className += ' bg-primary/10 text-primary font-medium';
                } else if (isSelected && !isCorrect) {
                  className += ' bg-destructive/10 text-destructive font-medium';
                } else if (isCorrectOption && !isCorrect) {
                  className += ' bg-primary/5 text-primary';
                }
                return (
                  <div key={oi} className={className}>
                    {isSelected && isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                    {isSelected && !isCorrect && <XCircle className="h-3.5 w-3.5 shrink-0" />}
                    {!isSelected && isCorrectOption && !isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 opacity-60" />}
                    {opt}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
