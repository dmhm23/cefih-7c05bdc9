import { supabase } from '@/integrations/supabase/client';
import { TipoFormacion } from '@/types/curso';
import { EstadoDocPortal } from '@/types/portalEstudiante';
import { resolveNivelCursoLabel } from '@/utils/resolveNivelLabel';

export interface MonitoreoDocEstado {
  key: string;
  nombre: string;
  estado: EstadoDocPortal;
  enviadoEn?: string;
  puntaje?: number;
  firmaBase64?: string;
}

export interface MonitoreoRow {
  matriculaId: string;
  personaNombre: string;
  personaCedula: string;
  cursoNombre: string;
  cursoNumeroCurso: string;
  tipoFormacion: TipoFormacion;
  tipoFormacionLabel: string;
  fechaInicio: string;
  fechaFin: string;
  portalHabilitado: boolean;
  documentosEstado: MonitoreoDocEstado[];
}

export interface MonitoreoFiltros {
  busqueda?: string;
  cursoId?: string;
  tipoFormacion?: string;
  documentoPendiente?: string;
}

export async function getMonitoreoData(filtros?: MonitoreoFiltros): Promise<MonitoreoRow[]> {
  // Get all matriculas with persona and curso joins
  let query = supabase
    .from('matriculas')
    .select('id, persona_id, curso_id, portal_estudiante, personas(id, nombres, apellidos, numero_documento), cursos(id, nombre, tipo_formacion, fecha_inicio, fecha_fin)')
    .is('deleted_at', null)
    .eq('activo', true);

  if (filtros?.cursoId && filtros.cursoId !== 'todos') {
    query = query.eq('curso_id', filtros.cursoId);
  }

  const { data: matriculas, error: mErr } = await query;
  if (mErr) throw mErr;

  // Get portal config
  const { data: configDocs } = await supabase
    .from('portal_config_documentos')
    .select('*')
    .eq('activo', true)
    .order('orden');

  // Get all documentos_portal for the matricula IDs
  const matIds = (matriculas || []).map((m: any) => m.id);
  let portalDocs: any[] = [];
  if (matIds.length > 0) {
    const { data } = await supabase
      .from('documentos_portal')
      .select('*')
      .in('matricula_id', matIds);
    portalDocs = data || [];
  }

  let rows: MonitoreoRow[] = (matriculas || []).map((mat: any) => {
    const persona = mat.personas as any;
    const curso = mat.cursos as any;
    if (!persona || !curso) return null;

    const nivelFormacionId = curso.nivel_formacion_id as string | null;

    // Filter config by nivel — empty niveles_habilitados = global (all levels)
    const docsHabilitados = (configDocs || []).filter((d: any) => {
      const niveles: string[] = d.niveles_habilitados || [];
      return niveles.length === 0 || (nivelFormacionId && niveles.includes(nivelFormacionId));
    });

    const matPortalDocs = portalDocs.filter(d => d.matricula_id === mat.id);

    const documentosEstado: MonitoreoDocEstado[] = docsHabilitados.map((docConfig: any) => {
      const portalDoc = matPortalDocs.find((d: any) => d.documento_key === docConfig.key);
      return {
        key: docConfig.key,
        nombre: docConfig.label,
        estado: (portalDoc?.estado as EstadoDocPortal) ?? 'pendiente',
        enviadoEn: portalDoc?.enviado_en ?? undefined,
        puntaje: portalDoc?.metadata?.puntaje ?? undefined,
        firmaBase64: portalDoc?.firma_data ?? undefined,
      };
    });

    const portalEstudiante = mat.portal_estudiante as any;

    return {
      matriculaId: mat.id,
      personaNombre: `${persona.nombres} ${persona.apellidos}`,
      personaCedula: persona.numero_documento,
      cursoNombre: curso.nombre,
      cursoNumeroCurso: curso.nombre, // Using nombre as identifier
      tipoFormacion,
      tipoFormacionLabel: resolveNivelCursoLabel(tipoFormacion),
      fechaInicio: curso.fecha_inicio || '',
      fechaFin: curso.fecha_fin || '',
      portalHabilitado: portalEstudiante?.habilitado ?? true,
      documentosEstado,
    } as MonitoreoRow;
  }).filter(Boolean) as MonitoreoRow[];

  // Apply client-side filters
  if (filtros?.busqueda) {
    const q = filtros.busqueda.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.personaNombre.toLowerCase().includes(q) ||
        r.personaCedula.includes(q) ||
        r.cursoNombre.toLowerCase().includes(q)
    );
  }
  if (filtros?.tipoFormacion && filtros.tipoFormacion !== 'todos') {
    rows = rows.filter((r) => r.tipoFormacion === filtros.tipoFormacion);
  }
  if (filtros?.documentoPendiente && filtros.documentoPendiente !== 'todos') {
    rows = rows.filter((r) =>
      r.documentosEstado.some(
        (d) => d.key === filtros.documentoPendiente && d.estado !== 'completado'
      )
    );
  }

  return rows;
}

export async function getFilterOptions() {
  const { data: cursos } = await supabase
    .from('cursos')
    .select('id, nombre')
    .is('deleted_at', null)
    .order('nombre');

  const { data: configDocs } = await supabase
    .from('portal_config_documentos')
    .select('key, label')
    .eq('activo', true)
    .order('orden');

  const niveles = [
    { value: 'formacion_inicial', label: 'Formación Inicial' },
    { value: 'reentrenamiento', label: 'Reentrenamiento' },
    { value: 'jefe_area', label: 'Jefe de Área' },
    { value: 'coordinador_alturas', label: 'Coordinador de Alturas' },
  ];

  return {
    cursos: (cursos || []).map((c: any) => ({ value: c.id, label: c.nombre })),
    niveles,
    documentos: (configDocs || []).map((d: any) => ({ value: d.key, label: d.label })),
  };
}
