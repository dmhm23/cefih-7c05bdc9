import { useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { matriculaService } from '@/services/matriculaService';
import { driveService } from '@/services/driveService';
import { crearDocumentosMatricula } from '@/services/documentoService';
import { supabase } from '@/integrations/supabase/client';

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

/**
 * Codifica la lista de tipos cubiertos por un consolidado en el campo `nombre`
 * con un patrón parseable: "Consolidado: cedula|arl|examen_medico".
 */
export const buildConsolidadoNombre = (tipos: string[]): string => {
  const limpios = tipos.filter(Boolean);
  return `Consolidado: ${limpios.join('|')}`;
};

/**
 * Devuelve los tipos cubiertos por una fila tipo='consolidado' a partir de su `nombre`.
 * Devuelve [] si no se puede parsear.
 */
export const parseConsolidadoTipos = (nombre?: string | null): string[] => {
  if (!nombre) return [];
  const m = nombre.match(/^Consolidado:\s*(.+)$/i);
  if (!m) return [];
  return m[1].split('|').map((t) => t.trim()).filter(Boolean);
};

/**
 * Elimina un consolidado: borra la fila única tipo='consolidado' + el blob de Storage.
 * Las filas individuales no se tocan (siguen 'pendiente'); volverán a estar disponibles.
 */
export const useDeleteConsolidado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matriculaId,
      consolidadoId,
      storagePath,
    }: {
      matriculaId: string;
      consolidadoId: string;
      storagePath?: string | null;
    }) => {
      if (!consolidadoId) throw new Error('consolidadoId requerido');

      // Borrar la fila del consolidado
      const { error } = await supabase
        .from('documentos_matricula')
        .delete()
        .eq('id', consolidadoId)
        .eq('matricula_id', matriculaId);
      if (error) throw new Error(error.message);

      // Borrar blob de Storage (best-effort)
      if (storagePath) {
        try {
          await driveService.deleteFile(storagePath);
        } catch (err) {
          console.warn('No se pudo borrar blob del consolidado:', err);
        }
      }

      return { ok: true };
    },
    onSuccess: (_, { matriculaId }) => {
      queryClient.invalidateQueries({ queryKey: ['matricula', matriculaId] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};

/**
 * Sube un PDF consolidado: inserta o actualiza UNA SOLA fila tipo='consolidado'
 * en documentos_matricula. Las filas individuales siguen 'pendiente' y se
 * consideran "cubiertas" lógicamente cuando esta fila las nombra.
 */
export const useUploadConsolidado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matriculaId,
      file,
      tiposIncluidos,
      metadata,
    }: {
      matriculaId: string;
      file: File;
      tiposIncluidos: string[];
      metadata?: { cursoId?: string; personaNombre?: string; personaCedula?: string };
    }) => {
      if (tiposIncluidos.length === 0) {
        throw new Error('Debe seleccionar al menos un requisito para incluir en el consolidado');
      }

      const { storagePath } = await driveService.uploadConsolidado(
        matriculaId,
        file,
        tiposIncluidos,
        metadata,
      );

      const fechaCarga = new Date().toISOString().split('T')[0];
      const nombre = buildConsolidadoNombre(tiposIncluidos);

      // Buscar fila consolidado existente para esta matrícula
      const { data: existente } = await supabase
        .from('documentos_matricula')
        .select('id, storage_path')
        .eq('matricula_id', matriculaId)
        .eq('tipo', 'consolidado')
        .maybeSingle();

      const oldStoragePath = existente?.storage_path as string | null | undefined;

      if (existente?.id) {
        const { error } = await supabase
          .from('documentos_matricula')
          .update({
            estado: 'cargado',
            nombre,
            storage_path: storagePath,
            archivo_nombre: file.name,
            archivo_tamano: file.size,
            fecha_carga: fechaCarga,
          })
          .eq('id', existente.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('documentos_matricula')
          .insert({
            matricula_id: matriculaId,
            tipo: 'consolidado',
            nombre,
            estado: 'cargado',
            storage_path: storagePath,
            archivo_nombre: file.name,
            archivo_tamano: file.size,
            fecha_carga: fechaCarga,
            opcional: false,
          });
        if (error) throw new Error(error.message);
      }

      // Si reemplaza un blob anterior diferente, limpiarlo
      if (oldStoragePath && oldStoragePath !== storagePath) {
        try {
          await driveService.deleteFile(oldStoragePath);
        } catch (err) {
          console.warn('No se pudo borrar blob anterior del consolidado:', err);
        }
      }

      return { storagePath, count: tiposIncluidos.length };
    },
    onSuccess: (_, { matriculaId }) => {
      queryClient.invalidateQueries({ queryKey: ['matricula', matriculaId] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};
