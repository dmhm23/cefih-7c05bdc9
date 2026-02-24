import { FormatoFormacion } from '@/types/formatoFormacion';
import { Matricula } from '@/types/matricula';
import { EstadoFormato } from '@/types/formato';

export function resolveFormatoEstado(
  formato: FormatoFormacion,
  matricula: Matricula
): EstadoFormato {
  if (formato.legacyComponentId === 'evaluacion_reentrenamiento') {
    return matricula.evaluacionCompletada ? 'completo' : 'borrador';
  }
  if (formato.legacyComponentId) {
    return (!matricula.autorizacionDatos || !matricula.firmaCapturada)
      ? 'borrador' : 'completo';
  }
  return 'borrador';
}
