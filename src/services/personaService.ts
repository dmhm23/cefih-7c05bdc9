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
    let updated = 0;
    let skipped = 0;
    const total = personas.length;

    onLog?.('info', `Procesando ${total} registro(s) — modo: ${updateExisting ? 'actualizar existentes' : 'omitir existentes'}`);

    // Separar nuevos vs existentes
    const nuevos: { p: PersonaFormData; originalIdx: number }[] = [];
    const existentes: { p: PersonaFormData; originalIdx: number }[] = [];
    for (let i = 0; i < total; i++) {
      const p = personas[i];
      if (existingDocs.has(p.numeroDocumento)) {
        existentes.push({ p, originalIdx: i });
      } else {
        nuevos.push({ p, originalIdx: i });
      }
    }

    let processedCount = 0;

    // 1) Procesar existentes (omitir o actualizar uno por uno)
    if (existentes.length > 0) {
      if (!updateExisting) {
        skipped = existentes.length;
        onLog?.('info', `Omitiendo ${skipped} registro(s) ya existente(s)`);
        processedCount += existentes.length;
        onProgress?.(processedCount, total);
      } else {
        onLog?.('info', `Actualizando ${existentes.length} registro(s) existente(s) (uno por uno)`);
        for (const { p, originalIdx } of existentes) {
          const label = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || '(sin nombre)';
          const t0 = performance.now();
          try {
            const id = await this.getIdByDocumento(p.numeroDocumento);
            if (id) {
              await this.update(id, p);
              const dt = Math.round(performance.now() - t0);
              onLog?.('success', `[${originalIdx + 1}] Actualizado "${label}" en ${dt}ms`);
              updated++;
            } else {
              onLog?.('warn', `[${originalIdx + 1}] No se encontró ID para "${label}"`);
              skipped++;
            }
          } catch (err: any) {
            const msg = err?.message || 'Error desconocido';
            onLog?.('error', `[${originalIdx + 1}] Falló actualización "${label}" — ${msg}`);
            errors.push({ row: originalIdx + 2, error: msg });
          }
          processedCount++;
          onProgress?.(processedCount, total);
        }
      }
    }

    // 2) Insertar nuevos por lotes
    const batchResult = await this._batchInsert(
      nuevos.map(n => n.p),
      processedCount,
      (current, _t) => onProgress?.(current, total),
      onLog,
      nuevos.map(n => n.originalIdx),
    );

    return {
      created: batchResult.created,
      updated,
      skipped,
      errors: [...errors, ...batchResult.errors],
    };
  },

  /**
   * Inserción por lotes. Reduce 1 request/fila a 1 request/CHUNK_SIZE filas.
   * Si un lote falla, hace fallback fila a fila para identificar la culpable.
   */
  async _batchInsert(
    personas: PersonaFormData[],
    progressOffset: number,
    onProgress?: (current: number, total: number) => void,
    onLog?: (level: 'info' | 'success' | 'warn' | 'error' | 'debug', msg: string, meta?: Record<string, any>) => void,
    originalIndices?: number[],
  ): Promise<{ created: number; errors: { row: number; error: string }[] }> {
    const CHUNK_SIZE = 100;
    const errors: { row: number; error: string }[] = [];
    let created = 0;
    const total = personas.length;
    if (total === 0) return { created, errors };

    const startTs = performance.now();
    const totalLotes = Math.ceil(total / CHUNK_SIZE);
    onLog?.('info', `Insertando ${total} registro(s) en ${totalLotes} lote(s) de hasta ${CHUNK_SIZE}`);

    let processed = 0;
    for (let loteIdx = 0; loteIdx < totalLotes; loteIdx++) {
      const start = loteIdx * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, total);
      const chunk = personas.slice(start, end);
      const indices = originalIndices ? originalIndices.slice(start, end) : null;

      const t0 = performance.now();
      onLog?.('debug', `Lote ${loteIdx + 1}/${totalLotes}: enviando ${chunk.length} registro(s)…`);

      const dbRows = chunk.map(p => mapPersonaToDb(p));
      const { data, error } = await supabase
        .from('personas')
        .insert(dbRows as any)
        .select('id, numero_documento');

      if (error) {
        const dt = Math.round(performance.now() - t0);
        onLog?.('warn', `Lote ${loteIdx + 1}/${totalLotes} falló en ${dt}ms — ${error.message}. Reintentando fila por fila…`);
        // Fallback fila a fila para identificar las culpables
        for (let j = 0; j < chunk.length; j++) {
          const p = chunk[j];
          const label = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || '(sin nombre)';
          const rowOrig = indices ? indices[j] + 1 : start + j + 1;
          const tFila = performance.now();
          try {
            await this.create(p);
            const dtFila = Math.round(performance.now() - tFila);
            onLog?.('success', `[${rowOrig}] OK individual "${label}" en ${dtFila}ms`);
            created++;
          } catch (err: any) {
            const msg = err?.message || 'Error desconocido';
            onLog?.('error', `[${rowOrig}] Falló "${label}" — ${msg}`);
            errors.push({ row: (indices ? indices[j] : start + j) + 2, error: msg });
          }
          processed++;
          onProgress?.(progressOffset + processed, total);
        }
      } else {
        const dt = Math.round(performance.now() - t0);
        const inserted = data?.length || chunk.length;
        const promedio = Math.round(dt / inserted);
        onLog?.('success', `Lote ${loteIdx + 1}/${totalLotes} OK: ${inserted} reg en ${dt}ms (~${promedio}ms/reg)`);
        created += inserted;
        processed += chunk.length;
        onProgress?.(progressOffset + processed, total);
      }

      // Throughput global cada lote
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
