import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatoFormacionService } from '@/services/formatoFormacionService';
import { FormatoFormacionFormData } from '@/types/formatoFormacion';

const QUERY_KEY = ['formatos-formacion'];

export function useFormatos() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: formatoFormacionService.getAll,
  });
}

export function useFormato(id: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => formatoFormacionService.getById(id!),
    enabled: !!id,
  });
}

export function useFormatosMatricula(tipoCurso: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'matricula', tipoCurso],
    queryFn: () => formatoFormacionService.getForMatricula(tipoCurso!),
    enabled: !!tipoCurso,
  });
}

export function useCreateFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormatoFormacionFormData) => formatoFormacionService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormatoFormacionFormData> }) =>
      formatoFormacionService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useToggleFormatoActivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formatoFormacionService.toggleActivo(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDuplicateFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formatoFormacionService.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

// --- New hooks for template engine ---

export function useFormatoVersiones(formatoId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'versiones', formatoId],
    queryFn: () => formatoFormacionService.getVersiones(formatoId!),
    enabled: !!formatoId,
  });
}

export function useSaveVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formatoId: string) => formatoFormacionService.saveVersion(formatoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRestoreVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formatoId, versionId }: { formatoId: string; versionId: string }) =>
      formatoFormacionService.restoreVersion(formatoId, versionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useArchiveFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formatoFormacionService.archive(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function usePlantillasBase() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'plantillas-base'],
    queryFn: formatoFormacionService.getPlantillasBase,
  });
}
