import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { BloqueDataAuthorization } from '@/types/formatoFormacion';

interface Props {
  bloque: BloqueDataAuthorization;
  answers: Record<string, unknown>;
  onChange?: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function BloqueDataAuthorizationRenderer({ bloque, answers, onChange, readOnly }: Props) {
  const key = `${bloque.id}_authorized`;
  const checked = !!answers[key];
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

      <label className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
        checked ? 'border-emerald-500 bg-emerald-50' : 'border-border'
      } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}>
        <Checkbox
          checked={checked}
          onCheckedChange={(val) => !readOnly && onChange?.(key, !!val)}
          disabled={readOnly}
        />
        <span className="text-sm font-medium">
          Acepto y autorizo el uso de mis datos personales
        </span>
      </label>
    </div>
  );
}
