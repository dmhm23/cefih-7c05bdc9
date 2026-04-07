import { supabase } from '@/integrations/supabase/client';
import { Personal, PersonalFormData, Cargo, CargoFormData, TipoCargo, AdjuntoPersonal } from '@/types/personal';
import { ApiError, handleSupabaseError } from './api';

function mapPersonalRow(row: any, cargoNombre?: string): Personal {
  return {
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    cargoId: row.cargo_id,
    cargoNombre: cargoNombre || '',
    firmaBase64: undefined, // Firma now uses storage, handled separately
    adjuntos: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCargoRow(row: any): Cargo {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo as TipoCargo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAdjuntoRow(row: any): AdjuntoPersonal {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo_mime || '',
    tamano: row.tamano || 0,
    fechaCarga: row.fecha_carga,
    storagePath: row.storage_path || undefined,
  };
}

export const personalService = {
  // ============ PERSONAL ============
  async getAll(): Promise<Personal[]> {
    const { data, error } = await supabase
      .from('personal')
      .select('*, cargos(nombre)')
      .is('deleted_at', null)
      .order('nombres');

    if (error) handleSupabaseError(error);
    return (data || []).map(row => mapPersonalRow(row, (row as any).cargos?.nombre));
  },

  async getById(id: string): Promise<Personal | null> {
    const { data: row, error } = await supabase
      .from('personal')
      .select('*, cargos(nombre)')
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    if (!row) return null;

    const personal = mapPersonalRow(row, (row as any).cargos?.nombre);

    // Load adjuntos
    const { data: adjuntos } = await supabase
      .from('personal_adjuntos')
      .select('*')
      .eq('personal_id', id);

    const mappedAdjuntos = (adjuntos || []).map(mapAdjuntoRow);

    // Generate signed URLs for each adjunto
    for (const adj of mappedAdjuntos) {
      if (adj.storagePath) {
        const { data: signedUrl } = await supabase.storage
          .from('adjuntos-personal')
          .createSignedUrl(adj.storagePath, 3600);
        if (signedUrl?.signedUrl) {
          adj.dataUrl = signedUrl.signedUrl;
        }
      }
    }

    personal.adjuntos = mappedAdjuntos;

    // Load firma from storage if path exists
    if (row.firma_storage_path) {
      const { data: signedUrl } = await supabase.storage
        .from('firmas')
        .createSignedUrl(row.firma_storage_path, 3600);
      if (signedUrl?.signedUrl) {
        personal.firmaBase64 = signedUrl.signedUrl;
      }
    }

    return personal;
  },

  async getByTipoCargo(tipo: TipoCargo): Promise<Personal[]> {
    const { data: cargos } = await supabase
      .from('cargos')
      .select('id')
      .eq('tipo', tipo)
      .is('deleted_at', null);

    if (!cargos?.length) return [];
    const cargoIds = cargos.map(c => c.id);

    const { data, error } = await supabase
      .from('personal')
      .select('*, cargos(nombre)')
      .in('cargo_id', cargoIds)
      .is('deleted_at', null);

    if (error) handleSupabaseError(error);
    return (data || []).map(row => mapPersonalRow(row, (row as any).cargos?.nombre));
  },

  async create(data: PersonalFormData): Promise<Personal> {
    const { data: row, error } = await supabase
      .from('personal')
      .insert({
        nombres: data.nombres,
        apellidos: data.apellidos,
        cargo_id: data.cargoId,
        numero_documento: '',
      })
      .select('*, cargos(nombre)')
      .single();

    if (error) handleSupabaseError(error);
    return mapPersonalRow(row, (row as any).cargos?.nombre);
  },

  async update(id: string, data: Partial<PersonalFormData>): Promise<Personal> {
    const dbData: Record<string, any> = {};
    if (data.nombres !== undefined) dbData.nombres = data.nombres;
    if (data.apellidos !== undefined) dbData.apellidos = data.apellidos;
    if (data.cargoId !== undefined) dbData.cargo_id = data.cargoId;

    const { data: row, error } = await supabase
      .from('personal')
      .update(dbData as any)
      .eq('id', id)
      .select('*, cargos(nombre)')
      .single();

    if (error) handleSupabaseError(error);
    return mapPersonalRow(row, (row as any).cargos?.nombre);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('personal')
      .update({ deleted_at: new Date().toISOString(), activo: false })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },

  // ============ FIRMA ============
  async updateFirma(id: string, firmaBase64: string): Promise<Personal> {
    // Upload firma to storage
    const path = `personal/${id}/firma.png`;
    const base64Data = firmaBase64.replace(/^data:image\/\w+;base64,/, '');
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const { error: uploadError } = await supabase.storage
      .from('firmas')
      .upload(path, binaryData, { contentType: 'image/png', upsert: true });

    if (uploadError) throw new ApiError('Error al subir la firma', 500);

    const { data: row, error } = await supabase
      .from('personal')
      .update({ firma_storage_path: path })
      .eq('id', id)
      .select('*, cargos(nombre)')
      .single();

    if (error) handleSupabaseError(error);
    const personal = mapPersonalRow(row, (row as any).cargos?.nombre);
    personal.firmaBase64 = firmaBase64;
    return personal;
  },

  async deleteFirma(id: string): Promise<Personal> {
    // Get current path
    const { data: current } = await supabase
      .from('personal')
      .select('firma_storage_path')
      .eq('id', id)
      .single();

    if (current?.firma_storage_path) {
      await supabase.storage.from('firmas').remove([current.firma_storage_path]);
    }

    const { data: row, error } = await supabase
      .from('personal')
      .update({ firma_storage_path: null })
      .eq('id', id)
      .select('*, cargos(nombre)')
      .single();

    if (error) handleSupabaseError(error);
    return mapPersonalRow(row, (row as any).cargos?.nombre);
  },

  // ============ ADJUNTOS ============
  async addAdjunto(personalId: string, file: File): Promise<AdjuntoPersonal> {
    const path = `personal/${personalId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('adjuntos-personal')
      .upload(path, file);

    if (uploadError) throw new ApiError('Error al subir el archivo', 500);

    const { data: row, error } = await supabase
      .from('personal_adjuntos')
      .insert({
        personal_id: personalId,
        nombre: file.name,
        tipo_mime: file.type,
        tamano: file.size,
        storage_path: path,
      })
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return mapAdjuntoRow(row);
  },

  async deleteAdjunto(personalId: string, adjuntoId: string): Promise<void> {
    // Get storage path
    const { data: adjunto } = await supabase
      .from('personal_adjuntos')
      .select('storage_path')
      .eq('id', adjuntoId)
      .single();

    if (adjunto?.storage_path) {
      await supabase.storage.from('adjuntos-personal').remove([adjunto.storage_path]);
    }

    const { error } = await supabase
      .from('personal_adjuntos')
      .delete()
      .eq('id', adjuntoId);

    if (error) handleSupabaseError(error);
  },

  // ============ CARGOS ============
  async getAllCargos(): Promise<Cargo[]> {
    const { data, error } = await supabase
      .from('cargos')
      .select('*')
      .is('deleted_at', null)
      .order('nombre');

    if (error) handleSupabaseError(error);
    return (data || []).map(mapCargoRow);
  },

  async createCargo(data: CargoFormData): Promise<Cargo> {
    const { data: row, error } = await supabase
      .from('cargos')
      .insert({
        nombre: data.nombre,
        tipo: data.tipo,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError('Ya existe un rol con ese nombre', 400, 'CARGO_DUPLICADO');
      handleSupabaseError(error);
    }
    return mapCargoRow(row);
  },

  async updateCargo(id: string, data: Partial<CargoFormData>): Promise<Cargo> {
    const { data: row, error } = await supabase
      .from('cargos')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return mapCargoRow(row);
  },

  async deleteCargo(id: string): Promise<void> {
    // Check if in use
    const { data: inUse } = await supabase
      .from('personal')
      .select('id')
      .eq('cargo_id', id)
      .is('deleted_at', null)
      .limit(1);

    if (inUse && inUse.length > 0) {
      throw new ApiError('No se puede eliminar un rol que está asignado a personal activo', 400, 'CARGO_EN_USO');
    }

    const { error } = await supabase
      .from('cargos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },
};
