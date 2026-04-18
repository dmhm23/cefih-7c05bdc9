import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { certificadoService } from '@/services/certificadoService';
import type { CertificadoFormData, CertificadoGenerado } from '@/types/certificado';

const PAGE_SIZE = 200;

export function useCertificados() {
  return useQuery({ queryKey: ['certificados'], queryFn: certificadoService.getAll, staleTime: 5 * 60 * 1000 });
}

/**
 * Paginación infinita server-side con búsqueda por código y filtros.
 */
export function useCertificadosPaginated(params: {
  search?: string;
  estado?: string;
  excepcional?: string;
}) {
  const { search = '', estado = 'todos', excepcional = 'todos' } = params;
  const query = useInfiniteQuery({
    queryKey: ['certificados', 'paginated', { search, estado, excepcional }],
    queryFn: ({ pageParam = 0 }) =>
      certificadoService.getPage({ page: pageParam, pageSize: PAGE_SIZE, search, estado, excepcional }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.rows.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const certificados: CertificadoGenerado[] = useMemo(
    () => query.data?.pages.flatMap(p => p.rows) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    certificados,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
  };
}

export function useCertificado(id: string) {
  return useQuery({ queryKey: ['certificados', id], queryFn: () => certificadoService.getById(id), enabled: !!id });
}

export function useCertificadosByMatricula(matriculaId: string) {
  return useQuery({ queryKey: ['certificados', 'matricula', matriculaId], queryFn: () => certificadoService.getByMatricula(matriculaId), enabled: !!matriculaId });
}

export function useCertificadosByCurso(cursoId: string) {
  return useQuery({ queryKey: ['certificados', 'curso', cursoId], queryFn: () => certificadoService.getByCurso(cursoId), enabled: !!cursoId });
}

export function useCreateCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CertificadoFormData) => certificadoService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificados'] }),
  });
}

export function useGenerarCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      matriculaId: string;
      cursoId: string;
      personaId: string;
      plantillaId: string;
      svgFinal: string;
      snapshotDatos: Record<string, unknown>;
      codigo: string;
      autorizadoExcepcional?: boolean;
    }) => certificadoService.generar(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificados'] });
      qc.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
}

export function useRevocarCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, revocadoPor, motivo }: { id: string; revocadoPor: string; motivo: string }) =>
      certificadoService.revocar(id, revocadoPor, motivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificados'] }),
  });
}

export function useReemitirCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      certificadoAnteriorId: string;
      svgFinal: string;
      snapshotDatos: Record<string, unknown>;
      codigo: string;
    }) => certificadoService.reemitir(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['certificados'] });
      qc.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
}
