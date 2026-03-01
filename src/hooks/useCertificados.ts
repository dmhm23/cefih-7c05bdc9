import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificadoService } from '@/services/certificadoService';
import type { CertificadoFormData } from '@/types/certificado';

export function useCertificados() {
  return useQuery({ queryKey: ['certificados'], queryFn: certificadoService.getAll });
}

export function useCertificado(id: string) {
  return useQuery({ queryKey: ['certificados', id], queryFn: () => certificadoService.getById(id), enabled: !!id });
}

export function useCertificadosByMatricula(matriculaId: string) {
  return useQuery({ queryKey: ['certificados', 'matricula', matriculaId], queryFn: () => certificadoService.getByMatricula(matriculaId), enabled: !!matriculaId });
}

export function useCertificadosByCurso(cursoId: string) {
  return useQuery({ queryKey: ['certificados', 'curso', cursoId], queryFn: () => certificadoService.getByCurso(cursoId), enabled: !!cursoId });
}

export function useCreateCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CertificadoFormData) => certificadoService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificados'] }),
  });
}

export function useRevocarCertificado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, revocadoPor, motivo }: { id: string; revocadoPor: string; motivo: string }) =>
      certificadoService.revocar(id, revocadoPor, motivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['certificados'] }),
  });
}
