import { supabase } from '@/integrations/supabase/client';
import { PortalConfigGlobal, PortalDocumentoConfigAdmin } from '@/types/portalAdmin';

function mapDocConfig(row: any): PortalDocumentoConfigAdmin {
  return {
    key: row.key,
    nombre: row.label,
    tipo: row.tipo,
    requiereFirma: row.tipo === 'firma_autorizacion',
    dependeDe: row.depende_de || [],
    orden: row.orden,
    nivelesHabilitados: row.niveles_habilitados || [],
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
      portalActivoPorDefecto: true,
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
      niveles_habilitados: doc.nivelesHabilitados,
      obligatorio: true,
      activo: true,
      formato_id: doc.key,
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
        .insert(upsertData as any);
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

  async updateHabilitacionNivel(key: string, nivelId: string, activo: boolean): Promise<void> {
    const { data: current, error: getErr } = await supabase
      .from('portal_config_documentos')
      .select('niveles_habilitados')
      .eq('key', key)
      .single();
    if (getErr) throw getErr;

    let niveles: string[] = (current.niveles_habilitados as string[]) || [];
    if (activo) {
      if (!niveles.includes(nivelId)) {
        niveles = [...niveles, nivelId];
      }
    } else {
      niveles = niveles.filter((id: string) => id !== nivelId);
    }

    const { error } = await supabase
      .from('portal_config_documentos')
      .update({ niveles_habilitados: niveles })
      .eq('key', key);
    if (error) throw error;
  },
};
