import { supabase } from '@/integrations/supabase/client';
import { DocumentoRequerido } from '@/types/matricula';
import { snakeToCamel, handleSupabaseError, camelToSnake } from './api';

/**
 * Genera la lista dinámica de documentos requeridos según el nivel de formación.
 * Consulta la tabla niveles_formacion para obtener los requisitos configurados.
 */
export async function getDocumentosRequeridos(
  nivelFormacionId?: string
): Promise<Omit<DocumentoRequerido, 'id'>[]> {
  if (!nivelFormacionId) {
    return [{ tipo: 'cedula', nombre: 'Cédula de Ciudadanía', estado: 'pendiente' }];
  }

  const { data: nivel, error } = await supabase
    .from('niveles_formacion')
    .select('documentos_requeridos')
    .eq('id', nivelFormacionId)
    .maybeSingle();

  if (error || !nivel) {
    return [{ tipo: 'cedula', nombre: 'Cédula de Ciudadanía', estado: 'pendiente' }];
  }

  const CATALOGO_LABELS: Record<string, string> = {
    cedula: 'Cédula de Ciudadanía',
    certificado_eps: 'Certificado EPS',
    certificado_arl: 'Certificado ARL',
    arl: 'ARL',
    certificado_pension: 'Certificado Pensión',
    examen_medico: 'Examen Médico Ocupacional',
    certificado_alturas: 'Certificado de Alturas Previo',
    carta_autorizacion: 'Carta de Autorización',
    planilla_seguridad_social: 'Planilla de Seguridad Social',
    curso_previo: 'Certificado Curso Previo',
    consolidado: 'Consolidado',
    otro: 'Otro documento',
  };

  const reqs = (nivel.documentos_requeridos || []) as string[];
  return reqs.map(key => ({
    tipo: key as DocumentoRequerido['tipo'],
    nombre: CATALOGO_LABELS[key] || key,
    estado: 'pendiente' as const,
    opcional: key === 'planilla_seguridad_social' ? true : undefined,
  }));
}

/**
 * Crea los documentos requeridos para una matrícula recién creada.
 */
export async function crearDocumentosMatricula(
  matriculaId: string,
  nivelFormacionId?: string
): Promise<DocumentoRequerido[]> {
  const requisitos = await getDocumentosRequeridos(nivelFormacionId);

  if (requisitos.length === 0) return [];

  const rows = requisitos.map(r => ({
    matricula_id: matriculaId,
    tipo: r.tipo as any,
    nombre: r.nombre,
    estado: 'pendiente' as const,
    opcional: r.opcional || false,
  }));

  const { data, error } = await supabase
    .from('documentos_matricula')
    .upsert(rows, { onConflict: 'matricula_id,tipo', ignoreDuplicates: true })
    .select();

  if (error) handleSupabaseError(error);
  return (data || []).map((d: any) => snakeToCamel<DocumentoRequerido>(d));
}

/**
 * Sincroniza los documentos de una matrícula con los requisitos vigentes del nivel.
 * Añade requisitos faltantes sin alterar los existentes.
 */
export async function sincronizarDocumentos(
  matriculaId: string,
  nivelFormacionId?: string
): Promise<{ documentos: DocumentoRequerido[]; huboCambios: boolean }> {
  // Get current docs
  const { data: currentDocs } = await supabase
    .from('documentos_matricula')
    .select('*')
    .eq('matricula_id', matriculaId);

  const existentes = (currentDocs || []).map((d: any) => snakeToCamel<DocumentoRequerido>(d));
  const tiposExistentes = new Set(existentes.map(d => d.tipo));

  const requisitos = await getDocumentosRequeridos(nivelFormacionId);
  const tiposRequeridos = new Set(requisitos.map(r => r.tipo));

  let huboCambios = false;

  // 1. Add missing documents
  const nuevos = requisitos.filter(r => !tiposExistentes.has(r.tipo));
  if (nuevos.length > 0) {
    const rows = nuevos.map(r => ({
      matricula_id: matriculaId,
      tipo: r.tipo as any,
      nombre: r.nombre,
      estado: 'pendiente' as const,
      opcional: r.opcional || false,
    }));

    await supabase
      .from('documentos_matricula')
      .upsert(rows, { onConflict: 'matricula_id,tipo', ignoreDuplicates: true })
      .select();

    huboCambios = true;
  }

  // 2. Remove documents that are no longer required AND still pending (no file uploaded)
  const sobrantes = existentes.filter(
    d => !tiposRequeridos.has(d.tipo) && d.estado === 'pendiente' && !d.archivoNombre
  );
  if (sobrantes.length > 0) {
    const ids = sobrantes.map(d => d.id);
    await supabase
      .from('documentos_matricula')
      .delete()
      .in('id', ids);

    huboCambios = true;
  }

  if (!huboCambios) {
    return { documentos: existentes, huboCambios: false };
  }

  // Re-fetch to return the current state
  const { data: updatedDocs } = await supabase
    .from('documentos_matricula')
    .select('*')
    .eq('matricula_id', matriculaId);

  const documentos = (updatedDocs || []).map((d: any) => snakeToCamel<DocumentoRequerido>(d));
  return { documentos, huboCambios: true };
}
