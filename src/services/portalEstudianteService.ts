import { supabase } from '@/integrations/supabase/client';
import { DocumentoPortalConfig, DocumentoPortalEstado } from '@/types/portalEstudiante';
import { Matricula } from '@/types/matricula';
import { Persona } from '@/types/persona';
import { Curso } from '@/types/curso';
import { FormatoFormacion } from '@/types/formatoFormacion';

export type LoginResultado = 'ok' | 'persona_no_encontrada' | 'sin_curso' | 'curso_cerrado' | 'portal_deshabilitado';

export interface MatriculaVigenteResult {
  matricula: Matricula;
  persona: Persona;
  curso: Curso;
  resultado: LoginResultado;
}

// Helper to map DB row to frontend Matricula (minimal fields needed for portal)
function mapMinimalMatricula(row: any): Matricula {
  return {
    id: row.matricula_id,
    personaId: row.persona_id,
    cursoId: row.curso_id,
    portalEstudiante: {
      habilitado: row.portal_habilitado ?? true,
      documentos: [],
    },
  } as unknown as Matricula;
}

function mapMinimalPersona(row: any): Persona {
  return {
    id: row.persona_id,
    nombres: row.persona_nombres,
    apellidos: row.persona_apellidos,
    numeroDocumento: row.persona_numero_documento,
  } as unknown as Persona;
}

function mapMinimalCurso(row: any): Curso {
  return {
    id: row.curso_id,
    nombre: row.curso_nombre,
    tipoFormacion: row.curso_tipo_formacion,
  } as unknown as Curso;
}

export const portalEstudianteService = {
  async buscarMatriculaVigente(cedula: string): Promise<{ resultado: LoginResultado; data?: MatriculaVigenteResult }> {
    const { data, error } = await supabase.rpc('login_portal_estudiante', { p_cedula: cedula });
    if (error) throw error;
    if (!data || data.length === 0) return { resultado: 'persona_no_encontrada' };

    const row = data[0];
    const resultado = (row.resultado || 'persona_no_encontrada') as LoginResultado;

    if (resultado !== 'ok') {
      return { resultado };
    }

    if (!row.portal_habilitado) {
      return { resultado: 'portal_deshabilitado' };
    }

    return {
      resultado: 'ok',
      data: {
        matricula: mapMinimalMatricula(row),
        persona: mapMinimalPersona(row),
        curso: mapMinimalCurso(row),
        resultado: 'ok',
      },
    };
  },

  async getDocumentosEstado(matriculaId: string): Promise<{
    config: DocumentoPortalConfig[];
    estados: DocumentoPortalEstado[];
  }> {
    const { data, error } = await supabase.rpc('get_documentos_portal', { p_matricula_id: matriculaId });
    if (error) throw error;

    const rows = data || [];
    const config: DocumentoPortalConfig[] = rows.map((row: any) => ({
      key: row.documento_key,
      nombre: row.label,
      tipo: row.tipo,
      requiereFirma: row.tipo === 'firma_autorizacion',
      dependeDe: row.depende_de || [],
      orden: row.orden,
      formatoId: row.formato_id || null,
    }));

    const estados: DocumentoPortalEstado[] = rows.map((row: any) => ({
      key: row.documento_key,
      estado: row.estado,
      enviadoEn: row.enviado_en ?? undefined,
      firmaBase64: row.firma_data ?? undefined,
      metadata: row.metadata || {},
      intentos: row.intentos || [],
    }));

    return { config, estados };
  },

  async enviarDocumento(
    matriculaId: string,
    documentoKey: string,
    payload: Partial<DocumentoPortalEstado>
  ): Promise<DocumentoPortalEstado> {
    const now = new Date().toISOString();

    // Determine estado
    let finalEstado: 'completado' | 'pendiente' = 'completado';
    if (documentoKey === 'evaluacion' && payload.metadata && (payload.metadata as any).aprobado === false) {
      finalEstado = 'pendiente';
    }

    // Check if existing record
    const { data: existing } = await supabase
      .from('documentos_portal')
      .select('*')
      .eq('matricula_id', matriculaId)
      .eq('documento_key', documentoKey)
      .maybeSingle();

    // For evaluacion, accumulate attempts
    let intentos: any[] = [];
    if (documentoKey === 'evaluacion' && existing) {
      const prevIntentos = Array.isArray(existing.intentos) ? existing.intentos : [];
      intentos = [...prevIntentos, {
        estado: existing.estado,
        enviado_en: existing.enviado_en,
        metadata: existing.metadata,
      }];
    }

    const upsertData = {
      matricula_id: matriculaId,
      documento_key: documentoKey,
      estado: finalEstado,
      enviado_en: now,
      firma_data: payload.firmaBase64 || null,
      metadata: payload.metadata || {},
      intentos: documentoKey === 'evaluacion' && intentos.length > 0 ? intentos : [],
    };

    const { data: result, error } = await supabase
      .from('documentos_portal')
      .upsert(upsertData as any, { onConflict: 'matricula_id,documento_key' })
      .select()
      .single();
    if (error) throw error;

    // Client-side sync: if this document has a linked formato_id, also upsert formato_respuestas
    if (finalEstado === 'completado') {
      try {
        const { data: configDoc } = await supabase
          .from('portal_config_documentos')
          .select('formato_id')
          .eq('key', documentoKey)
          .not('formato_id', 'is', null)
          .maybeSingle();

        if (configDoc?.formato_id) {
          await supabase
            .from('formato_respuestas')
            .upsert({
              matricula_id: matriculaId,
              formato_id: configDoc.formato_id,
              estado: 'completado',
              answers: payload.metadata || {},
              completado_at: now,
            } as any, { onConflict: 'matricula_id,formato_id' });
        }
      } catch {
        // Non-critical: trigger should handle this; log silently
        console.warn('Client-side sync to formato_respuestas failed (trigger should handle it)');
      }
    }

    return {
      key: documentoKey,
      estado: result.estado as any,
      enviadoEn: result.enviado_en ?? undefined,
      firmaBase64: result.firma_data ?? undefined,
      metadata: result.metadata as any || {},
    };
  },

  async getInfoAprendizData(matriculaId: string): Promise<{
    persona: Persona;
    matricula: Matricula;
    curso: Curso;
  }> {
    // Get matricula with joins
    const { data: mat, error: mErr } = await supabase
      .from('matriculas')
      .select('*, personas(*), cursos(*)')
      .eq('id', matriculaId)
      .single();
    if (mErr) throw mErr;

    const persona = mat.personas as any;
    const curso = mat.cursos as any;

    return {
      persona: {
        id: persona.id,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        numeroDocumento: persona.numero_documento,
        tipoDocumento: persona.tipo_documento,
        email: persona.email,
        telefono: persona.telefono,
        fechaNacimiento: persona.fecha_nacimiento,
        genero: persona.genero,
        nivelEducativo: persona.nivel_educativo,
        contactoEmergencia: persona.contacto_emergencia,
      } as unknown as Persona,
      matricula: {
        id: mat.id,
        personaId: mat.persona_id,
        cursoId: mat.curso_id,
        empresaId: mat.empresa_id,
        empresaNombre: mat.empresa_nombre,
        empresaNit: mat.empresa_nit,
        arl: mat.arl,
        eps: mat.eps,
        tipoVinculacion: mat.tipo_vinculacion,
        areaTrabajo: mat.area_trabajo,
        sectorEconomico: mat.sector_economico,
      } as unknown as Matricula,
      curso: {
        id: curso.id,
        nombre: curso.nombre,
        tipoFormacion: curso.tipo_formacion,
        fechaInicio: curso.fecha_inicio,
        fechaFin: curso.fecha_fin,
      } as unknown as Curso,
    };
  },

  async getEvaluacionFormato(matriculaId: string): Promise<{
    formato: FormatoFormacion;
    persona: Persona;
    matricula: Matricula;
    curso: Curso;
  } | null> {
    // Get matricula data
    const { data: mat, error: mErr } = await supabase
      .from('matriculas')
      .select('*, personas(*), cursos(*)')
      .eq('id', matriculaId)
      .single();
    if (mErr) throw mErr;

    const curso = mat.cursos as any;
    if (!curso) return null;

    // Find an evaluation format applicable to this course
    const { data: formatos } = await supabase
      .from('formatos_formacion')
      .select('*')
      .eq('activo', true)
      .eq('estado', 'activo')
      .is('deleted_at', null);

    const formato = (formatos || []).find((f: any) => {
      const bloques = Array.isArray(f.bloques) ? f.bloques : [];
      const hasQuiz = bloques.some((bl: any) => bl.type === 'evaluation_quiz');
      if (!hasQuiz) return false;

      if (f.asignacion_scope === 'tipo_curso') {
        return (f.tipos_curso || []).includes(curso.tipo_formacion);
      }
      // For nivel_formacion scope, check niveles_asignados
      if (f.asignacion_scope === 'nivel_formacion' && curso.nivel_formacion_id) {
        return (f.niveles_asignados || []).includes(curso.nivel_formacion_id);
      }
      return false;
    });

    if (!formato) return null;

    const persona = mat.personas as any;

    return {
      formato: formato as unknown as FormatoFormacion,
      persona: {
        id: persona.id,
        nombres: persona.nombres,
        apellidos: persona.apellidos,
        numeroDocumento: persona.numero_documento,
      } as unknown as Persona,
      matricula: { id: mat.id, personaId: mat.persona_id, cursoId: mat.curso_id } as unknown as Matricula,
      curso: { id: curso.id, nombre: curso.nombre, tipoFormacion: curso.tipo_formacion } as unknown as Curso,
    };
  },
};
