/**
 * Utilidad pura para reconstruir un intento de evaluación enriquecido (schema v2)
 * a partir de un `formato_respuestas` legacy que solo tiene `answers` (sin
 * `intentos_evaluacion`).
 *
 * Reglas de seguridad:
 *  - Solo opera sobre formatos cuya definición actual de quiz coincide con las
 *    keys presentes en `answers`. Si no coincide, devuelve `null` (no inventa).
 *  - Es una función pura: no toca BD ni storage.
 */
import type { Bloque, BloqueEvaluationQuiz, FormatoFormacion } from '../types';

export interface ReconstruirInput {
  formatoFuente: Pick<FormatoFormacion, 'id' | 'bloques'>;
  answers: Record<string, unknown>;
  completadoAt?: string | null;
}

export interface IntentoSinteticoV2 {
  timestamp: string;
  schema_version: 2;
  reconstruido: true;
  resultados: Record<
    string,
    {
      puntaje: number;
      correctas: number;
      total: number;
      aprobado: boolean;
      preguntas: {
        id: number;
        texto: string;
        opciones: string[];
        correcta: number;
        respondida: number | null;
        esCorrecta: boolean;
      }[];
    }
  >;
}

const QUIZ_KEY_RE = /^.+_q(\d+)$/;

export function reconstruirIntentoLegacy(input: ReconstruirInput): IntentoSinteticoV2 | null {
  const { formatoFuente, answers, completadoAt } = input;

  const quizBlocks = (formatoFuente.bloques || []).filter(
    (b: Bloque) => b.type === 'evaluation_quiz',
  ) as BloqueEvaluationQuiz[];

  if (quizBlocks.length === 0) return null;

  // Detectar al menos una key con prefijo de quiz que coincida con un bloque actual
  const answerKeys = Object.keys(answers || {});
  const hasQuizKeys = answerKeys.some((k) => {
    const m = k.match(QUIZ_KEY_RE);
    if (!m) return false;
    const blockId = k.slice(0, -m[0].length + m[1].length).replace(/_q\d+$/, '');
    return quizBlocks.some((qb) => qb.id === blockId);
  });
  if (!hasQuizKeys) return null;

  const resultados: IntentoSinteticoV2['resultados'] = {};
  let alMenosUnoReconstruido = false;

  for (const qb of quizBlocks) {
    const umbral = qb.props?.umbralAprobacion ?? 70;
    const preguntasDef = qb.props?.preguntas || [];
    if (preguntasDef.length === 0) continue;

    const preguntasReconstruidas = preguntasDef.map((preg) => {
      const ansKey = `${qb.id}_q${preg.id}`;
      const respondidaRaw = answers[ansKey];
      const respondida =
        typeof respondidaRaw === 'number' ? respondidaRaw : respondidaRaw == null ? null : Number(respondidaRaw);
      const esCorrecta = respondida !== null && !Number.isNaN(respondida) && respondida === preg.correcta;
      return {
        id: preg.id,
        texto: preg.texto,
        opciones: [...preg.opciones],
        correcta: preg.correcta,
        respondida: respondida === null || Number.isNaN(respondida) ? null : respondida,
        esCorrecta,
      };
    });

    // Solo registrar el bloque si al menos una pregunta tiene respuesta válida
    const algunaRespondida = preguntasReconstruidas.some((p) => p.respondida !== null);
    if (!algunaRespondida) continue;

    const correctas = preguntasReconstruidas.filter((p) => p.esCorrecta).length;
    const total = preguntasReconstruidas.length;
    const puntaje = total > 0 ? Math.round((correctas / total) * 100) : 0;
    const aprobado = puntaje >= umbral;

    resultados[qb.id] = {
      puntaje,
      correctas,
      total,
      aprobado,
      preguntas: preguntasReconstruidas,
    };
    alMenosUnoReconstruido = true;
  }

  if (!alMenosUnoReconstruido) return null;

  return {
    timestamp: completadoAt || new Date().toISOString(),
    schema_version: 2,
    reconstruido: true,
    resultados,
  };
}
