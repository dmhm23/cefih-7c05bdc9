import React from 'react';
import type { BloqueSatisfactionSurvey } from '@/types/formatoFormacion';

interface Props {
  bloque: BloqueSatisfactionSurvey;
  answers: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function BloqueSatisfactionSurveyRenderer({ bloque, answers, onChange, readOnly }: Props) {
  const preguntas = bloque.props?.escalaPreguntas || [];
  const opciones = bloque.props?.escalaOpciones || [];
  const preguntaSiNo = bloque.props?.preguntaSiNo;

  const scaleKey = (idx: number) => `${bloque.id}_s${idx}`;
  const siNoKey = `${bloque.id}_sino`;

  return (
    <div style={{ gridColumn: 'span 2' }} className="mt-2 space-y-4">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
        {bloque.label || 'Encuesta de Satisfacción'}
      </p>

      {/* Scale questions as table */}
      {preguntas.length > 0 && opciones.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left py-2 px-2 border-b font-semibold w-1/3">Aspecto</th>
                {opciones.map((o) => (
                  <th key={o.value} className="text-center py-2 px-1 border-b font-semibold text-[10px]">
                    {o.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preguntas.map((preg, idx) => {
                const selected = answers[scaleKey(idx)] as string | undefined;
                return (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-2 px-2 text-sm">{preg}</td>
                    {opciones.map((o) => (
                      <td key={o.value} className="text-center py-2 px-1">
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => !readOnly && onChange?.(scaleKey(idx), o.value)}
                          className={`w-5 h-5 rounded-full border-2 transition-colors ${
                            selected === o.value
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground/40 hover:border-primary/50'
                          } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Si/No question */}
      {preguntaSiNo && (
        <div className="border rounded-lg p-3 space-y-2">
          <p className="text-sm font-medium">{preguntaSiNo}</p>
          <div className="flex gap-3">
            {['Sí', 'No'].map((opt) => {
              const val = opt.toLowerCase();
              const selected = (answers[siNoKey] as string) === val;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && onChange?.(siNoKey, val)}
                  className={`px-4 py-1.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                    selected ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                  } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
