import { useState, useEffect, useRef, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BirthDateInputProps {
  /** Valor en formato ISO YYYY-MM-DD (o vacío) */
  value: string;
  /** Emite siempre YYYY-MM-DD (o "" si no hay fecha completa válida) */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  /** Año mínimo aceptado (por defecto 1900) */
  minYear?: number;
  /** Año máximo aceptado (por defecto año actual − 10) */
  maxYear?: number;
  onBlur?: () => void;
}

const MIN_YEAR_DEFAULT = 1900;
const MAX_YEAR_DEFAULT = new Date().getFullYear() - 10;

/** Convierte YYYY-MM-DD → dd/mm/aaaa para mostrar */
function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/** Toma cualquier string y devuelve solo dígitos hasta 8 */
function digitsOnly(s: string, max = 8): string {
  return s.replace(/\D/g, "").slice(0, max);
}

/** Formatea dígitos puros como dd/mm/aaaa progresivamente */
function formatDigits(d: string): string {
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Normaliza un texto pegado (acepta varios formatos) a dd/mm/aaaa */
function normalizePastedToDisplay(raw: string): string {
  const trimmed = raw.trim();
  // ISO YYYY-MM-DD
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
  if (m) {
    const [, y, mo, d] = m;
    return `${d.padStart(2, "0")}/${mo.padStart(2, "0")}/${y}`;
  }
  // dd/mm/yyyy o dd-mm-yyyy
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(trimmed);
  if (m) {
    const [, d, mo, y] = m;
    return `${d.padStart(2, "0")}/${mo.padStart(2, "0")}/${y}`;
  }
  // Fallback: extraer dígitos y reformatear
  return formatDigits(digitsOnly(trimmed));
}

/** Valida una fecha dd/mm/aaaa real. Devuelve {iso, error}. */
function validate(
  display: string,
  minYear: number,
  maxYear: number,
): { iso: string; error: string | null } {
  if (!display) return { iso: "", error: null };
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display);
  if (!m) return { iso: "", error: "Formato inválido (dd/mm/aaaa)" };
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  if (year < minYear) return { iso: "", error: `Año mínimo permitido: ${minYear}` };
  if (year > maxYear) return { iso: "", error: `Año máximo permitido: ${maxYear}` };
  if (month < 1 || month > 12) return { iso: "", error: "Mes inválido" };
  // Construir fecha y verificar consistencia (rebote por bisiesto, etc.)
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { iso: "", error: "Fecha inválida" };
  }
  // No futura
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return { iso: "", error: "La fecha no puede ser futura" };
  const iso = `${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  return { iso, error: null };
}

export const BirthDateInput = forwardRef<HTMLInputElement, BirthDateInputProps>(
  function BirthDateInput(
    {
      value,
      onChange,
      placeholder = "dd/mm/aaaa",
      className,
      disabled,
      id,
      minYear = MIN_YEAR_DEFAULT,
      maxYear = MAX_YEAR_DEFAULT,
      onBlur,
    },
    ref,
  ) {
    const [display, setDisplay] = useState<string>(() => isoToDisplay(value));
    const [localError, setLocalError] = useState<string | null>(null);
    const lastEmittedRef = useRef<string>(value);

    // Sincronizar cuando cambia el value externo (edición / reset de form)
    useEffect(() => {
      if (value !== lastEmittedRef.current) {
        setDisplay(isoToDisplay(value));
        setLocalError(null);
        lastEmittedRef.current = value;
      }
    }, [value]);

    const emitIfNeeded = (next: string) => {
      if (next !== lastEmittedRef.current) {
        lastEmittedRef.current = next;
        onChange(next);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Si parece pegado o contiene separadores raros, normalizar.
      const hasOddSeparators = /[-]/.test(raw) || /\/\d{4}$/.test(raw);
      const next = hasOddSeparators
        ? normalizePastedToDisplay(raw)
        : formatDigits(digitsOnly(raw));
      setDisplay(next);
      setLocalError(null);
      // Emitir vacío mientras no esté completa (mantiene UX limpia)
      const { iso } = validate(next, minYear, maxYear);
      emitIfNeeded(iso);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const raw = e.clipboardData.getData("text");
      const next = normalizePastedToDisplay(raw);
      setDisplay(next);
      const { iso } = validate(next, minYear, maxYear);
      emitIfNeeded(iso);
    };

    const handleBlur = () => {
      const { iso, error } = validate(display, minYear, maxYear);
      setLocalError(error);
      emitIfNeeded(iso);
      onBlur?.();
    };

    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          id={id}
          inputMode="numeric"
          autoComplete="bday"
          value={display}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className={cn(
            localError && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          aria-invalid={!!localError}
        />
        {localError && (
          <p className="text-xs text-destructive">{localError}</p>
        )}
      </div>
    );
  },
);
