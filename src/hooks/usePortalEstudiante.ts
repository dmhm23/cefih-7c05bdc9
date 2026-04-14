import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalEstudianteService, MatriculaVigenteResult } from '@/services/portalEstudianteService';
import { portalDinamicoService, EnviarFormatoDinamicoParams } from '@/services/portalDinamicoService';
import { DocumentoPortalEstado } from '@/types/portalEstudiante';
import { snakeToCamel } from '@/services/api';
import type { FormatoFormacion, FirmaMatricula } from '@/types/formatoFormacion';

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

export function useEvaluacionFormato(matriculaId: string | null) {
  return useQuery({
    queryKey: ['portal-estudiante', 'evaluacion-formato', matriculaId],
    queryFn: () => portalEstudianteService.getEvaluacionFormato(matriculaId!),
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
      queryClient.invalidateQueries({
        queryKey: ['portal-estudiante', 'evaluacion-formato', variables.matriculaId],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Dynamic portal hooks (Fase 2+)
// ---------------------------------------------------------------------------

export function useFormatoById(formatoId: string | null) {
  return useQuery<FormatoFormacion | null>({
    queryKey: ['formato', formatoId],
    queryFn: async () => {
      if (!formatoId) return null;
      const row = await portalDinamicoService.getFormatoById(formatoId);
      if (!row) return null;
      const f = snakeToCamel<any>(row);
      return {
        ...f,
        nivelFormacionIds: f.nivelesAsignados || [],
        bloques: f.bloques || [],
        tokensUsados: f.tokensUsados || [],
        dependencias: f.dependencias || [],
        eventosDisparadores: f.eventosDisparadores || [],
        esOrigenFirma: f.esOrigenFirma ?? false,
      } as FormatoFormacion;
    },
    enabled: !!formatoId,
  });
}

export function useFirmasMatricula(matriculaId: string | null) {
  return useQuery<FirmaMatricula[]>({
    queryKey: ['firmas-matricula', matriculaId],
    queryFn: () => portalDinamicoService.getFirmasMatricula(matriculaId!),
    enabled: !!matriculaId,
  });
}

export function useEnviarFormatoDinamico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: EnviarFormatoDinamicoParams) =>
      portalDinamicoService.enviarFormatoDinamico(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['portal-estudiante', 'documentos', variables.matriculaId],
      });
      queryClient.invalidateQueries({
        queryKey: ['formato-respuestas'],
      });
      queryClient.invalidateQueries({
        queryKey: ['firmas-matricula', variables.matriculaId],
      });
    },
  });
}
