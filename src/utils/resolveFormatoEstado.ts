import type { FormatoFormacion, FormatoRespuesta, EstadoFormatoRespuesta } from '@/modules/formatos/plugins/safa';

/**
 * Resolves the display estado for a formato within a matrícula,
 * considering saved respuesta state and dependency blocking.
 */
export function resolveFormatoEstado(
  formato: FormatoFormacion,
  respuestas: FormatoRespuesta[]
): EstadoFormatoRespuesta {
  const respuesta = respuestas.find((r) => r.formatoId === formato.id);

  // If there's a saved respuesta, trust its state
  if (respuesta) {
    return respuesta.estado;
  }

  // Check precondition dependencies — if any unmet, block
  if (formato.dependencias && formato.dependencias.length > 0) {
    const precondiciones = formato.dependencias.filter(d => d.tipo === 'precondicion');
    for (const dep of precondiciones) {
      const depRespuesta = respuestas.find(r => r.formatoId === dep.formatoId);
      if (!depRespuesta || depRespuesta.estado !== dep.condicion) {
        return 'bloqueado';
      }
    }
  }

  return 'pendiente';
}

/**
 * Resolves the estadoRespuesta for display in FormatosList
 */
export function resolveFormatoEstadoRespuesta(
  formato: FormatoFormacion,
  respuestas: FormatoRespuesta[]
): EstadoFormatoRespuesta {
  return resolveFormatoEstado(formato, respuestas);
}
