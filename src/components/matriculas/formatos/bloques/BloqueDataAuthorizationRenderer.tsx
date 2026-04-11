import React from 'react';
import type { BloqueDataAuthorization } from '@/types/formatoFormacion';

interface Props {
  bloque: BloqueDataAuthorization;
  answers: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function BloqueDataAuthorizationRenderer({ bloque, answers, onChange, readOnly }: Props) {
  const key = `${bloque.id}_authorized`;
  const value = answers[key] as string | undefined;
  const items = bloque.props?.summaryItems || [];

  return (
    <div style={{ gridColumn: 'span 2' }} className="mt-2 space-y-3">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
        {bloque.label || 'Autorización de Datos'}
      </p>

      {items.length > 0 && (
        <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground pl-2">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}

      {bloque.props?.fullText && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer underline">Ver texto completo</summary>
          <p className="mt-2 whitespace-pre-wrap">{bloque.props.fullText}</p>
        </details>
      )}

      <div className="flex gap-4">
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
          value === 'acepto' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-border'
        } ${readOnly ? 'cursor-default' : ''}`}>
          <input
            type="radio"
            name={key}
            checked={value === 'acepto'}
            onChange={() => !readOnly && onChange?.(key, 'acepto')}
            disabled={readOnly}
            className="sr-only"
          />
          <span className="text-sm font-medium">Acepto</span>
        </label>
        <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
          value === 'no_acepto' ? 'border-red-500 bg-red-50 text-red-700' : 'border-border'
        } ${readOnly ? 'cursor-default' : ''}`}>
          <input
            type="radio"
            name={key}
            checked={value === 'no_acepto'}
            onChange={() => !readOnly && onChange?.(key, 'no_acepto')}
            disabled={readOnly}
            className="sr-only"
          />
          <span className="text-sm font-medium">No acepto</span>
        </label>
      </div>
    </div>
  );
}
