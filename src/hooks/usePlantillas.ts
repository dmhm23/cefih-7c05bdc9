import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plantillaService } from '@/services/plantillaService';
import type { PlantillaFormData } from '@/types/certificado';

export function usePlantillas() {
  return useQuery({ queryKey: ['plantillas'], queryFn: plantillaService.getAll });
}

export function usePlantilla(id: string) {
  return useQuery({ queryKey: ['plantillas', id], queryFn: () => plantillaService.getById(id), enabled: !!id });
}

export function usePlantillaActiva() {
  return useQuery({ queryKey: ['plantillas', 'activa'], queryFn: plantillaService.getActiva });
}

export function useCreatePlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlantillaFormData) => plantillaService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantillas'] }),
  });
}

export function useUpdatePlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlantillaFormData> }) => plantillaService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plantillas'] }),
  });
}
