import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cursoService } from '@/services/cursoService';
import { CursoFormData, EstadoCurso } from '@/types/curso';

export const useCursos = () => {
  return useQuery({
    queryKey: ['cursos'],
    queryFn: () => cursoService.getAll(),
  });
};

export const useCurso = (id: string) => {
  return useQuery({
    queryKey: ['curso', id],
    queryFn: () => cursoService.getById(id),
    enabled: !!id,
  });
};

export const useCursosByEstado = (estado: EstadoCurso) => {
  return useQuery({
    queryKey: ['cursos', 'estado', estado],
    queryFn: () => cursoService.getByEstado(estado),
  });
};

export const useSearchCursos = (query: string) => {
  return useQuery({
    queryKey: ['cursos', 'search', query],
    queryFn: () => cursoService.search(query),
    enabled: query.length >= 2,
  });
};

export const useCursoEstadisticas = (id: string) => {
  return useQuery({
    queryKey: ['curso', id, 'estadisticas'],
    queryFn: () => cursoService.getEstadisticas(id),
    enabled: !!id,
  });
};

export const useCreateCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CursoFormData) => cursoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
  });
};

export const useUpdateCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CursoFormData> }) =>
      cursoService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', id] });
    },
  });
};

export const useCambiarEstadoCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoCurso }) =>
      cursoService.cambiarEstado(id, estado),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', id] });
    },
  });
};

export const useDeleteCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cursoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
    },
  });
};

export const useAgregarEstudiantesCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cursoId, matriculaIds }: { cursoId: string; matriculaIds: string[] }) =>
      cursoService.agregarEstudiantes(cursoId, matriculaIds),
    onSuccess: (_, { cursoId }) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', cursoId] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};

export const useRemoverEstudianteCurso = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cursoId, matriculaId }: { cursoId: string; matriculaId: string }) =>
      cursoService.removerEstudiante(cursoId, matriculaId),
    onSuccess: (_, { cursoId }) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', cursoId] });
      queryClient.invalidateQueries({ queryKey: ['matriculas'] });
    },
  });
};

export const useActualizarMinTrabajo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { minTrabajoRegistro?: string; minTrabajoResponsable?: string; minTrabajoFechaCierrePrincipal?: string } }) =>
      cursoService.actualizarMinTrabajo(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', id] });
    },
  });
};

export const useAgregarFechaAdicional = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { fecha: string; motivo: string } }) =>
      cursoService.agregarFechaAdicional(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', id] });
    },
  });
};

export const useEliminarFechaAdicional = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cursoId, fechaId }: { cursoId: string; fechaId: string }) =>
      cursoService.eliminarFechaAdicional(cursoId, fechaId),
    onSuccess: (_, { cursoId }) => {
      queryClient.invalidateQueries({ queryKey: ['cursos'] });
      queryClient.invalidateQueries({ queryKey: ['curso', cursoId] });
    },
  });
};
