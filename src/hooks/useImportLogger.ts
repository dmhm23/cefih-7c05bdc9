import { useCallback, useRef, useState, useEffect } from 'react';

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug';

export interface ImportLogEntry {
  id: number;
  level: LogLevel;
  message: string;
  meta?: Record<string, any>;
  /** ms transcurridos desde el inicio (start) */
  elapsedMs: number;
  /** timestamp absoluto (epoch ms) */
  timestamp: number;
}

export interface ImportLoggerApi {
  logs: ImportLogEntry[];
  log: (level: LogLevel, message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
  success: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
  clear: () => void;
  start: () => void;
  isActive: boolean;
  startedAt: number | null;
}

const MAX_ENTRIES = 5000;
const FLUSH_INTERVAL_MS = 100;

/**
 * Hook reutilizable para acumular logs en tiempo real durante procesos largos
 * (importaciones masivas). Usa buffer interno con throttle para no saturar React.
 */
export function useImportLogger(): ImportLoggerApi {
  const [logs, setLogs] = useState<ImportLogEntry[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const counterRef = useRef(0);
  const bufferRef = useRef<ImportLogEntry[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (bufferRef.current.length === 0) return;
    const toAppend = bufferRef.current;
    bufferRef.current = [];
    setLogs(prev => {
      const combined = prev.concat(toAppend);
      if (combined.length > MAX_ENTRIES) {
        return combined.slice(combined.length - MAX_ENTRIES);
      }
      return combined;
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      flush();
    }, FLUSH_INTERVAL_MS);
  }, [flush]);

  const log = useCallback(
    (level: LogLevel, message: string, meta?: Record<string, any>) => {
      const now = Date.now();
      if (startedAtRef.current === null) startedAtRef.current = now;
      const entry: ImportLogEntry = {
        id: ++counterRef.current,
        level,
        message,
        meta,
        elapsedMs: now - startedAtRef.current,
        timestamp: now,
      };
      bufferRef.current.push(entry);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    counterRef.current = 0;
    bufferRef.current = [];
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    setLogs([]);
  }, []);

  const clear = useCallback(() => {
    bufferRef.current = [];
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    counterRef.current = 0;
    startedAtRef.current = null;
    setLogs([]);
  }, []);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    };
  }, []);

  return {
    logs,
    log,
    info: useCallback((m, meta) => log('info', m, meta), [log]),
    success: useCallback((m, meta) => log('success', m, meta), [log]),
    warn: useCallback((m, meta) => log('warn', m, meta), [log]),
    error: useCallback((m, meta) => log('error', m, meta), [log]),
    debug: useCallback((m, meta) => log('debug', m, meta), [log]),
    clear,
    start,
    isActive: startedAtRef.current !== null,
    startedAt: startedAtRef.current,
  };
}

/** Formatea ms como mm:ss.SSS para mostrar en el panel. */
export function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mm = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const ss = (totalSec % 60).toString().padStart(2, '0');
  const milli = (ms % 1000).toString().padStart(3, '0');
  return `${mm}:${ss}.${milli}`;
}

/** Convierte logs a texto plano (para copiar/descargar). */
export function logsToText(logs: ImportLogEntry[]): string {
  return logs
    .map(l => {
      const lvl = l.level.toUpperCase().padEnd(7, ' ');
      const meta = l.meta && Object.keys(l.meta).length ? ` ${JSON.stringify(l.meta)}` : '';
      return `[${formatElapsed(l.elapsedMs)}] ${lvl} ${l.message}${meta}`;
    })
    .join('\n');
}
