import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMonitoreoData, MonitoreoFiltros } from '@/services/portalMonitoreoService';
import { togglePortalMatricula, resetDocumentoMatricula } from '@/services/portalMatriculaService';

export function usePortalMonitoreo(filtros?: MonitoreoFiltros) {
  return useQuery({
    queryKey: ['portal-monitoreo', filtros],
    queryFn: () => getMonitoreoData(filtros),
  });
}

export function useTogglePortalMatricula() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matriculaId, habilitado }: { matriculaId: string; habilitado: boolean }) =>
      togglePortalMatricula(matriculaId, habilitado),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-monitoreo'] }),
  });
}

export function useResetDocumentoMatricula() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ matriculaId, documentoKey }: { matriculaId: string; documentoKey: string }) =>
      resetDocumentoMatricula(matriculaId, documentoKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-monitoreo'] }),
  });
}
