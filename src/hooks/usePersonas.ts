import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personaService } from '@/services/personaService';
import { PersonaFormData } from '@/types/persona';

export const usePersonas = () => {
  return useQuery({
    queryKey: ['personas'],
    queryFn: () => personaService.getAll(),
  });
};

export const usePersona = (id: string) => {
  return useQuery({
    queryKey: ['persona', id],
    queryFn: () => personaService.getById(id),
    enabled: !!id,
  });
};

export const usePersonaByDocumento = (numeroDocumento: string) => {
  return useQuery({
    queryKey: ['persona', 'documento', numeroDocumento],
    queryFn: () => personaService.getByDocumento(numeroDocumento),
    enabled: !!numeroDocumento && numeroDocumento.length >= 6,
  });
};

export const useSearchPersonas = (query: string) => {
  return useQuery({
    queryKey: ['personas', 'search', query],
    queryFn: () => personaService.search(query),
    enabled: query.length >= 2,
  });
};

export const useCreatePersona = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PersonaFormData) => personaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
};

export const useUpdatePersona = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonaFormData> }) =>
      personaService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['persona', id] });
    },
  });
};

export const useDeletePersona = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => personaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
};
