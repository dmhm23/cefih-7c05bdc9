import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { carteraService, asignarMatriculaACartera } from '@/services/carteraService';
import { MetodoPago, TipoActividadCartera, TipoResponsable, GrupoCartera, ResponsablePago } from '@/types/cartera';

const PAGE_SIZE = 100;

export const useGruposCartera = () =>
  useQuery({ queryKey: ['cartera', 'grupos'], queryFn: () => carteraService.getGrupos(), staleTime: 5 * 60 * 1000 });

/**
 * Paginación infinita server-side de grupos de cartera con join al responsable.
 */
export const useGruposCarteraPaginated = (params: {
  search?: string;
  tipo?: string;
  estado?: string;
}) => {
  const { search = '', tipo = 'todos', estado = 'todos' } = params;
  const query = useInfiniteQuery({
    queryKey: ['cartera', 'grupos', 'paginated', { search, tipo, estado }],
    queryFn: ({ pageParam = 0 }) =>
      carteraService.getGruposPage({ page: pageParam, pageSize: PAGE_SIZE, search, tipo, estado }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.rows.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const grupos: (GrupoCartera & { responsable?: ResponsablePago })[] = useMemo(
    () => query.data?.pages.flatMap(p => p.rows) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    grupos,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
  };
};

export const useGrupoCartera = (id: string) =>
  useQuery({ queryKey: ['cartera', 'grupo', id], queryFn: () => carteraService.getGrupoById(id), enabled: !!id });

export const useResponsablesPago = () =>
  useQuery({ queryKey: ['cartera', 'responsables'], queryFn: () => carteraService.getResponsables() });

export const useResponsablePago = (id: string) =>
  useQuery({ queryKey: ['cartera', 'responsable', id], queryFn: () => carteraService.getResponsableById(id), enabled: !!id });

export const useFacturasByGrupo = (grupoId: string) =>
  useQuery({ queryKey: ['cartera', 'facturas', grupoId], queryFn: () => carteraService.getFacturasByGrupo(grupoId), enabled: !!grupoId });

export const usePagosByGrupo = (grupoId: string) =>
  useQuery({ queryKey: ['cartera', 'pagos', grupoId], queryFn: () => carteraService.getPagosByGrupo(grupoId), enabled: !!grupoId });

export const useActividadesCartera = (grupoId: string) =>
  useQuery({ queryKey: ['cartera', 'actividades', grupoId], queryFn: () => carteraService.getActividadesByGrupo(grupoId), enabled: !!grupoId });

export const usePagosByFactura = (facturaId: string) =>
  useQuery({ queryKey: ['cartera', 'pagos', 'factura', facturaId], queryFn: () => carteraService.getPagosByFactura(facturaId), enabled: !!facturaId });

export const useActividadesByFactura = (facturaId: string) =>
  useQuery({ queryKey: ['cartera', 'actividades', 'factura', facturaId], queryFn: () => carteraService.getActividadesByFactura(facturaId), enabled: !!facturaId });

export const useCreateFactura = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: carteraService.createFactura,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useRegistrarPagoCartera = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: carteraService.registrarPago,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useCreateResponsable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: carteraService.createResponsable,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useRegistrarActividad = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: carteraService.registrarActividad,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useUpdateFactura = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof carteraService.updateFactura>[1] }) =>
      carteraService.updateFactura(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useUpdatePago = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof carteraService.updatePago>[1] }) =>
      carteraService.updatePago(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useDeleteFactura = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => carteraService.deleteFactura(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useDeletePago = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => carteraService.deletePago(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useAsignarCartera = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: Parameters<typeof asignarMatriculaACartera>[0]) =>
      asignarMatriculaACartera(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
      qc.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};
