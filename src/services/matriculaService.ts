import { supabase } from '@/integrations/supabase/client';
import { Matricula, MatriculaFormData, EstadoMatricula, DocumentoRequerido } from '@/types/matricula';
import { ApiError, snakeToCamel, camelToSnake, handleSupabaseError } from './api';
import { fetchAllPaginated } from './_paginated';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a DB row (snake_case) to the frontend Matricula shape */
function rowToMatricula(row: any): Matricula {
  // Extract embedded documentos_matricula (if present from join) before snakeToCamel
  const embeddedDocs = Array.isArray(row?.documentos_matricula) ? row.documentos_matricula : null;
  const { documentos_matricula: _omit, personas: _omitP, ...rest } = row ?? {};
  const m = snakeToCamel<any>(rest);

  // Map embedded docs to partial DocumentoRequerido shape (fields needed by list views)
  const documentos = embeddedDocs
    ? embeddedDocs.map((d: any) => snakeToCamel<DocumentoRequerido>(d))
    : [];

  return {
    ...m,
    firmaBase64: undefined, // firma lives in storage, not inline
    documentos, // partial when from list query, full when from getById
  } as Matricula;
}

/** Map frontend form data → DB columns (snake_case), stripping non-DB fields */
function formToRow(data: Record<string, any>): Record<string, any> {
  const row = camelToSnake(data);
  // Remove fields that don't exist in the DB table
  delete row.documentos;
  delete row.firma_base64;
  delete row.created_at;
  delete row.updated_at;
  delete row.id;
  delete row.empresa_contacto_id; // not a DB column

  // Sanitize empty strings to null for UUID columns
  const uuidFields = ['curso_id', 'empresa_id', 'persona_id', 'nivel_formacion_id'];
  for (const f of uuidFields) {
    if (row[f] === '') row[f] = null;
  }

  // Strip undefined values
  for (const key of Object.keys(row)) {
    if (row[key] === undefined) delete row[key];
  }

  // JSONB fields should stay as-is (camelToSnake skips them)
  return row;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const matriculaService = {
  async getAll(): Promise<Matricula[]> {
    try {
      const data = await fetchAllPaginated<any>((from, to) =>
        supabase
          .from('matriculas')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(from, to),
      );
      return data.map(rowToMatricula);
    } catch (error: any) {
      handleSupabaseError(error);
      return [];
    }
  },

  /**
   * Página server-side con búsqueda y filtros aplicados en BD.
   *
   * - search: multi-término AND sobre nombres, apellidos, numero_documento, telefono
   *   (usa join inner a personas para poder filtrar)
   * - tipoVinculacion: 'todos' | 'sin_asignar' | EstadoVinculacion
   * - nivelFormacionId: 'todos' | UUID
   * - estadoCurso: 'todos' | 'asignado' | 'sin_asignar'
   *
   * Devuelve también un mapa persona resumido (id → {nombres, apellidos, numero_documento})
   * para evitar tener que cargar todas las personas en el cliente.
   */
  async getPage(params: {
    page: number;
    pageSize: number;
    search?: string;
    tipoVinculacion?: string;
    nivelFormacionId?: string;
    estadoCurso?: string;
  }): Promise<{
    rows: Matricula[];
    total: number;
    personasResumen: Record<string, { nombres: string; apellidos: string; numeroDocumento: string }>;
  }> {
    const {
      page,
      pageSize,
      search = '',
      tipoVinculacion = 'todos',
      nivelFormacionId = 'todos',
      estadoCurso = 'todos',
    } = params;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    try {
      let query = supabase
        .from('matriculas')
        .select(
          `*, personas!inner(id, nombres, apellidos, numero_documento, telefono)`,
          { count: 'exact' },
        )
        .is('deleted_at', null);

      // Búsqueda multi-término (AND) sobre los campos de la persona
      const terms = search.trim().split(/\s+/).filter(Boolean);
      for (const term of terms) {
        const escaped = term.replace(/[%_,()]/g, '\\$&');
        query = query.or(
          `nombres.ilike.%${escaped}%,apellidos.ilike.%${escaped}%,numero_documento.ilike.%${escaped}%,telefono.ilike.%${escaped}%`,
          { foreignTable: 'personas' },
        );
      }

      if (tipoVinculacion !== 'todos') {
        if (tipoVinculacion === 'sin_asignar') {
          query = query.is('tipo_vinculacion', null);
        } else {
          query = query.eq('tipo_vinculacion', tipoVinculacion as any);
        }
      }

      if (nivelFormacionId !== 'todos') {
        query = query.eq('nivel_formacion_id', nivelFormacionId);
      }

      if (estadoCurso === 'asignado') {
        query = query.not('curso_id', 'is', null);
      } else if (estadoCurso === 'sin_asignar') {
        query = query.is('curso_id', null);
      }

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error, count } = await query;
      if (error) handleSupabaseError(error);

      const rows = (data || []).map(rowToMatricula);
      const personasResumen: Record<string, { nombres: string; apellidos: string; numeroDocumento: string }> = {};
      for (const row of (data || []) as any[]) {
        const p = row.personas;
        if (p?.id) {
          personasResumen[p.id] = {
            nombres: p.nombres || '',
            apellidos: p.apellidos || '',
            numeroDocumento: p.numero_documento || '',
          };
        }
      }

      return { rows, total: count ?? rows.length, personasResumen };
    } catch (error: any) {
      handleSupabaseError(error);
      return { rows: [], total: 0, personasResumen: {} };
    }
  },

  async getById(id: string): Promise<Matricula | null> {
    const { data, error } = await supabase
      .from('matriculas')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    if (!data) return null;

    // Fetch documents
    const { data: docs } = await supabase
      .from('documentos_matricula')
      .select('*')
      .eq('matricula_id', id);

    const matricula = rowToMatricula(data);
    matricula.documentos = (docs || []).map((d: any) => snakeToCamel<DocumentoRequerido>(d));
    return matricula;
  },

  async getByPersonaId(personaId: string): Promise<Matricula[]> {
    try {
      const data = await fetchAllPaginated<any>((from, to) =>
        supabase
          .from('matriculas')
          .select('*')
          .eq('persona_id', personaId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(from, to),
      );
      return data.map(rowToMatricula);
    } catch (error: any) {
      handleSupabaseError(error);
      return [];
    }
  },

  async getByCursoId(cursoId: string): Promise<Matricula[]> {
    try {
      const data = await fetchAllPaginated<any>((from, to) =>
        supabase
          .from('matriculas')
          .select('*')
          .eq('curso_id', cursoId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .range(from, to),
      );
      return data.map(rowToMatricula);
    } catch (error: any) {
      handleSupabaseError(error);
      return [];
    }
  },

  async getByEstado(estado: EstadoMatricula): Promise<Matricula[]> {
    const { data, error } = await supabase
      .from('matriculas')
      .select('*')
      .eq('estado', estado)
      .is('deleted_at', null);

    if (error) handleSupabaseError(error);
    return (data || []).map(rowToMatricula);
  },

  async getHistorialByPersona(personaId: string): Promise<Matricula | null> {
    const { data, error } = await supabase
      .from('matriculas')
      .select('*')
      .eq('persona_id', personaId)
      .in('estado', ['completa', 'certificada', 'cerrada'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) handleSupabaseError(error);
    if (!data) return null;
    return rowToMatricula(data);
  },

  async create(data: Omit<MatriculaFormData, 'documentos' | 'estado'>): Promise<Matricula> {
    const row = formToRow(data as any);
    // Always start as 'creada'
    row.estado = 'creada';

    const { data: inserted, error } = await supabase
      .from('matriculas')
      .insert(row as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ApiError('Esta persona ya está matriculada en este curso', 400, 'MATRICULA_DUPLICADA');
      }
      handleSupabaseError(error);
    }

    return rowToMatricula(inserted);
  },

  async update(id: string, data: Partial<MatriculaFormData>): Promise<Matricula> {
    const row = formToRow(data as any);

    const { data: updated, error } = await supabase
      .from('matriculas')
      .update(row as any)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToMatricula(updated);
  },

  async updateDocumento(
    matriculaId: string,
    documentoId: string,
    data: Partial<DocumentoRequerido>
  ): Promise<Matricula> {
    const row = camelToSnake(data);
    delete row.id;

    const { error } = await supabase
      .from('documentos_matricula')
      .update(row)
      .eq('id', documentoId)
      .eq('matricula_id', matriculaId);

    if (error) handleSupabaseError(error);

    // Return updated matricula
    return (await this.getById(matriculaId))!;
  },

  async capturarFirma(id: string, firmaBase64: string): Promise<Matricula> {
    // Upload firma to storage
    const path = `firmas-matricula/${id}.png`;
    const blob = await fetch(firmaBase64).then(r => r.blob());

    const { error: uploadError } = await supabase.storage
      .from('documentos-matricula')
      .upload(path, blob, { upsert: true, contentType: 'image/png' });

    if (uploadError) throw new ApiError('Error al subir firma: ' + uploadError.message, 500);

    const { data: updated, error } = await supabase
      .from('matriculas')
      .update({ firma_capturada: true, firma_storage_path: path })
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToMatricula(updated);
  },

  async registrarPago(id: string, datosPago: {
    facturaNumero?: string;
    valorCupo?: number;
    abono?: number;
    fechaFacturacion?: string;
    ctaFactNumero?: string;
    ctaFactTitular?: string;
    fechaPago?: string;
    formaPago?: string;
    cobroContactoNombre?: string;
    cobroContactoCelular?: string;
  }): Promise<Matricula> {
    const row = camelToSnake(datosPago);
    // Map formaPago → forma_pago (already done by camelToSnake)
    if (!row.fecha_pago) {
      row.fecha_pago = new Date().toISOString().split('T')[0];
    }

    const { data: updated, error } = await supabase
      .from('matriculas')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToMatricula(updated);
  },

  async cambiarEstado(id: string, nuevoEstado: EstadoMatricula): Promise<Matricula> {
    const { data: updated, error } = await supabase
      .from('matriculas')
      .update({ estado: nuevoEstado })
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return rowToMatricula(updated);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('matriculas')
      .update({ deleted_at: new Date().toISOString(), activo: false })
      .eq('id', id);

    if (error) handleSupabaseError(error);
  },
};
