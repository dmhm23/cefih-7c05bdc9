import { ConfiguracionCodigoEstudiante } from '@/types/nivelFormacion';
import { Curso } from '@/types/curso';
import { parseLocalDate } from '@/utils/dateUtils';

interface CodigoParams {
  config: ConfiguracionCodigoEstudiante;
  curso: Curso;
  indexEstudiante: number;
  consecutivoCursoMes?: number;
}

export function generarCodigoEstudiante({ config, curso, indexEstudiante, consecutivoCursoMes }: CodigoParams): string {
  const sep = config.separadorCodigo;
  const parts: string[] = [config.prefijoCodigo, config.codigoTipoFormacion];

  if (config.usarAnioCurso) {
    const d = parseLocalDate(curso.fechaInicio) ?? new Date(curso.fechaInicio);
    const anio = d.getFullYear().toString().slice(-2);
    parts.push(anio);
  }

  if (config.usarMesCurso) {
    const d = parseLocalDate(curso.fechaInicio) ?? new Date(curso.fechaInicio);
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    parts.push(mes);
  }

  if (config.usarConsecutivoCursoMes) {
    // Extrae el último segmento numérico del nombre del curso (ej: "FIH-R-26-04-25" → 25).
    // parseInt sobre el string completo retorna NaN porque empieza con letras.
    let consec = consecutivoCursoMes;
    if (consec === undefined || consec === null) {
      const fuente = curso.nombre || curso.numeroCurso || '';
      const match = fuente.match(/(\d+)(?!.*\d)/); // último grupo numérico
      consec = match ? parseInt(match[1], 10) : 1;
      if (!Number.isFinite(consec) || consec <= 0) consec = 1;
    }
    parts.push(String(consec).padStart(2, '0'));
  }

  const consecutivo = String(indexEstudiante + 1).padStart(config.longitudConsecutivoEstudiante, '0');
  parts.push(consecutivo);

  return parts.join(sep);
}

/**
 * Calcula los códigos de todos los estudiantes de un curso.
 * Fuente de verdad centralizada: ordena por created_at ASC, desempate id ASC.
 * Retorna Record<matriculaId, código>.
 */
export function calcularCodigosCurso(
  matriculas: { id: string; createdAt: string }[],
  config: ConfiguracionCodigoEstudiante | undefined | null,
  curso: Curso,
  consecutivoCursoMes?: number
): Record<string, string> {
  if (!config || !config.activo) return {};

  const ordenadas = [...matriculas].sort((a, b) => {
    const cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
  });

  const result: Record<string, string> = {};
  ordenadas.forEach((m, idx) => {
    result[m.id] = generarCodigoEstudiante({ config, curso, indexEstudiante: idx, consecutivoCursoMes });
  });
  return result;
}

/**
 * Resuelve el código de un estudiante dado el mapa precalculado.
 */
export function resolverCodigoEstudiante(
  matriculaId: string,
  mapa: Record<string, string>
): string | null {
  return mapa[matriculaId] ?? null;
}

export function generarPreviewCodigo(config: ConfiguracionCodigoEstudiante): string {
  const sep = config.separadorCodigo;
  const parts: string[] = [config.prefijoCodigo || '???', config.codigoTipoFormacion || '?'];

  if (config.usarAnioCurso) {
    parts.push('26');
  }

  if (config.usarMesCurso) {
    parts.push('01');
  }

  if (config.usarConsecutivoCursoMes) {
    parts.push('01');
  }

  const consecutivo = '1'.padStart(config.longitudConsecutivoEstudiante, '0');
  parts.push(consecutivo);

  return parts.join(sep || '-');
}
