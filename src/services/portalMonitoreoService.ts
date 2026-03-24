import { mockMatriculas, mockPersonas, mockCursos } from '@/data/mockData';
import { portalDocumentosCatalogo } from '@/data/portalAdminConfig';
import { TipoFormacion } from '@/types/curso';
import { resolveNivelCursoLabel, getNivelesAsOptions } from '@/utils/resolveNivelLabel';
import { EstadoDocPortal } from '@/types/portalEstudiante';

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
  await new Promise((r) => setTimeout(r, 200));

  let rows: MonitoreoRow[] = mockMatriculas.map((mat) => {
    const persona = mockPersonas.find((p) => p.id === mat.personaId);
    const curso = mockCursos.find((c) => c.id === mat.cursoId);
    if (!persona || !curso) return null;

    const docsHabilitados = portalDocumentosCatalogo.filter(
      (d) => d.habilitadoPorNivel[curso.tipoFormacion]
    );

    const documentosEstado: MonitoreoDocEstado[] = docsHabilitados.map((docConfig) => {
      const portalDoc = mat.portalEstudiante?.documentos.find((d) => d.key === docConfig.key);
      return {
        key: docConfig.key,
        nombre: docConfig.nombre,
        estado: portalDoc?.estado ?? 'pendiente',
        enviadoEn: portalDoc?.enviadoEn,
        puntaje: portalDoc?.puntaje,
        firmaBase64: portalDoc?.firmaBase64,
      };
    });

    return {
      matriculaId: mat.id,
      personaNombre: `${persona.nombres} ${persona.apellidos}`,
      personaCedula: persona.numeroDocumento,
      cursoNombre: curso.nombre,
      cursoNumeroCurso: curso.numeroCurso,
      tipoFormacion: curso.tipoFormacion,
      tipoFormacionLabel: resolveNivelCursoLabel(curso.tipoFormacion),
      fechaInicio: curso.fechaInicio,
      fechaFin: curso.fechaFin,
      portalHabilitado: mat.portalEstudiante?.habilitado ?? false,
      documentosEstado,
    } as MonitoreoRow;
  }).filter(Boolean) as MonitoreoRow[];

  // Apply filters
  if (filtros?.busqueda) {
    const q = filtros.busqueda.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.personaNombre.toLowerCase().includes(q) ||
        r.personaCedula.includes(q) ||
        r.cursoNumeroCurso.toLowerCase().includes(q)
    );
  }
  if (filtros?.cursoId && filtros.cursoId !== 'todos') {
    rows = rows.filter((r) => {
      const curso = mockCursos.find((c) => c.numeroCurso === r.cursoNumeroCurso);
      return curso?.id === filtros.cursoId;
    });
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

export function getFilterOptions() {
  const cursos = mockCursos.map((c) => ({ value: c.id, label: `${c.numeroCurso} — ${c.nombre}` }));
  const niveles = Object.entries(TIPO_FORMACION_LABELS).map(([value, label]) => ({ value, label }));
  const documentos = portalDocumentosCatalogo.map((d) => ({ value: d.key, label: d.nombre }));
  return { cursos, niveles, documentos };
}
