import { supabase } from '@/integrations/supabase/client';
import { Persona, PersonaFormData } from '@/types/persona';
import { ApiError, handleSupabaseError } from './api';

// Map DB enum values to frontend display values
const TIPO_DOC_DB_TO_FE: Record<string, string> = {
  cedula_ciudadania: 'CC',
  cedula_extranjeria: 'CE',
  pasaporte: 'PA',
  tarjeta_identidad: 'PE',
  pep: 'PP',
};

const TIPO_DOC_FE_TO_DB: Record<string, string> = {
  CC: 'cedula_ciudadania',
  CE: 'cedula_extranjeria',
  PA: 'pasaporte',
  PE: 'tarjeta_identidad',
  PP: 'pep',
};

const GENERO_DB_TO_FE: Record<string, string> = {
  masculino: 'M',
  femenino: 'F',
  otro: 'O',
};

const GENERO_FE_TO_DB: Record<string, string> = {
  M: 'masculino',
  F: 'femenino',
  O: 'otro',
};

function mapPersonaRow(row: any): Persona {
  return {
    id: row.id,
    tipoDocumento: (TIPO_DOC_DB_TO_FE[row.tipo_documento] || 'CC') as any,
    numeroDocumento: row.numero_documento,
    nombres: row.nombres,
    apellidos: row.apellidos,
    genero: (GENERO_DB_TO_FE[row.genero] || 'M') as any,
    paisNacimiento: row.pais_nacimiento || '',
    fechaNacimiento: row.fecha_nacimiento || '',
    rh: row.rh || '',
    nivelEducativo: row.nivel_educativo || 'primaria',
    email: row.email || '',
    telefono: row.telefono || '',
    contactoEmergencia: row.contacto_emergencia || { nombre: '', telefono: '', parentesco: '' },
    firma: row.firma_storage_path || undefined,
    firmaFecha: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPersonaToDb(data: Partial<PersonaFormData>): Record<string, any> {
  const result: Record<string, any> = {};
  if (data.tipoDocumento !== undefined) result.tipo_documento = TIPO_DOC_FE_TO_DB[data.tipoDocumento] || 'cedula_ciudadania';
  if (data.numeroDocumento !== undefined) result.numero_documento = data.numeroDocumento;
  if (data.nombres !== undefined) result.nombres = data.nombres;
  if (data.apellidos !== undefined) result.apellidos = data.apellidos;
  if (data.genero !== undefined) result.genero = GENERO_FE_TO_DB[data.genero] || 'masculino';
  if (data.fechaNacimiento !== undefined) result.fecha_nacimiento = data.fechaNacimiento || null;
  if (data.nivelEducativo !== undefined) result.nivel_educativo = data.nivelEducativo || null;
  if (data.email !== undefined) result.email = data.email;
  if (data.telefono !== undefined) result.telefono = data.telefono;
  if (data.contactoEmergencia !== undefined) {
    const ce = data.contactoEmergencia || { nombre: '', telefono: '', parentesco: '' };
    const nombre = (ce.nombre || '').trim();
    const telefono = (ce.telefono || '').trim();
    // El trigger DB exige nombre+telefono juntos si se envía contacto. Si está incompleto, enviar {}.
    result.contacto_emergencia = (nombre && telefono) ? ce : {};
  }
  if (data.paisNacimiento !== undefined) result.pais_nacimiento = data.paisNacimiento || null;
  if (data.rh !== undefined) result.rh = data.rh || null;
  return result;
}

export const personaService = {
  async getAll(): Promise<Persona[]> {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .is('deleted_at', null)
      .order('nombres');

    if (error) handleSupabaseError(error);
    return (data || []).map(mapPersonaRow);
  },

  async getById(id: string): Promise<Persona | null> {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data ? mapPersonaRow(data) : null;
  },

  async getByDocumento(numeroDocumento: string): Promise<Persona | null> {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('numero_documento', numeroDocumento)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    return data ? mapPersonaRow(data) : null;
  },

  async search(query: string): Promise<Persona[]> {
    const tokens = query.trim().split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return [];

    let dbQuery = supabase
      .from('personas')
      .select('*')
      .is('deleted_at', null);

    for (const token of tokens) {
      dbQuery = dbQuery.or(`nombres.ilike.%${token}%,apellidos.ilike.%${token}%,numero_documento.ilike.%${token}%,telefono.ilike.%${token}%`);
    }

    const { data, error } = await dbQuery.order('nombres');

    if (error) handleSupabaseError(error);
    return (data || []).map(mapPersonaRow);
  },

  async create(data: PersonaFormData): Promise<Persona> {
    const dbData = mapPersonaToDb(data);
    const { data: row, error } = await supabase
      .from('personas')
      .insert(dbData as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError('Ya existe una persona con este documento', 400, 'DOCUMENTO_DUPLICADO');
      handleSupabaseError(error);
    }
    return mapPersonaRow(row);
  },

  async update(id: string, data: Partial<PersonaFormData>): Promise<Persona> {
    const dbData = mapPersonaToDb(data);
    const { data: row, error } = await supabase
      .from('personas')
      .update(dbData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return mapPersonaRow(row);
  },

  async createBulk(
    personas: PersonaFormData[],
    onProgress?: (current: number, total: number) => void,
    onLog?: (level: 'info' | 'success' | 'warn' | 'error' | 'debug', msg: string, meta?: Record<string, any>) => void,
  ): Promise<{ created: number; errors: { row: number; error: string }[] }> {
    const result = await this._batchInsert(personas, 0, onProgress, onLog);
    return { created: result.created, errors: result.errors };
  },

  async checkExisting(documentos: string[]): Promise<Set<string>> {
    if (documentos.length === 0) return new Set();
    // Supabase .in() has a limit, chunk in batches of 500
    const result = new Set<string>();
    for (let i = 0; i < documentos.length; i += 500) {
      const chunk = documentos.slice(i, i + 500);
      const { data, error } = await supabase
        .from('personas')
        .select('numero_documento')
        .in('numero_documento', chunk)
        .is('deleted_at', null);
      if (error) handleSupabaseError(error);
      (data || []).forEach(r => result.add(r.numero_documento));
    }
    return result;
  },

  async getIdByDocumento(numeroDocumento: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('personas')
      .select('id')
      .eq('numero_documento', numeroDocumento)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) handleSupabaseError(error);
    return data?.id || null;
  },

  async upsertBulk(
    personas: PersonaFormData[],
    existingDocs: Set<string>,
    updateExisting: boolean,
    onProgress?: (current: number, total: number) => void,
    onLog?: (level: 'info' | 'success' | 'warn' | 'error' | 'debug', msg: string, meta?: Record<string, any>) => void,
  ): Promise<{ created: number; updated: number; skipped: number; errors: { row: number; error: string }[] }> {
    const errors: { row: number; error: string }[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const total = personas.length;
    const startTs = performance.now();

    onLog?.('info', `Procesando ${total} registro(s) — modo: ${updateExisting ? 'actualizar existentes' : 'omitir existentes'}`);

    for (let i = 0; i < total; i++) {
      const p = personas[i];
      const label = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || '(sin nombre)';
      const idx = `[${i + 1}/${total}]`;
      const t0 = performance.now();
      try {
        if (existingDocs.has(p.numeroDocumento)) {
          if (updateExisting) {
            onLog?.('debug', `${idx} Actualizando "${label}" (${p.tipoDocumento} ${p.numeroDocumento})`);
            const id = await this.getIdByDocumento(p.numeroDocumento);
            if (id) {
              await this.update(id, p);
              const dt = Math.round(performance.now() - t0);
              onLog?.('success', `${idx} Actualizado en ${dt}ms`);
              updated++;
            } else {
              onLog?.('warn', `${idx} No se encontró ID para "${label}", omitido`);
              skipped++;
            }
          } else {
            onLog?.('debug', `${idx} Omitido "${label}" (ya existe)`);
            skipped++;
          }
        } else {
          onLog?.('debug', `${idx} Insertando "${label}" (${p.tipoDocumento} ${p.numeroDocumento})`);
          await this.create(p);
          const dt = Math.round(performance.now() - t0);
          onLog?.('success', `${idx} Creado en ${dt}ms`);
          created++;
        }
      } catch (err: any) {
        const dt = Math.round(performance.now() - t0);
        const msg = err?.message || 'Error desconocido';
        onLog?.('error', `${idx} Falló "${label}" en ${dt}ms — ${msg}`);
        errors.push({ row: i + 2, error: msg });
      }
      onProgress?.(i + 1, total);

      // Throughput cada 10 registros
      if ((i + 1) % 10 === 0 && i + 1 < total) {
        const elapsedSec = (performance.now() - startTs) / 1000;
        const rps = (i + 1) / elapsedSec;
        const remaining = Math.round((total - (i + 1)) / rps);
        onLog?.(
          'info',
          `Throughput: ${rps.toFixed(1)} reg/s — ETA ~${remaining}s (${i + 1}/${total})`,
        );
      }
    }
    return { created, updated, skipped, errors };
  },

  async delete(id: string): Promise<void> {
    // Verificar si tiene matrículas asociadas
    const { count, error: countError } = await supabase
      .from('matriculas')
      .select('id', { count: 'exact', head: true })
      .eq('persona_id', id)
      .is('deleted_at', null);

    if (countError) handleSupabaseError(countError);
    if ((count ?? 0) > 0) {
      throw new ApiError(
        'No se puede eliminar: esta persona tiene matrículas asociadas',
        400,
        'PERSONA_CON_MATRICULAS'
      );
    }

    // Soft delete
    const { error } = await supabase
      .from('personas')
      .update({ deleted_at: new Date().toISOString(), activo: false })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },
};
