import { useMemo } from 'react';
import { useMatriculasByCurso } from '@/hooks/useMatriculas';
import type { Curso } from '@/types/curso';

/**
 * Hook que devuelve un mapa matriculaId → código de estudiante.
 *
 * El código se persiste en `matriculas.codigo_estudiante` y es mantenido por
 * triggers de BD (asignación de curso, cambio de nombre del curso, cambio de
 * config del nivel). Este hook simplemente lee el valor persistido — la
 * sincronización es automática.
 *
 * Se conserva la firma original para no romper consumidores existentes.
 */
export function useCodigosCurso(curso: Curso | undefined | null) {
  const cursoId = curso?.id ?? '';
  const { data: matriculas, isLoading } = useMatriculasByCurso(cursoId);

  const codigos = useMemo(() => {
    const out: Record<string, string> = {};
    (matriculas ?? []).forEach((m) => {
      if (m.codigoEstudiante) out[m.id] = m.codigoEstudiante;
    });
    return out;
  }, [matriculas]);

  return { codigos, isLoading };
}
