import React from 'react';
import type { BloqueHealthConsent } from '../../types';

interface Props {
  bloque: BloqueHealthConsent;
  answers: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function BloqueHealthConsentRenderer({ bloque, answers, onChange, readOnly }: Props) {
  const questions = bloque.props?.questions || [];

  const getAnswer = (qId: string) => answers[`${bloque.id}_${qId}`] as boolean | undefined;
  const getDetail = (qId: string) => (answers[`${bloque.id}_${qId}_detalle`] as string) || '';

  const handleToggle = (qId: string, val: boolean) => {
    if (readOnly || !onChange) return;
    onChange(`${bloque.id}_${qId}`, val);
    if (!val) onChange(`${bloque.id}_${qId}_detalle`, '');
  };

  return (
    <div style={{ gridColumn: 'span 2' }} className="mt-2 space-y-2">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
        {bloque.label || 'Consentimiento de Salud'}
      </p>
      {questions.map((q) => {
        const val = getAnswer(q.id);
        return (
          <div key={q.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm flex-1">{q.label}</p>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleToggle(q.id, true)}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                    val === true
                      ? 'bg-red-100 border-red-300 text-red-700'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  Sí
                </button>
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleToggle(q.id, false)}
                  className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                    val === false
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  No
                </button>
              </div>
            </div>
            {q.hasDetail && val === true && (
              <input
                type="text"
                placeholder="Detalle..."
                value={getDetail(q.id)}
                onChange={(e) => onChange?.(`${bloque.id}_${q.id}_detalle`, e.target.value)}
                disabled={readOnly}
                className="w-full border rounded px-2 py-1 text-sm bg-background"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
