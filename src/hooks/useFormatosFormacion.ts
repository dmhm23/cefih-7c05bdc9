import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatoFormacionService } from '@/modules/formatos/plugins/safa';
import { FormatoFormacionFormData } from '@/modules/formatos/plugins/safa';

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

export function useFormatosMatricula(matriculaId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'matricula', matriculaId],
    queryFn: () => formatoFormacionService.getForMatricula(matriculaId!),
    enabled: !!matriculaId,
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
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      // Phase 1.2: surface portal sync side-effects
      const sync = result?.__portalSync;
      if (sync?.changed) {
        import('sonner').then(({ toast }) => {
          switch (sync.action) {
            case 'added':
              toast.success('Formato agregado al catálogo del Portal Estudiante');
              break;
            case 'reactivated':
              toast.success('Formato reactivado en el Portal Estudiante');
              break;
            case 'deactivated':
              toast.info('Formato removido del Portal Estudiante');
              break;
            case 'updated':
              toast.success('Catálogo del Portal sincronizado');
              break;
          }
        });
      }
    },
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

export function useDeleteFormato() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formatoFormacionService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function usePlantillasBase() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'plantillas-base'],
    queryFn: formatoFormacionService.getPlantillasBase,
  });
}
