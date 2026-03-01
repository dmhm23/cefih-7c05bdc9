import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { excepcionCertificadoService } from '@/services/excepcionCertificadoService';

export function useExcepcionesCertificado() {
  return useQuery({ queryKey: ['excepciones-certificado'], queryFn: excepcionCertificadoService.getAll });
}

export function useExcepcionesByMatricula(matriculaId: string) {
  return useQuery({ queryKey: ['excepciones-certificado', 'matricula', matriculaId], queryFn: () => excepcionCertificadoService.getByMatricula(matriculaId), enabled: !!matriculaId });
}

export function useSolicitarExcepcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matriculaId, solicitadoPor, motivo }: { matriculaId: string; solicitadoPor: string; motivo: string }) =>
      excepcionCertificadoService.solicitar(matriculaId, solicitadoPor, motivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['excepciones-certificado'] }),
  });
}

export function useAprobarExcepcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resueltoPor }: { id: string; resueltoPor: string }) =>
      excepcionCertificadoService.aprobar(id, resueltoPor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['excepciones-certificado'] }),
  });
}

export function useRechazarExcepcion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resueltoPor }: { id: string; resueltoPor: string }) =>
      excepcionCertificadoService.rechazar(id, resueltoPor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['excepciones-certificado'] }),
  });
}
