import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalAdminService } from '@/services/portalAdminService';
import { PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { TipoFormacion } from '@/types/curso';
import { toast } from '@/hooks/use-toast';

const KEY = ['portal-admin-config'];

export function usePortalAdminConfig() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => portalAdminService.getConfigGlobal(),
  });
}

export function useSaveDocumentoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (doc: PortalDocumentoConfigAdmin) => portalAdminService.saveDocumentoConfig(doc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ title: 'Documento guardado' });
    },
  });
}

export function useDeleteDocumentoConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => portalAdminService.deleteDocumentoConfig(key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ title: 'Documento eliminado' });
    },
  });
}

export function useTogglePortalGlobal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activo: boolean) => portalAdminService.togglePortalGlobal(activo),
    onSuccess: (_, activo) => {
      qc.invalidateQueries({ queryKey: KEY });
      toast({ title: activo ? 'Portal activado' : 'Portal desactivado' });
    },
  });
}

export function useUpdateOrdenDocumentos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keys: string[]) => portalAdminService.updateOrdenDocumentos(keys),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}

export function useUpdateHabilitacionNivel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, nivel, activo }: { key: string; nivel: TipoFormacion; activo: boolean }) =>
      portalAdminService.updateHabilitacionNivel(key, nivel, activo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
