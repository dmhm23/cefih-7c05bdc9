/**
 * Renderer del bloque `evaluation_summary`.
 *
 * Lee `respuestasPrevias` del contexto y muestra el resumen del último intento
 * de la evaluación enlazada (`formatoEvaluacionId`). Soporta:
 *  - Schema v2 (con `preguntas[]` por intento) → tabla detallada con ✓/✗.
 *  - Schema v1 legacy (solo cabecera) → solo puntaje + leyenda.
 *  - Reconstrucción perezosa si el `formato_respuestas` está completado pero
 *    `intentos_evaluacion` está vacío.
 *
 * Funciona tanto para el portal del estudiante como para el documento PDF.
 * El componente no lanza excepciones: si algo falla, cae al modo placeholder.
 */
import { useMemo, useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ChevronDown, ClipboardCheck, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { BloqueEvaluationSummary, FormatoRespuesta } from '../../types';
import { reconstruirIntentoLegacy } from '../../utils/reconstruirIntentoLegacy';
import { useFormato } from '@/hooks/useFormatosFormacion';
import { useSaveFormatoRespuesta } from '@/hooks/useFormatoRespuestas';
import { format as fmtDate } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  bloque: BloqueEvaluationSummary;
  respuestasPrevias?: FormatoRespuesta[];
  matriculaId?: string;
}

interface IntentoNormalizado {
  timestamp: string;
  schemaVersion: 1 | 2;
  reconstruido?: boolean;
  // Agregados por bloque (puede haber varios quizzes en un mismo formato)
  bloques: {
    bloqueId: string;
    puntaje: number;
    correctas: number;
    total: number;
    aprobado: boolean;
    preguntas?: {
      id: number;
      texto: string;
      opciones: string[];
      correcta: number;
      respondida: number | null;
      esCorrecta: boolean;
    }[];
  }[];
}

function normalizarIntento(raw: any): IntentoNormalizado | null {
  if (!raw || typeof raw !== 'object') return null;
  const timestamp: string = raw.timestamp || new Date().toISOString();
  const schemaVersion: 1 | 2 = raw.schema_version === 2 ? 2 : 1;
  const reconstruido: boolean = raw.reconstruido === true;
  const resultados = raw.resultados || {};
  const bloques: IntentoNormalizado['bloques'] = [];
  for (const [bloqueId, val] of Object.entries(resultados as Record<string, any>)) {
    if (!val) continue;
    bloques.push({
      bloqueId,
      puntaje: Number(val.puntaje ?? 0),
      correctas: Number(val.correctas ?? 0),
      total: Number(val.total ?? 0),
      aprobado: !!val.aprobado,
      preguntas: Array.isArray(val.preguntas) ? val.preguntas : undefined,
    });
  }
  if (bloques.length === 0) return null;
  return { timestamp, schemaVersion, reconstruido, bloques };
}

function agregadoIntento(intento: IntentoNormalizado) {
  let correctas = 0;
  let total = 0;
  for (const b of intento.bloques) {
    correctas += b.correctas;
    total += b.total;
  }
  const puntaje = total > 0 ? Math.round((correctas / total) * 100) : 0;
  // Aprobado: todos los bloques aprobados
  const aprobado = intento.bloques.every((b) => b.aprobado);
  return { puntaje, correctas, total, aprobado };
}

export default function BloqueEvaluationSummaryRenderer({
  bloque,
  respuestasPrevias,
  matriculaId,
}: Props) {
  const formatoEvaluacionId = bloque.props?.formatoEvaluacionId;
  const mostrarHistorial = bloque.props?.mostrarHistorial !== false;
  const mostrarDetalle = bloque.props?.mostrarDetallePreguntas !== false;

  // Buscar la respuesta del formato evaluación referenciado
  const respuestaEval = useMemo(() => {
    if (!formatoEvaluacionId || !respuestasPrevias) return null;
    return respuestasPrevias.find((r) => r.formatoId === formatoEvaluacionId) || null;
  }, [formatoEvaluacionId, respuestasPrevias]);

  const intentosRaw = (respuestaEval?.intentosEvaluacion || []) as any[];

  // Cargar formato fuente si necesitamos reconstruir o validar coherencia
  const necesitaReconstruccion =
    !!respuestaEval &&
    respuestaEval.estado === 'completado' &&
    intentosRaw.length === 0 &&
    !!formatoEvaluacionId;

  const { data: formatoFuente } = useFormato(necesitaReconstruccion ? formatoEvaluacionId : undefined);
  const saveRespuestaMutation = useSaveFormatoRespuesta();
  const reconstruccionDisparada = useRef(false);

  // Reconstrucción perezosa: solo se dispara una vez por sesión y solo persiste si tiene éxito
  useEffect(() => {
    if (!necesitaReconstruccion || !formatoFuente || !respuestaEval || !matriculaId) return;
    if (reconstruccionDisparada.current) return;
    reconstruccionDisparada.current = true;

    try {
      const intento = reconstruirIntentoLegacy({
        formatoFuente: { id: formatoFuente.id, bloques: formatoFuente.bloques },
        answers: respuestaEval.answers || {},
        completadoAt: respuestaEval.completadoAt,
      });
      if (!intento) return;
      // Persistir SOLO el nuevo intento. No tocar `answers`.
      saveRespuestaMutation.mutate({
        matriculaId,
        formatoId: formatoEvaluacionId!,
        answers: respuestaEval.answers || {},
        estado: 'completado',
        intentosEvaluacion: [intento as unknown as Record<string, unknown>],
      });
    } catch (err) {
      // Silencioso: caemos al modo placeholder
      console.warn('[evaluation_summary] reconstrucción legacy fallida', err);
    }
  }, [necesitaReconstruccion, formatoFuente, respuestaEval, matriculaId, formatoEvaluacionId, saveRespuestaMutation]);

  // Construir array normalizado (incluye el reconstruido sintético si lo tenemos en memoria pero aún no persistido)
  const intentos = useMemo<IntentoNormalizado[]>(() => {
    const list: IntentoNormalizado[] = [];
    for (const it of intentosRaw) {
      const n = normalizarIntento(it);
      if (n) list.push(n);
    }
    // Si necesitamos reconstrucción y ya tenemos el formato fuente, intentar reconstruir on-the-fly para esta render
    if (list.length === 0 && necesitaReconstruccion && formatoFuente && respuestaEval) {
      try {
        const intento = reconstruirIntentoLegacy({
          formatoFuente: { id: formatoFuente.id, bloques: formatoFuente.bloques },
          answers: respuestaEval.answers || {},
          completadoAt: respuestaEval.completadoAt,
        });
        if (intento) {
          const n = normalizarIntento(intento);
          if (n) list.push(n);
        }
      } catch {
        // ignorar
      }
    }
    return list;
  }, [intentosRaw, necesitaReconstruccion, formatoFuente, respuestaEval]);

  const ultimo = intentos.length > 0 ? intentos[intentos.length - 1] : null;
  const previos = intentos.length > 1 ? intentos.slice(0, -1) : [];

  // -------------------------------------------------------------------------
  // Estados visuales: sin enlace, sin respuesta, sin intentos, normal
  // -------------------------------------------------------------------------

  const titulo = bloque.label || 'Resumen de evaluación';

  if (!formatoEvaluacionId) {
    return (
      <div style={{ gridColumn: 'span 2' }} className="mt-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0" />
          <span>{titulo}: no hay evaluación enlazada. Configure el bloque desde el editor.</span>
        </div>
      </div>
    );
  }

  if (!respuestaEval || !ultimo) {
    return (
      <div style={{ gridColumn: 'span 2' }} className="mt-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardCheck className="h-4 w-4 shrink-0" />
          <span>{titulo}: pendiente de evaluación.</span>
        </div>
      </div>
    );
  }

  const agg = agregadoIntento(ultimo);
  const aprobado = agg.aprobado;
  const fechaIntento = (() => {
    try {
      return fmtDate(new Date(ultimo.timestamp), "d/MM/yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return ultimo.timestamp;
    }
  })();
  const tieneDetalle = ultimo.bloques.some((b) => Array.isArray(b.preguntas) && b.preguntas.length > 0);

  return (
    <div style={{ gridColumn: 'span 2' }} className="mt-3 space-y-3">
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-semibold">
        {titulo}
      </p>

      {/* Cabecera de resultado vigente */}
      <div
        className={`rounded-lg border-2 p-4 ${
          aprobado
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-red-500 bg-red-50'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                className={`text-[10px] ${
                  aprobado
                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                    : 'bg-red-600 hover:bg-red-600 text-white'
                }`}
              >
                {aprobado ? 'APROBADO' : 'NO APROBADO'}
              </Badge>
              <span className="text-2xl font-bold">{agg.puntaje}%</span>
              <span className="text-sm text-muted-foreground">
                · {agg.correctas} de {agg.total} correctas
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Intento del {fechaIntento}</p>
          </div>
          {ultimo.reconstruido && (
            <Badge variant="outline" className="text-[9px] border-amber-400 text-amber-700 bg-amber-50">
              Reconstruido
            </Badge>
          )}
        </div>
      </div>

      {/* Detalle por pregunta — solo si v2 y mostrarDetalle */}
      {mostrarDetalle && tieneDetalle && (
        <div className="space-y-3">
          {ultimo.bloques.map((b) => {
            if (!b.preguntas || b.preguntas.length === 0) return null;
            return (
              <div key={b.bloqueId} className="rounded-lg border bg-background overflow-hidden">
                <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Detalle de respuestas — {b.correctas}/{b.total}
                </div>
                <div className="divide-y">
                  {b.preguntas.map((p, idx) => (
                    <div key={p.id} className="px-3 py-2 space-y-1">
                      <div className="flex items-start gap-2">
                        {p.esCorrecta ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm font-medium flex-1">
                          {idx + 1}. {p.texto || 'Pregunta sin texto'}
                        </p>
                      </div>
                      <div className="pl-6 text-xs space-y-0.5">
                        <p className="text-muted-foreground">
                          Respondió:{' '}
                          <span className={p.esCorrecta ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>
                            {p.respondida !== null && p.opciones[p.respondida] != null
                              ? p.opciones[p.respondida]
                              : '— sin responder —'}
                          </span>
                        </p>
                        {!p.esCorrecta && (
                          <p className="text-muted-foreground">
                            Correcta:{' '}
                            <span className="text-emerald-700 font-medium">
                              {p.opciones[p.correcta] ?? '—'}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mensaje legacy si no hay detalle disponible */}
      {mostrarDetalle && !tieneDetalle && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs text-amber-800">
            Detalle de preguntas no disponible para este intento (registrado antes de la versión enriquecida).
          </p>
        </div>
      )}

      {/* Historial de intentos */}
      {mostrarHistorial && previos.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>Historial de intentos ({previos.length} previo{previos.length !== 1 ? 's' : ''})</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 rounded-lg border bg-background overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Fecha</th>
                    <th className="text-left px-3 py-2 font-semibold">Puntaje</th>
                    <th className="text-left px-3 py-2 font-semibold">Correctas</th>
                    <th className="text-left px-3 py-2 font-semibold">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {previos.map((it, idx) => {
                    const a = agregadoIntento(it);
                    let fecha = it.timestamp;
                    try {
                      fecha = fmtDate(new Date(it.timestamp), 'd/MM/yyyy HH:mm', { locale: es });
                    } catch {
                      // ignore
                    }
                    return (
                      <tr key={idx}>
                        <td className="px-3 py-2">{fecha}</td>
                        <td className="px-3 py-2 font-medium">{a.puntaje}%</td>
                        <td className="px-3 py-2">{a.correctas}/{a.total}</td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${
                              a.aprobado
                                ? 'border-emerald-500 text-emerald-700'
                                : 'border-red-500 text-red-700'
                            }`}
                          >
                            {a.aprobado ? 'APROBADO' : 'NO APROBADO'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
