import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tipoCertificadoService } from '@/services/tipoCertificadoService';
import type { TipoCertificadoFormData } from '@/types/certificado';
import type { TipoFormacion } from '@/types/curso';

export function useTiposCertificado() {
  return useQuery({ queryKey: ['tipos-certificado'], queryFn: tipoCertificadoService.getAll });
}

export function useTipoCertificado(id: string) {
  return useQuery({ queryKey: ['tipos-certificado', id], queryFn: () => tipoCertificadoService.getById(id), enabled: !!id });
}

export function useTiposCertificadoByFormacion(tipo: TipoFormacion) {
  return useQuery({ queryKey: ['tipos-certificado', 'formacion', tipo], queryFn: () => tipoCertificadoService.getByTipoFormacion(tipo), enabled: !!tipo });
}

export function useCreateTipoCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TipoCertificadoFormData) => tipoCertificadoService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tipos-certificado'] }),
  });
}

export function useUpdateTipoCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TipoCertificadoFormData> }) => tipoCertificadoService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tipos-certificado'] }),
  });
}

export function useDeleteTipoCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tipoCertificadoService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tipos-certificado'] }),
  });
}
