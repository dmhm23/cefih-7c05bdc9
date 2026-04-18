import { supabase } from '@/integrations/supabase/client';
import { Empresa, EmpresaFormData, ContactoEmpresa, TarifaEmpresa, TarifaEmpresaFormData } from '@/types/empresa';
import { ApiError, snakeToCamel, camelToSnake, handleSupabaseError } from './api';
import { fetchAllPaginated } from './_paginated';

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
    try {
      const data = await fetchAllPaginated<any>((from, to) =>
        supabase
          .from('empresas')
          .select('*, contactos_empresa(*)')
          .is('deleted_at', null)
          .order('nombre_empresa')
          .range(from, to),
      );
      return data.map(row => {
        const empresa = mapEmpresaRow(row);
        empresa.contactos = ((row as any).contactos_empresa || []).map(mapContactoRow);
        return empresa;
      });
    } catch (error: any) {
      handleSupabaseError(error);
      return [];
    }
  },

  /**
   * Paginación server-side con búsqueda y filtros para listados grandes.
   * Devuelve un page de empresas + total. Trae contactos para el listado.
   */
  async getPage(params: {
    page: number;
    pageSize: number;
    search?: string;
    sectorEconomico?: string;
    arl?: string;
  }): Promise<{ rows: Empresa[]; total: number }> {
    const { page, pageSize, search, sectorEconomico, arl } = params;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('empresas')
      .select('*, contactos_empresa(*)', { count: 'exact' })
      .is('deleted_at', null);

    if (sectorEconomico && sectorEconomico !== 'todos') {
      query = query.eq('sector_economico', sectorEconomico as any);
    }
    if (arl && arl !== 'todos') {
      query = query.eq('arl', arl as any);
    }

    if (search && search.trim()) {
      const tokens = search.trim().split(/\s+/).filter(t => t.length > 0);
      for (const token of tokens) {
        const safe = token.replace(/[%,()]/g, '');
        query = query.or(
          `nombre_empresa.ilike.%${safe}%,nit.ilike.%${safe}%,persona_contacto.ilike.%${safe}%,email_contacto.ilike.%${safe}%`
        );
      }
    }

    const { data, error, count } = await query.order('nombre_empresa').range(from, to);
    if (error) handleSupabaseError(error);
    const rows = (data || []).map(row => {
      const empresa = mapEmpresaRow(row);
      empresa.contactos = ((row as any).contactos_empresa || []).map(mapContactoRow);
      return empresa;
    });
    return { rows, total: count ?? 0 };
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
    try {
      const data = await fetchAllPaginated<any>((from, to) =>
        supabase
          .from('empresas')
          .select('*')
          .is('deleted_at', null)
          .or(`nombre_empresa.ilike.%${query}%,nit.ilike.%${query}%,persona_contacto.ilike.%${query}%,email_contacto.ilike.%${query}%`)
          .order('nombre_empresa')
          .range(from, to),
      );
      return data.map(mapEmpresaRow);
    } catch (error: any) {
      handleSupabaseError(error);
      return [];
    }
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

  async createBulk(
    empresas: EmpresaFormData[],
    onProgress?: (current: number, total: number) => void,
    onLog?: (level: 'info' | 'success' | 'warn' | 'error' | 'debug', msg: string, meta?: Record<string, any>) => void,
  ): Promise<{ created: number; errors: { row: number; error: string }[] }> {
    const CHUNK_SIZE = 100;
    const errors: { row: number; error: string }[] = [];
    let created = 0;
    const total = empresas.length;
    if (total === 0) return { created, errors };

    const startTs = performance.now();
    const totalLotes = Math.ceil(total / CHUNK_SIZE);
    onLog?.('info', `Insertando ${total} empresa(s) en ${totalLotes} lote(s) de hasta ${CHUNK_SIZE}`);

    let processed = 0;
    for (let loteIdx = 0; loteIdx < totalLotes; loteIdx++) {
      const start = loteIdx * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, total);
      const chunk = empresas.slice(start, end);

      const t0 = performance.now();
      onLog?.('debug', `Lote ${loteIdx + 1}/${totalLotes}: enviando ${chunk.length} empresa(s)…`);

      // NOTA: insert batch sin contactos. Los contactos se insertan después por empresa.
      const dbRows = chunk.map(e => mapEmpresaToDb(e));
      const { data, error } = await supabase
        .from('empresas')
        .insert(dbRows as any)
        .select('id, nit');

      if (error) {
        const dt = Math.round(performance.now() - t0);
        onLog?.('warn', `Lote ${loteIdx + 1}/${totalLotes} falló en ${dt}ms — ${error.message}. Reintentando fila por fila…`);
        for (let j = 0; j < chunk.length; j++) {
          const e = chunk[j];
          const label = e.nombreEmpresa || '(sin nombre)';
          const rowOrig = start + j + 1;
          const tFila = performance.now();
          try {
            await this.create(e);
            const dtFila = Math.round(performance.now() - tFila);
            onLog?.('success', `[${rowOrig}] OK individual "${label}" en ${dtFila}ms`);
            created++;
          } catch (err: any) {
            const msg = err?.message || 'Error desconocido';
            onLog?.('error', `[${rowOrig}] Falló "${label}" — ${msg}`);
            errors.push({ row: start + j + 2, error: msg });
          }
          processed++;
          onProgress?.(processed, total);
        }
      } else {
        const dt = Math.round(performance.now() - t0);
        const inserted = data?.length || chunk.length;
        const promedio = Math.round(dt / inserted);
        onLog?.('success', `Lote ${loteIdx + 1}/${totalLotes} OK: ${inserted} empresa(s) en ${dt}ms (~${promedio}ms/reg)`);

        // Insertar contactos en bloque para las empresas que los traen
        const empresasConContactos: { id: string; contactos: any[] }[] = [];
        const nitToId = new Map<string, string>();
        (data || []).forEach((r: any) => nitToId.set(r.nit, r.id));
        for (const e of chunk) {
          const id = nitToId.get(e.nit);
          if (id && e.contactos?.length) {
            empresasConContactos.push({ id, contactos: e.contactos });
          }
        }
        if (empresasConContactos.length > 0) {
          const contactRows = empresasConContactos.flatMap(ec =>
            ec.contactos.map(c => ({
              empresa_id: ec.id,
              nombre: c.nombre,
              telefono: c.telefono,
              email: c.email,
              es_principal: c.esPrincipal,
            })),
          );
          const { error: cErr } = await supabase.from('contactos_empresa').insert(contactRows as any);
          if (cErr) {
            onLog?.('warn', `Contactos del lote ${loteIdx + 1}: ${cErr.message}`);
          } else {
            onLog?.('debug', `Lote ${loteIdx + 1}: ${contactRows.length} contacto(s) insertado(s)`);
          }
        }

        created += inserted;
        processed += chunk.length;
        onProgress?.(processed, total);
      }

      const elapsedSec = (performance.now() - startTs) / 1000;
      if (elapsedSec > 0 && processed < total) {
        const rps = processed / elapsedSec;
        const remaining = Math.round((total - processed) / Math.max(rps, 0.1));
        onLog?.('info', `Throughput: ${rps.toFixed(1)} reg/s — ETA ~${remaining}s (${processed}/${total})`);
      }
    }

    const totalSec = ((performance.now() - startTs) / 1000).toFixed(1);
    onLog?.('info', `Inserción completada: ${created} OK, ${errors.length} error(es) en ${totalSec}s`);
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
