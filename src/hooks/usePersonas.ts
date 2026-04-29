import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { personaService } from '@/services/personaService';
import { PersonaFormData, Persona } from '@/types/persona';

const PAGE_SIZE = 200;

/**
 * Lista completa de personas (legacy). Mantenido para compatibilidad con vistas
 * que aún la consumen, pero NO usar en pantallas con muchos registros.
 */
export const usePersonas = () => {
  return useQuery({
    queryKey: ['personas'],
    queryFn: () => personaService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Paginación infinita con búsqueda y filtros server-side.
 * Carga 200 filas por petición y va concatenando al hacer scroll.
 *
 * @param params Filtros y búsqueda. Cambiar cualquiera resetea la paginación.
 * @returns array plano `personas`, `total`, `isLoading`, `fetchNextPage`, `hasNextPage`.
 */
export const usePersonasPaginated = (params: {
  search?: string;
  genero?: string;
  nivelEducativo?: string;
}) => {
  const { search = '', genero = 'todos', nivelEducativo = 'todos' } = params;

  const query = useInfiniteQuery({
    queryKey: ['personas', 'paginated', { search, genero, nivelEducativo }],
    queryFn: ({ pageParam = 0 }) =>
      personaService.getPage({ page: pageParam, pageSize: PAGE_SIZE, search, genero, nivelEducativo }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.rows.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const personas: Persona[] = useMemo(
    () => query.data?.pages.flatMap(p => p.rows) ?? [],
    [query.data],
  );
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    personas,
    total,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    refetch: query.refetch,
  };
};

export const usePersona = (id: string) => {
  return useQuery({
    queryKey: ['persona', id],
    queryFn: () => personaService.getById(id),
    enabled: !!id,
  });
};

/**
 * Trae solo las personas necesarias por lista de IDs (batch).
 * Sustituye el patrón `usePersonas() + .find()` cuando se conoce el set acotado
 * (por ejemplo, estudiantes inscritos en un curso).
 */
export const usePersonasByIds = (ids: string[]) => {
  // Stable, ordered, deduplicated key for cache reuse
  const sortedKey = useMemo(
    () => Array.from(new Set(ids.filter(Boolean))).sort(),
    [ids],
  );
  return useQuery({
    queryKey: ['personas', 'byIds', sortedKey],
    queryFn: () => personaService.getByIds(sortedKey),
    enabled: sortedKey.length > 0,
    staleTime: 5 * 60 * 1000,
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
