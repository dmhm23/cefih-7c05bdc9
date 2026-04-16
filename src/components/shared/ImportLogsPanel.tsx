import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Bug,
  Copy,
  Check,
  Download,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ImportLogEntry, LogLevel, formatElapsed, logsToText } from '@/hooks/useImportLogger';
import { cn } from '@/lib/utils';

interface ImportLogsPanelProps {
  logs: ImportLogEntry[];
  title?: string;
  /** Altura del panel scrolleable (px). Default 180. */
  height?: number;
}

const LEVEL_META: Record<LogLevel, { icon: any; color: string; label: string }> = {
  info: { icon: Info, color: 'text-sky-400', label: 'Info' },
  success: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Éxito' },
  warn: { icon: AlertTriangle, color: 'text-amber-400', label: 'Aviso' },
  error: { icon: AlertCircle, color: 'text-red-400', label: 'Error' },
  debug: { icon: Bug, color: 'text-slate-400', label: 'Debug' },
};

const ALL_LEVELS: LogLevel[] = ['info', 'success', 'warn', 'error', 'debug'];

/**
 * Panel terminal-like para visualizar logs en tiempo real durante importaciones.
 * Auto-scroll mientras el usuario está al final; se pausa si hace scroll arriba.
 */
export function ImportLogsPanel({ logs, title = 'Logs detallados', height = 180 }: ImportLogsPanelProps) {
  const [enabled, setEnabled] = useState<Set<LogLevel>>(new Set(ALL_LEVELS));
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => logs.filter(l => enabled.has(l.level)),
    [logs, enabled],
  );

  // Auto-scroll al fondo cuando llegan nuevos logs (si autoScroll activo)
  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [filtered.length, autoScroll]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    setAutoScroll(atBottom);
  };

  const toggleLevel = (level: LogLevel) => {
    setEnabled(prev => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(logsToText(logs));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const blob = new Blob([logsToText(logs)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `import-log-${ts}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    setAutoScroll(true);
  };

  return (
    <div className="border-t border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-6 py-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <span>{title}</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono tabular-nums">
            {filtered.length}{filtered.length !== logs.length ? `/${logs.length}` : ''}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs">
                <Filter className="h-3.5 w-3.5" />
                Filtro
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Niveles visibles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_LEVELS.map(lvl => {
                const M = LEVEL_META[lvl];
                const Icon = M.icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={lvl}
                    checked={enabled.has(lvl)}
                    onCheckedChange={() => toggleLevel(lvl)}
                    className="text-xs"
                  >
                    <Icon className={cn('h-3.5 w-3.5 mr-1.5', M.color)} />
                    {M.label}
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1 text-xs"
            onClick={handleCopy}
            disabled={logs.length === 0}
            title="Copiar todo el log"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 gap-1 text-xs"
            onClick={handleDownload}
            disabled={logs.length === 0}
            title="Descargar log como .txt"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          {!autoScroll && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 gap-1 text-xs text-primary"
              onClick={scrollToBottom}
              title="Ir al final"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Logs */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-auto bg-slate-950 px-4 py-2 font-mono text-[11px] leading-relaxed"
        style={{ height }}
      >
        {filtered.length === 0 ? (
          <div className="text-slate-500 italic py-2">Esperando actividad…</div>
        ) : (
          filtered.map(entry => {
            const M = LEVEL_META[entry.level];
            const Icon = M.icon;
            return (
              <div key={entry.id} className="flex items-start gap-2 py-0.5">
                <span className="text-slate-500 shrink-0 tabular-nums">
                  [{formatElapsed(entry.elapsedMs)}]
                </span>
                <Icon className={cn('h-3 w-3 mt-0.5 shrink-0', M.color)} />
                <span className={cn('shrink-0 uppercase tracking-wider text-[10px] mt-px', M.color)}>
                  {entry.level.padEnd(7, ' ')}
                </span>
                <span className="text-slate-200 break-words whitespace-pre-wrap">
                  {entry.message}
                  {entry.meta && Object.keys(entry.meta).length > 0 && (
                    <span className="text-slate-500 ml-2">
                      {JSON.stringify(entry.meta)}
                    </span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
