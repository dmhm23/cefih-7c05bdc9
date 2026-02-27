import { useQuery } from '@tanstack/react-query';
import { getMonitoreoData, MonitoreoFiltros } from '@/services/portalMonitoreoService';

export function usePortalMonitoreo(filtros?: MonitoreoFiltros) {
  return useQuery({
    queryKey: ['portal-monitoreo', filtros],
    queryFn: () => getMonitoreoData(filtros),
  });
}
