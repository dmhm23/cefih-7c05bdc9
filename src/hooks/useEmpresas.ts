import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { empresaService } from '@/services/empresaService';
import { EmpresaFormData, TarifaEmpresaFormData, Empresa } from '@/types/empresa';

const PAGE_SIZE = 200;

/**
 * Lista completa de empresas (legacy). Usar solo donde no hay tabla principal.
 */
export const useEmpresas = () => {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: () => empresaService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Paginación infinita server-side con búsqueda y filtros.
 */
export const useEmpresasPaginated = (params: {
  search?: string;
  sectorEconomico?: string;
  arl?: string;
}) => {
  const { search = '', sectorEconomico = 'todos', arl = 'todos' } = params;
  const query = useInfiniteQuery({
    queryKey: ['empresas', 'paginated', { search, sectorEconomico, arl }],
    queryFn: ({ pageParam = 0 }) =>
      empresaService.getPage({ page: pageParam, pageSize: PAGE_SIZE, search, sectorEconomico, arl }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.rows.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const empresas: Empresa[] = useMemo(
    () => query.data?.pages.flatMap(p => p.rows) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    empresas,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    refetch: query.refetch,
  };
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
