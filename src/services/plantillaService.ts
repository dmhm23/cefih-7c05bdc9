import { supabase } from '@/integrations/supabase/client';
import type { PlantillaCertificado, PlantillaFormData, PlantillaVersion } from '@/types/certificado';

function mapPlantilla(row: any, versiones?: any[]): PlantillaCertificado {
  return {
    id: row.id,
    nombre: row.nombre,
    svgRaw: row.svg_raw,
    tokensDetectados: row.tokens_detectados || [],
    activa: row.activa,
    version: row.version,
    historial: (versiones || []).map(mapVersion),
    tipoFormacion: row.tipo_formacion,
    reglaCodigo: row.regla_codigo,
    reglas: row.reglas || {},
    nivelesAsignados: row.niveles_asignados || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersion(row: any): PlantillaVersion {
  return {
    version: row.version,
    svgRaw: row.svg_raw,
    fecha: row.created_at,
    modificadoPor: row.modificado_por || 'admin',
  };
}

export const plantillaService = {
  async getAll(): Promise<PlantillaCertificado[]> {
    const { data, error } = await supabase
      .from('plantillas_certificado')
      .select('*')
      .is('deleted_at', null)
      .order('nombre');
    if (error) throw error;
    return (data || []).map(row => mapPlantilla(row));
  },

  async getById(id: string): Promise<PlantillaCertificado | undefined> {
    const { data: row, error } = await supabase
      .from('plantillas_certificado')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return undefined;

    // Get versions
    const { data: versiones } = await supabase
      .from('plantilla_certificado_versiones')
      .select('*')
      .eq('plantilla_id', id)
      .order('version', { ascending: false });

    return mapPlantilla(row, versiones || []);
  },

  async getActiva(): Promise<PlantillaCertificado | undefined> {
    const { data: row, error } = await supabase
      .from('plantillas_certificado')
      .select('*')
      .eq('activa', true)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    return row ? mapPlantilla(row) : undefined;
  },

  async create(data: PlantillaFormData): Promise<PlantillaCertificado> {
    const tokens = plantillaService.detectarTokens(data.svgRaw);
    const { data: created, error } = await supabase
      .from('plantillas_certificado')
      .insert({
        nombre: data.nombre,
        svg_raw: data.svgRaw,
        tokens_detectados: tokens,
        activa: data.activa,
        version: data.version,
        tipo_formacion: data.tipoFormacion,
        regla_codigo: data.reglaCodigo,
        reglas: data.reglas,
        niveles_asignados: data.nivelesAsignados,
      })
      .select()
      .single();
    if (error) throw error;

    // Save initial version
    await supabase.from('plantilla_certificado_versiones').insert({
      plantilla_id: created.id,
      version: data.version,
      svg_raw: data.svgRaw,
      modificado_por: 'admin',
    });

    return mapPlantilla(created, [{ version: data.version, svg_raw: data.svgRaw, created_at: created.created_at, modificado_por: 'admin' }]);
  },

  async update(id: string, data: Partial<PlantillaFormData>): Promise<PlantillaCertificado> {
    const updateObj: Record<string, unknown> = {};
    if (data.nombre !== undefined) updateObj.nombre = data.nombre;
    if (data.activa !== undefined) updateObj.activa = data.activa;
    if (data.tipoFormacion !== undefined) updateObj.tipo_formacion = data.tipoFormacion;
    if (data.reglaCodigo !== undefined) updateObj.regla_codigo = data.reglaCodigo;
    if (data.reglas !== undefined) updateObj.reglas = data.reglas;
    if (data.nivelesAsignados !== undefined) updateObj.niveles_asignados = data.nivelesAsignados;

    if (data.svgRaw !== undefined) {
      updateObj.svg_raw = data.svgRaw;
      updateObj.tokens_detectados = plantillaService.detectarTokens(data.svgRaw);

      // Get current version to increment
      const { data: current } = await supabase
        .from('plantillas_certificado')
        .select('version')
        .eq('id', id)
        .single();

      const newVersion = (current?.version || 0) + 1;
      updateObj.version = newVersion;

      // Save version snapshot
      await supabase.from('plantilla_certificado_versiones').insert({
        plantilla_id: id,
        version: newVersion,
        svg_raw: data.svgRaw,
        modificado_por: 'admin',
      });
    }

    const { data: updated, error } = await supabase
      .from('plantillas_certificado')
      .update(updateObj)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Fetch full with versions
    return (await plantillaService.getById(id))!;
  },

  async rollback(id: string, version: number): Promise<PlantillaCertificado> {
    // Get the target version SVG
    const { data: entry, error: vErr } = await supabase
      .from('plantilla_certificado_versiones')
      .select('*')
      .eq('plantilla_id', id)
      .eq('version', version)
      .single();
    if (vErr) throw vErr;

    // Get current version
    const { data: current } = await supabase
      .from('plantillas_certificado')
      .select('version')
      .eq('id', id)
      .single();

    const newVersion = (current?.version || 0) + 1;

    // Save as new version
    await supabase.from('plantilla_certificado_versiones').insert({
      plantilla_id: id,
      version: newVersion,
      svg_raw: entry.svg_raw,
      modificado_por: 'admin',
    });

    // Update plantilla
    const { error } = await supabase
      .from('plantillas_certificado')
      .update({
        svg_raw: entry.svg_raw,
        tokens_detectados: plantillaService.detectarTokens(entry.svg_raw),
        version: newVersion,
      })
      .eq('id', id);
    if (error) throw error;

    return (await plantillaService.getById(id))!;
  },

  detectarTokens(svg: string): string[] {
    const matches = svg.match(/\{\{(.*?)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
  },
};
