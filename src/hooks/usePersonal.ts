import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personalService } from '@/services/personalService';
import { PersonalFormData, CargoFormData, TipoCargo } from '@/types/personal';

// ============ PERSONAL ============
export const usePersonalList = () => {
  return useQuery({
    queryKey: ['personal'],
    queryFn: () => personalService.getAll(),
  });
};

export const usePersonal = (id: string) => {
  return useQuery({
    queryKey: ['personal', id],
    queryFn: () => personalService.getById(id),
    enabled: !!id,
  });
};

export const usePersonalByTipoCargo = (tipo: TipoCargo) => {
  return useQuery({
    queryKey: ['personal', 'tipoCargo', tipo],
    queryFn: () => personalService.getByTipoCargo(tipo),
  });
};

export const useCreatePersonal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PersonalFormData) => personalService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal'] });
    },
  });
};

export const useUpdatePersonal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PersonalFormData> }) =>
      personalService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['personal'] });
      queryClient.invalidateQueries({ queryKey: ['personal', id] });
    },
  });
};

export const useDeletePersonal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personalService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal'] });
    },
  });
};

// ============ CARGOS ============
export const useCargos = () => {
  return useQuery({
    queryKey: ['cargos'],
    queryFn: () => personalService.getAllCargos(),
  });
};

export const useCreateCargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CargoFormData) => personalService.createCargo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
    },
  });
};

export const useUpdateCargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CargoFormData> }) =>
      personalService.updateCargo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
    },
  });
};

export const useDeleteCargo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personalService.deleteCargo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargos'] });
    },
  });
};
