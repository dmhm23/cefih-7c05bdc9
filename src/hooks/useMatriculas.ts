import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matriculaService } from '@/services/matriculaService';
import { EstadoMatricula, DocumentoRequerido } from '@/types/matricula';

export const useMatriculas = () => {
  return useQuery({
    queryKey: ['matriculas'],
    queryFn: () => matriculaService.getAll(),
  });
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
    mutationFn: (data: Parameters<typeof matriculaService.create>[0]) =>
      matriculaService.create(data),
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
    mutationFn: ({ id, facturaNumero }: { id: string; facturaNumero: string }) =>
      matriculaService.registrarPago(id, facturaNumero),
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
