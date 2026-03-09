import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carteraService } from '@/services/carteraService';
import { MetodoPago } from '@/types/cartera';

export const useGruposCartera = () =>
  useQuery({ queryKey: ['cartera', 'grupos'], queryFn: () => carteraService.getGrupos() });

export const useGrupoCartera = (id: string) =>
  useQuery({ queryKey: ['cartera', 'grupo', id], queryFn: () => carteraService.getGrupoById(id), enabled: !!id });

export const useResponsablesPago = () =>
  useQuery({ queryKey: ['cartera', 'responsables'], queryFn: () => carteraService.getResponsables() });

export const useResponsablePago = (id: string) =>
  useQuery({ queryKey: ['cartera', 'responsable', id], queryFn: () => carteraService.getResponsableById(id), enabled: !!id });

export const useFacturasByGrupo = (grupoId: string) =>
  useQuery({ queryKey: ['cartera', 'facturas', grupoId], queryFn: () => carteraService.getFacturasByGrupo(grupoId), enabled: !!grupoId });

export const usePagosByGrupo = (grupoId: string) =>
  useQuery({ queryKey: ['cartera', 'pagos', grupoId], queryFn: () => carteraService.getPagosByGrupo(grupoId), enabled: !!grupoId });

export const useCreateFactura = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: carteraService.createFactura,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useRegistrarPagoCartera = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: carteraService.registrarPago,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};

export const useCreateResponsable = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: carteraService.createResponsable,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartera'] });
    },
  });
};
