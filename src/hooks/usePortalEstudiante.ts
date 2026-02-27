import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalEstudianteService, MatriculaVigenteResult } from '@/services/portalEstudianteService';
import { DocumentoPortalEstado } from '@/types/portalEstudiante';

export function useBuscarMatriculaVigente(cedula: string | null) {
  return useQuery<MatriculaVigenteResult | null>({
    queryKey: ['portal-estudiante', 'matricula-vigente', cedula],
    queryFn: () => portalEstudianteService.buscarMatriculaVigente(cedula!),
    enabled: !!cedula && cedula.length >= 6,
  });
}

export function useDocumentosPortal(matriculaId: string | null) {
  return useQuery({
    queryKey: ['portal-estudiante', 'documentos', matriculaId],
    queryFn: () => portalEstudianteService.getDocumentosEstado(matriculaId!),
    enabled: !!matriculaId,
  });
}

export function useInfoAprendizData(matriculaId: string | null) {
  return useQuery({
    queryKey: ['portal-estudiante', 'info-aprendiz', matriculaId],
    queryFn: () => portalEstudianteService.getInfoAprendizData(matriculaId!),
    enabled: !!matriculaId,
  });
}

export function useEnviarDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matriculaId,
      documentoKey,
      payload,
    }: {
      matriculaId: string;
      documentoKey: string;
      payload: Partial<DocumentoPortalEstado>;
    }) => portalEstudianteService.enviarDocumento(matriculaId, documentoKey, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['portal-estudiante', 'documentos', variables.matriculaId],
      });
      queryClient.invalidateQueries({
        queryKey: ['portal-estudiante', 'info-aprendiz', variables.matriculaId],
      });
    },
  });
}
