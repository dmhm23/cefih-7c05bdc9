import { supabase } from '@/integrations/supabase/client';

export async function togglePortalMatricula(matriculaId: string, habilitado: boolean): Promise<void> {
  // Get current portal_estudiante JSONB
  const { data: mat, error: getErr } = await supabase
    .from('matriculas')
    .select('portal_estudiante')
    .eq('id', matriculaId)
    .single();
  if (getErr) throw getErr;

  const portal = (mat.portal_estudiante as any) || { habilitado: true, documentos: [] };
  portal.habilitado = habilitado;

  const { error } = await supabase
    .from('matriculas')
    .update({ portal_estudiante: portal })
    .eq('id', matriculaId);
  if (error) throw error;
}

export async function resetDocumentoMatricula(matriculaId: string, documentoKey: string): Promise<void> {
  // Get current document record
  const { data: doc, error: getErr } = await supabase
    .from('documentos_portal')
    .select('*')
    .eq('matricula_id', matriculaId)
    .eq('documento_key', documentoKey)
    .single();
  if (getErr) throw getErr;

  if (doc.estado !== 'completado') {
    throw new Error('Solo se pueden reabrir documentos completados');
  }

  const { error } = await supabase
    .from('documentos_portal')
    .update({
      estado: 'pendiente',
      enviado_en: null,
      firma_data: null,
      metadata: {},
    })
    .eq('matricula_id', matriculaId)
    .eq('documento_key', documentoKey);
  if (error) throw error;
}
