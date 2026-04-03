import { v4 as uuid } from 'uuid';
import { Matricula, MatriculaFormData, EstadoMatricula, DocumentoRequerido } from '@/types/matricula';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a DB row (snake_case) to the frontend Matricula shape */
function rowToMatricula(row: any): Matricula {
  const m = snakeToCamel<any>(row);
  // Map firma_storage_path → firmaBase64 is not applicable; keep storage path
  // documentos come from a separate query
  return {
    ...m,
    firmaBase64: undefined, // firma lives in storage, not inline
    documentos: [], // populated separately
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
  // JSONB fields should stay as-is (camelToSnake skips them)
  return row;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const matriculaService = {
  async getAll(): Promise<Matricula[]> {
    const { data, error } = await supabase
      .from('matriculas')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return (data || []).map(rowToMatricula);
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
    const { data, error } = await supabase
      .from('matriculas')
      .select('*')
      .eq('persona_id', personaId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return (data || []).map(rowToMatricula);
  },

  async getByCursoId(cursoId: string): Promise<Matricula[]> {
    const { data, error } = await supabase
      .from('matriculas')
      .select('*')
      .eq('curso_id', cursoId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) handleSupabaseError(error);
    return (data || []).map(rowToMatricula);
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
      .insert(row)
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
      .update(row)
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
    // Map url_drive → storage_path
    if ('url_drive' in row) {
      row.storage_path = row.url_drive;
      delete row.url_drive;
    }
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
