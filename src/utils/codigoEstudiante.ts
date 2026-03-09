import { ConfiguracionCodigoEstudiante } from '@/types/nivelFormacion';
import { Curso } from '@/types/curso';

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
    const anio = new Date(curso.fechaInicio).getFullYear().toString().slice(-2);
    parts.push(anio);
  }

  if (config.usarMesCurso) {
    const mes = String(new Date(curso.fechaInicio).getMonth() + 1).padStart(2, '0');
    parts.push(mes);
  }

  if (config.usarConsecutivoCursoMes) {
    const consec = consecutivoCursoMes ?? parseInt(curso.numeroCurso) || 1;
    parts.push(String(consec).padStart(2, '0'));
  }

  const consecutivo = String(indexEstudiante + 1).padStart(config.longitudConsecutivoEstudiante, '0');
  parts.push(consecutivo);

  return parts.join(sep);
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
