import { useMemo } from 'react';
import { useMatriculasByCurso } from '@/hooks/useMatriculas';
import { useNivelesFormacion } from '@/hooks/useNivelesFormacion';
import { calcularCodigosCurso } from '@/utils/codigoEstudiante';
import type { Curso } from '@/types/curso';

/**
 * Hook que devuelve un mapa matriculaId → código de estudiante.
 *
 * NOTA TEMPORAL: La sincronización automática del código vía triggers de BD
 * está desactivada (ver migración 2026-04-23). Mientras se refactoriza la
 * lógica desde la raíz, calculamos el código en memoria a partir del orden
 * cronológico de las matrículas del curso, replicando el comportamiento
 * previo a la sincronización.
 *
 * Fallback: si una matrícula tiene `codigoEstudiante` persistido y el nivel
 * no expone configuración activa, se devuelve el valor persistido tal cual.
 */
export function useCodigosCurso(curso: Curso | undefined | null) {
  const cursoId = curso?.id ?? '';
  const { data: matriculas, isLoading } = useMatriculasByCurso(cursoId);
  const { data: niveles = [] } = useNivelesFormacion();

  const codigos = useMemo(() => {
    if (!curso || !matriculas || matriculas.length === 0) return {};

    const nivel = curso.nivelFormacionId
      ? niveles.find((n) => n.id === curso.nivelFormacionId)
      : undefined;
    const config = nivel?.configuracionCodigoEstudiante;

    // Cálculo en memoria (fuente de verdad mientras la sincronización está dormida)
    const calculados = calcularCodigosCurso(
      matriculas.map((m) => ({ id: m.id, createdAt: m.createdAt })),
      config,
      curso,
    );

    // Fallback: completar con valores persistidos cuando el cálculo no aplique
    const out: Record<string, string> = { ...calculados };
    matriculas.forEach((m) => {
      if (!out[m.id] && m.codigoEstudiante) {
        out[m.id] = m.codigoEstudiante;
      }
    });
    return out;
  }, [curso, matriculas, niveles]);

  return { codigos, isLoading };
}
