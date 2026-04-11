import type { FormatoFormacion, FormatoRespuesta } from '@/types/formatoFormacion';
import { EstadoFormato } from '@/types/formato';

export function resolveFormatoEstado(
  formato: FormatoFormacion,
  respuestas: FormatoRespuesta[]
): EstadoFormato {
  const respuesta = respuestas.find((r) => r.formatoId === formato.id);
  if (!respuesta) return 'borrador'; // pendiente = borrador in UI terms
  if (respuesta.estado === 'completado') return 'completo';
  return 'borrador';
}
