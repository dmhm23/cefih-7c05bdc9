import { supabase } from '@/integrations/supabase/client';
import { PortalConfigGlobal, PortalDocumentoConfigAdmin } from '@/types/portalAdmin';
import { TipoFormacion } from '@/types/curso';

function mapDocConfig(row: any): PortalDocumentoConfigAdmin {
  return {
    key: row.key,
    nombre: row.label,
    tipo: row.tipo,
    requiereFirma: row.tipo === 'firma_autorizacion',
    dependeDe: row.depende_de || [],
    orden: row.orden,
    habilitadoPorNivel: row.habilitado_por_nivel || {},
  };
}

export const portalAdminService = {
  async getConfigGlobal(): Promise<PortalConfigGlobal> {
    const { data, error } = await supabase
      .from('portal_config_documentos')
      .select('*')
      .eq('activo', true)
      .order('orden');
    if (error) throw error;

    return {
      portalActivoPorDefecto: true, // Managed at matrícula level via portal_estudiante JSONB
      documentos: (data || []).map(mapDocConfig),
    };
  },

  async saveDocumentoConfig(doc: PortalDocumentoConfigAdmin): Promise<PortalDocumentoConfigAdmin> {
    const { data: existing } = await supabase
      .from('portal_config_documentos')
      .select('id')
      .eq('key', doc.key)
      .maybeSingle();

    const upsertData = {
      key: doc.key,
      label: doc.nombre,
      tipo: doc.tipo,
      descripcion: '',
      orden: doc.orden,
      depende_de: doc.dependeDe,
      habilitado_por_nivel: doc.habilitadoPorNivel,
      obligatorio: true,
      activo: true,
    };

    if (existing) {
      const { error } = await supabase
        .from('portal_config_documentos')
        .update(upsertData)
        .eq('key', doc.key);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('portal_config_documentos')
        .insert(upsertData);
      if (error) throw error;
    }

    return doc;
  },

  async deleteDocumentoConfig(key: string): Promise<void> {
    const { error } = await supabase
      .from('portal_config_documentos')
      .delete()
      .eq('key', key);
    if (error) throw error;

    // Remove from dependencies of other docs
    const { data: others } = await supabase
      .from('portal_config_documentos')
      .select('key, depende_de')
      .contains('depende_de', [key]);

    if (others && others.length > 0) {
      for (const other of others) {
        const newDeps = (other.depende_de || []).filter((d: string) => d !== key);
        await supabase
          .from('portal_config_documentos')
          .update({ depende_de: newDeps })
          .eq('key', other.key);
      }
    }
  },

  async togglePortalGlobal(activo: boolean): Promise<boolean> {
    // This is now handled at matrícula level, no-op at global
    return activo;
  },

  async updateOrdenDocumentos(keys: string[]): Promise<void> {
    for (let i = 0; i < keys.length; i++) {
      await supabase
        .from('portal_config_documentos')
        .update({ orden: i + 1 })
        .eq('key', keys[i]);
    }
  },

  async updateDependencias(key: string, dependeDe: string[]): Promise<void> {
    const { error } = await supabase
      .from('portal_config_documentos')
      .update({ depende_de: dependeDe })
      .eq('key', key);
    if (error) throw error;
  },

  async updateHabilitacionNivel(key: string, nivel: TipoFormacion, activo: boolean): Promise<void> {
    // Get current config
    const { data: current, error: getErr } = await supabase
      .from('portal_config_documentos')
      .select('habilitado_por_nivel')
      .eq('key', key)
      .single();
    if (getErr) throw getErr;

    const habilitado = { ...(current.habilitado_por_nivel as Record<string, boolean>), [nivel]: activo };
    const { error } = await supabase
      .from('portal_config_documentos')
      .update({ habilitado_por_nivel: habilitado })
      .eq('key', key);
    if (error) throw error;
  },
};
