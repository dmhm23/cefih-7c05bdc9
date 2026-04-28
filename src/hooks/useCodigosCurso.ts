import { useMemo } from 'react';
import { useMatriculasByCurso } from '@/hooks/useMatriculas';
import { useNivelesFormacion } from '@/hooks/useNivelesFormacion';
import { calcularCodigosCurso } from '@/utils/codigoEstudiante';
import type { Curso } from '@/types/curso';

/**
 * Hook que devuelve un mapa matriculaId → código de estudiante.
 *
 * FUENTE DE VERDAD: `matriculas.codigo_estudiante` persistido en BD,
 * sincronizado por triggers (`recalcular_codigos_curso`) ante cualquier
 * cambio relevante (asignación, reasignación, soft-delete, cambio de nombre
 * o fecha de curso, cambio de configuración del nivel).
 *
 * Fallback en memoria: solo si una matrícula no tiene código persistido
 * (ej: race condition durante una asignación recién hecha) se calcula
 * localmente con la misma fórmula que usa la función de BD.
 */
export function useCodigosCurso(curso: Curso | undefined | null) {
  const cursoId = curso?.id ?? '';
  const { data: matriculas, isLoading } = useMatriculasByCurso(cursoId);
  const { data: niveles = [] } = useNivelesFormacion();

  const codigos = useMemo(() => {
    if (!curso || !matriculas || matriculas.length === 0) return {};

    const out: Record<string, string> = {};

    // 1) Fuente de verdad: lo persistido en BD
    matriculas.forEach((m) => {
      if (m.codigoEstudiante) out[m.id] = m.codigoEstudiante;
    });

    // 2) Fallback en memoria solo para los que aún no tienen código persistido
    const faltantes = matriculas.filter((m) => !out[m.id]);
    if (faltantes.length > 0) {
      const nivel = curso.nivelFormacionId
        ? niveles.find((n) => n.id === curso.nivelFormacionId)
        : undefined;
      const config = nivel?.configuracionCodigoEstudiante;

      if (config?.activo) {
        const calculados = calcularCodigosCurso(
          matriculas.map((m) => ({ id: m.id, createdAt: m.createdAt })),
          config,
          curso,
        );
        faltantes.forEach((m) => {
          if (calculados[m.id]) out[m.id] = calculados[m.id];
        });
      }
    }

    return out;
  }, [curso, matriculas, niveles]);

  return { codigos, isLoading };
}
