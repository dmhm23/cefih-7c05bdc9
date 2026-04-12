import { format, type Locale } from "date-fns";

/**
 * Convert a Date object to YYYY-MM-DD string using LOCAL time (not UTC).
 * Prevents timezone-related day shifts (e.g. Colombia is UTC-5).
 */
export function dateToLocalString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parse a YYYY-MM-DD string into a local Date (no UTC shift).
 */
export function parseLocalDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  const date = new Date(y, m - 1, d);
  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Get today's date as YYYY-MM-DD in local time.
 */
export function todayLocalString(): string {
  return dateToLocalString(new Date());
}

/**
 * Format a YYYY-MM-DD date string using local parsing (no UTC shift).
 * Safe for date-only columns from the database.
 */
export function fmtDateLocal(
  dateStr: string | undefined | null,
  formatStr: string = "dd/MM/yyyy",
  locale?: Locale
): string {
  if (!dateStr) return "—";
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return format(d, formatStr, locale ? { locale } : undefined);
}
