import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nivelFormacionService } from '@/services/nivelFormacionService';
import { NivelFormacionFormData } from '@/types/nivelFormacion';

export const useNivelesFormacion = () => {
  return useQuery({
    queryKey: ['niveles-formacion'],
    queryFn: () => nivelFormacionService.getAll(),
  });
};

export const useNivelFormacion = (id: string) => {
  return useQuery({
    queryKey: ['nivel-formacion', id],
    queryFn: () => nivelFormacionService.getById(id),
    enabled: !!id,
  });
};

export const useSearchNiveles = (query: string) => {
  return useQuery({
    queryKey: ['niveles-formacion', 'search', query],
    queryFn: () => nivelFormacionService.search(query),
    enabled: query.length >= 2,
  });
};

export const useCreateNivelFormacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NivelFormacionFormData) => nivelFormacionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveles-formacion'] });
    },
  });
};

export const useUpdateNivelFormacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NivelFormacionFormData> }) =>
      nivelFormacionService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['niveles-formacion'] });
      queryClient.invalidateQueries({ queryKey: ['nivel-formacion', id] });
    },
  });
};

export const useDeleteNivelFormacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => nivelFormacionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['niveles-formacion'] });
    },
  });
};
