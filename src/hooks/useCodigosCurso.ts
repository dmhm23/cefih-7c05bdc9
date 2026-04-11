import { useMemo } from 'react';
import { useMatriculasByCurso } from '@/hooks/useMatriculas';
import { useNivelesFormacion } from '@/hooks/useNivelesFormacion';
import { calcularCodigosCurso } from '@/utils/codigoEstudiante';
import type { Curso } from '@/types/curso';

const TIPO_TO_NIVEL: Record<string, string> = {
  reentrenamiento: 'Reentrenamiento',
  jefe_area: 'Jefe de Área',
  trabajador_autorizado: 'Trabajador Autorizado',
  coordinador_ta: 'Coordinador T.A.',
};

/**
 * Hook liviano que obtiene datos y delega el cálculo a funciones puras.
 * Retorna un mapa matriculaId → código de estudiante.
 */
export function useCodigosCurso(curso: Curso | undefined | null) {
  const cursoId = curso?.id ?? '';
  const { data: matriculas, isLoading: loadingMatriculas } = useMatriculasByCurso(cursoId);
  const { data: niveles, isLoading: loadingNiveles } = useNivelesFormacion();

  const config = useMemo(() => {
    if (!niveles || !curso) return null;
    // Resolve by UUID first, fallback by tipoFormacion name
    const nivel = curso.nivelFormacionId
      ? niveles.find(n => n.id === curso.nivelFormacionId)
      : niveles.find(n => n.nombreNivel === TIPO_TO_NIVEL[curso.tipoFormacion]);
    return nivel?.configuracionCodigoEstudiante ?? null;
  }, [niveles, curso]);

  const codigos = useMemo(() => {
    if (!matriculas || !curso) return {};
    return calcularCodigosCurso(matriculas, config, curso);
  }, [matriculas, config, curso]);

  return {
    codigos,
    isLoading: loadingMatriculas || loadingNiveles,
  };
}
