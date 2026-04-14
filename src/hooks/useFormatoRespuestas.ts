import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatoRespuestaService } from '@/services/formatoRespuestaService';

const KEY = ['formato-respuestas'];

export function useFormatoRespuestas(matriculaId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, matriculaId],
    queryFn: () => formatoRespuestaService.getByMatricula(matriculaId!),
    enabled: !!matriculaId,
  });
}

export function useFormatoRespuesta(matriculaId: string | undefined, formatoId: string | undefined) {
  return useQuery({
    queryKey: [...KEY, matriculaId, formatoId],
    queryFn: () => formatoRespuestaService.getByMatriculaAndFormato(matriculaId!, formatoId!),
    enabled: !!matriculaId && !!formatoId,
  });
}

export function useSaveFormatoRespuesta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      matriculaId,
      formatoId,
      answers,
      estado,
    }: {
      matriculaId: string;
      formatoId: string;
      answers: Record<string, unknown>;
      estado?: 'pendiente' | 'completado';
    }) => formatoRespuestaService.upsert(matriculaId, formatoId, answers, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useReopenFormatoRespuesta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ respuestaId, userId }: { respuestaId: string; userId: string }) =>
      formatoRespuestaService.reopen(respuestaId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
