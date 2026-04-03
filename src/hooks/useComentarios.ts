import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { comentarioService } from '@/services/comentarioService';
import { SeccionComentario } from '@/types/comentario';

export function useComentarios(entidadId: string, seccion: SeccionComentario) {
  return useQuery({
    queryKey: ['comentarios', entidadId, seccion],
    queryFn: () => comentarioService.getByEntidadSeccion(entidadId, seccion),
  });
}

export function useCreateComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: comentarioService.create,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['comentarios', data.entidadId, data.seccion] });
    },
  });
}

export function useUpdateComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, texto }: { id: string; texto: string }) => comentarioService.update(id, texto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comentarios'] });
    },
  });
}

export function useDeleteComentario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => comentarioService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comentarios'] });
    },
  });
}
