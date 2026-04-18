import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { matriculaService } from '@/services/matriculaService';
import { driveService } from '@/services/driveService';
import { crearDocumentosMatricula } from '@/services/documentoService';

import { EstadoMatricula, DocumentoRequerido, Matricula } from '@/types/matricula';

const PAGE_SIZE = 200;

/**
 * Lista completa de matrículas (legacy). Usar solo donde no hay tabla principal.
 */
export const useMatriculas = () => {
  return useQuery({
    queryKey: ['matriculas'],
    queryFn: () => matriculaService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Paginación infinita server-side con búsqueda y filtros.
 * Devuelve también un mapa de personas resumido (cargado vía join, sin fetch global).
 */
export const useMatriculasPaginated = (params: {
  search?: string;
  tipoVinculacion?: string;
  nivelFormacionId?: string;
  estadoCurso?: string;
}) => {
  const {
    search = '',
    tipoVinculacion = 'todos',
    nivelFormacionId = 'todos',
    estadoCurso = 'todos',
  } = params;

  const query = useInfiniteQuery({
    queryKey: ['matriculas', 'paginated', { search, tipoVinculacion, nivelFormacionId, estadoCurso }],
    queryFn: ({ pageParam = 0 }) =>
      matriculaService.getPage({
        page: pageParam,
        pageSize: PAGE_SIZE,
        search,
        tipoVinculacion,
        nivelFormacionId,
        estadoCurso,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((acc, p) => acc + p.rows.length, 0);
      return loaded < lastPage.total ? allPages.length : undefined;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const matriculas: Matricula[] = useMemo(
    () => query.data?.pages.flatMap(p => p.rows) ?? [],
    [query.data],
  );
  const personasResumen = useMemo(() => {
    const merged: Record<string, { nombres: string; apellidos: string; numeroDocumento: string }> = {};
    for (const page of query.data?.pages ?? []) {
      Object.assign(merged, page.personasResumen);
    }
    return merged;
  }, [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    matriculas,
    personasResumen,
    total,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    refetch: query.refetch,
  };
};

export const useMatricula = (id: string) => {
  return useQuery({
    queryKey: ['matricula', id],
    queryFn: () => matriculaService.getById(id),
    enabled: !!id,
  });
};

export const useMatriculasByPersona = (personaId: string) => {
  return useQuery({
    queryKey: ['matriculas', 'persona', personaId],
    queryFn: () => matriculaService.getByPersonaId(personaId),
    enabled: !!personaId,
  });
};

export const useMatriculasByCurso = (cursoId: string) => {
  return useQuery({
    queryKey: ['matriculas', 'curso', cursoId],
    queryFn: () => matriculaService.getByCursoId(cursoId),
    enabled: !!cursoId,
  });
};

export const useMatriculasByEstado = (estado: EstadoMatricula) => {
  return useQuery({
    queryKey: ['matriculas', 'estado', estado],
    queryFn: () => matriculaService.getByEstado(estado),
  });
};

export const useHistorialByPersona = (personaId: string) => {
  return useQuery({
    queryKey: ['matriculas', 'historial', personaId],
    queryFn: () => matriculaService.getHistorialByPersona(personaId),
    enabled: !!personaId,
  });
};

export const useCreateMatricula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Parameters<typeof matriculaService.create>[0]) => {
      const matricula = await matriculaService.create(data);

      // Use nivelFormacionId directly from the enrollment data
      const nivelId = (data as any).nivelFormacionId || undefined;

      // Create document requirements for this enrollment
      await crearDocumentosMatricula(matricula.id, nivelId);

      return matricula;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
  });
};

export const useUpdateMatricula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      matriculaService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
      queryClient.invalidateQueries({ queryKey: ['matricula', id] });
    },
  });
};

export const useUpdateDocumento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matriculaId,
      documentoId,
      data,
    }: {
      matriculaId: string;
      documentoId: string;
      data: Partial<DocumentoRequerido>;
    }) => matriculaService.updateDocumento(matriculaId, documentoId, data),
    onSuccess: (_, { matriculaId }) => {
      queryClient.invalidateQueries({ queryKey: ['matricula', matriculaId] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};

export const useCapturarFirma = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, firmaBase64 }: { id: string; firmaBase64: string }) =>
      matriculaService.capturarFirma(id, firmaBase64),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matricula', id] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};

export const useRegistrarPago = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datosPago }: { id: string; datosPago: Parameters<typeof matriculaService.registrarPago>[1] }) =>
      matriculaService.registrarPago(id, datosPago),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matricula', id] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};

export const useCambiarEstadoMatricula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoMatricula }) =>
      matriculaService.cambiarEstado(id, estado),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['matricula', id] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};

export const useDeleteMatricula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => matriculaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
  });
};

export const useUploadDocumento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matriculaId,
      documentoId,
      file,
      metadata,
    }: {
      matriculaId: string;
      documentoId: string;
      file: File;
      metadata?: { cursoId?: string; personaNombre?: string; personaCedula?: string };
    }) => {
      const url = await driveService.uploadDocumento(matriculaId, documentoId, file, metadata);
      return matriculaService.updateDocumento(matriculaId, documentoId, {
        estado: 'cargado',
        fechaCarga: new Date().toISOString().split('T')[0],
        urlDrive: url,
        archivoNombre: file.name,
        archivoTamano: file.size,
      });
    },
    onSuccess: (_, { matriculaId }) => {
      queryClient.invalidateQueries({ queryKey: ['matricula', matriculaId] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};
