import { supabase } from '@/integrations/supabase/client';
import { Empresa, EmpresaFormData, ContactoEmpresa, TarifaEmpresa, TarifaEmpresaFormData } from '@/types/empresa';
import { ApiError, snakeToCamel, camelToSnake, handleSupabaseError } from './api';

function mapContactoRow(row: any): ContactoEmpresa {
  return {
    id: row.id,
    nombre: row.nombre || '',
    telefono: row.telefono || '',
    email: row.email || '',
    esPrincipal: row.es_principal || false,
  };
}

async function loadContactos(empresaId: string): Promise<ContactoEmpresa[]> {
  const { data, error } = await supabase
    .from('contactos_empresa')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('es_principal', { ascending: false });
  if (error) handleSupabaseError(error);
  return (data || []).map(mapContactoRow);
}

async function saveContactos(empresaId: string, contactos: ContactoEmpresa[]): Promise<void> {
  // Delete existing
  const { error: delError } = await supabase
    .from('contactos_empresa')
    .delete()
    .eq('empresa_id', empresaId);
  if (delError) handleSupabaseError(delError);

  if (contactos.length === 0) return;

  // Insert new
  const rows = contactos.map(c => ({
    empresa_id: empresaId,
    nombre: c.nombre,
    telefono: c.telefono,
    email: c.email,
    es_principal: c.esPrincipal,
  }));
  const { error: insError } = await supabase
    .from('contactos_empresa')
    .insert(rows as any);
  if (insError) handleSupabaseError(insError);
}

function mapEmpresaRow(row: any): Empresa {
  return {
    id: row.id,
    nombreEmpresa: row.nombre_empresa,
    nit: row.nit,
    representanteLegal: row.representante_legal || '',
    sectorEconomico: row.sector_economico || '',
    arl: row.arl || '',
    direccion: row.direccion || '',
    telefonoEmpresa: row.telefono_contacto || '',
    contactos: [],
    personaContacto: row.persona_contacto || '',
    telefonoContacto: row.telefono_contacto || '',
    emailContacto: row.email_contacto || '',
    activo: row.activo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEmpresaToDb(data: Partial<EmpresaFormData>): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.nombreEmpresa !== undefined) result.nombre_empresa = data.nombreEmpresa;
  if (data.nit !== undefined) result.nit = data.nit;
  if (data.sectorEconomico !== undefined) result.sector_economico = data.sectorEconomico || null;
  if (data.arl !== undefined) result.arl = data.arl || null;
  if (data.personaContacto !== undefined) result.persona_contacto = data.personaContacto;
  if (data.emailContacto !== undefined) result.email_contacto = data.emailContacto;
  if (data.telefonoEmpresa !== undefined) result.telefono_contacto = data.telefonoEmpresa;
  if ((data as any).telefonoContacto !== undefined) result.telefono_contacto = (data as any).telefonoContacto;
  if (data.representanteLegal !== undefined) result.representante_legal = data.representanteLegal || null;
  if (data.direccion !== undefined) result.direccion = data.direccion;
  if ((data as any).activo !== undefined) result.activo = (data as any).activo;
  if ((data as any).observaciones !== undefined) result.observaciones = (data as any).observaciones;
  if ((data as any).ciudad !== undefined) result.ciudad = (data as any).ciudad;
  if ((data as any).departamento !== undefined) result.departamento = (data as any).departamento;
  return result;
}

export const empresaService = {
  async getAll(): Promise<Empresa[]> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*, contactos_empresa(*)')
      .is('deleted_at', null)
      .order('nombre_empresa');

    if (error) handleSupabaseError(error);
    return (data || []).map(row => {
      const empresa = mapEmpresaRow(row);
      empresa.contactos = ((row as any).contactos_empresa || []).map(mapContactoRow);
      return empresa;
    });
  },

  async getById(id: string): Promise<Empresa | null> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*, contactos_empresa(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    if (!data) return null;
    const empresa = mapEmpresaRow(data);
    empresa.contactos = ((data as any).contactos_empresa || []).map(mapContactoRow);
    return empresa;
  },

  async search(query: string): Promise<Empresa[]> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .is('deleted_at', null)
      .or(`nombre_empresa.ilike.%${query}%,nit.ilike.%${query}%,persona_contacto.ilike.%${query}%,email_contacto.ilike.%${query}%`)
      .order('nombre_empresa');

    if (error) handleSupabaseError(error);
    return (data || []).map(mapEmpresaRow);
  },

  async create(data: EmpresaFormData): Promise<Empresa> {
    const dbData = mapEmpresaToDb(data);
    const { data: row, error } = await supabase
      .from('empresas')
      .insert(dbData as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError('Ya existe una empresa con este NIT', 400, 'NIT_DUPLICADO');
      handleSupabaseError(error);
    }
    const empresa = mapEmpresaRow(row);

    // Save contactos
    if (data.contactos?.length) {
      await saveContactos(empresa.id, data.contactos);
      empresa.contactos = data.contactos;
    }

    return empresa;
  },

  async update(id: string, data: Partial<EmpresaFormData>): Promise<Empresa> {
    const dbData = mapEmpresaToDb(data);
    const { data: row, error } = await supabase
      .from('empresas')
      .update(dbData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError('Ya existe una empresa con este NIT', 400, 'NIT_DUPLICADO');
      handleSupabaseError(error);
    }
    const empresa = mapEmpresaRow(row);

    // Save contactos if provided
    if (data.contactos) {
      await saveContactos(id, data.contactos);
      empresa.contactos = data.contactos;
    }

    return empresa;
  },

  async createBulk(empresas: EmpresaFormData[]): Promise<{ created: number; errors: { row: number; error: string }[] }> {
    const errors: { row: number; error: string }[] = [];
    let created = 0;
    for (let i = 0; i < empresas.length; i++) {
      try {
        await this.create(empresas[i]);
        created++;
      } catch (err: any) {
        errors.push({ row: i + 2, error: err?.message || 'Error desconocido' });
      }
    }
    return { created, errors };
  },

  async delete(id: string): Promise<void> {
    // Soft delete
    const { error } = await supabase
      .from('empresas')
      .update({ deleted_at: new Date().toISOString(), activo: false })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },

  // ============ TARIFAS ============

  async getTarifas(empresaId: string): Promise<TarifaEmpresa[]> {
    const { data, error } = await supabase
      .from('tarifas_empresa')
      .select('*, niveles_formacion(nombre)')
      .eq('empresa_id', empresaId);

    if (error) handleSupabaseError(error);
    return (data || []).map((row: any) => ({
      id: row.id,
      empresaId: row.empresa_id,
      nivelFormacionId: row.nivel_formacion_id,
      nivelFormacionNombre: row.niveles_formacion?.nombre || '',
      valor: Number(row.valor),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async createTarifa(data: TarifaEmpresaFormData): Promise<TarifaEmpresa> {
    const { data: row, error } = await supabase
      .from('tarifas_empresa')
      .insert({
        empresa_id: data.empresaId,
        nivel_formacion_id: data.nivelFormacionId,
        valor: data.valor,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError('Ya existe una tarifa para esta combinación de empresa y nivel de formación', 400, 'TARIFA_DUPLICADA');
      handleSupabaseError(error);
    }
    return {
      id: row.id,
      empresaId: row.empresa_id,
      nivelFormacionId: row.nivel_formacion_id,
      nivelFormacionNombre: data.nivelFormacionNombre || '',
      valor: Number(row.valor),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async updateTarifa(id: string, data: Partial<TarifaEmpresaFormData>): Promise<TarifaEmpresa> {
    const dbData: Record<string, any> = {};
    if (data.empresaId) dbData.empresa_id = data.empresaId;
    if (data.nivelFormacionId) dbData.nivel_formacion_id = data.nivelFormacionId;
    if (data.valor !== undefined) dbData.valor = data.valor;

    const { data: row, error } = await supabase
      .from('tarifas_empresa')
      .update(dbData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError('Ya existe una tarifa para esta combinación de empresa y nivel de formación', 400, 'TARIFA_DUPLICADA');
      handleSupabaseError(error);
    }
    return {
      id: row.id,
      empresaId: row.empresa_id,
      nivelFormacionId: row.nivel_formacion_id,
      nivelFormacionNombre: '',
      valor: Number(row.valor),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async deleteTarifa(id: string): Promise<void> {
    const { error } = await supabase
      .from('tarifas_empresa')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },
};
