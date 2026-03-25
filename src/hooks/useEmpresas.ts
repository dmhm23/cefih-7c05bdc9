import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresaService } from '@/services/empresaService';
import { EmpresaFormData, TarifaEmpresaFormData } from '@/types/empresa';

export const useEmpresas = () => {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresaService.getAll(),
  });
};

export const useEmpresa = (id: string) => {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: () => empresaService.getById(id),
    enabled: !!id,
  });
};

export const useCreateEmpresa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmpresaFormData) => empresaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
};

export const useUpdateEmpresa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmpresaFormData> }) =>
      empresaService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', id] });
    },
  });
};

export const useDeleteEmpresa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => empresaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
};

// ============ TARIFAS ============

export const useTarifasEmpresa = (empresaId: string) => {
  return useQuery({
    queryKey: ['tarifas-empresa', empresaId],
    queryFn: () => empresaService.getTarifas(empresaId),
    enabled: !!empresaId,
  });
};

export const useCreateTarifa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TarifaEmpresaFormData) => empresaService.createTarifa(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['tarifas-empresa', data.empresaId] });
    },
  });
};

export const useUpdateTarifa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TarifaEmpresaFormData> }) =>
      empresaService.updateTarifa(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifas-empresa'] });
    },
  });
};

export const useDeleteTarifa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => empresaService.deleteTarifa(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tarifas-empresa'] });
    },
  });
};
