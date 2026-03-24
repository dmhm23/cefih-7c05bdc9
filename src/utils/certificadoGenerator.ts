import type { Matricula } from '@/types/matricula';
import type { Persona } from '@/types/persona';
import type { Curso } from '@/types/curso';
import type { FormatoFormacion } from '@/types/formatoFormacion';
import { resolveNivelCursoLabel } from '@/utils/resolveNivelLabel';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ElegibilidadResult {
  elegible: boolean;
  motivos: string[];
}

export function evaluarElegibilidad(
  matricula: Matricula,
  formatosDinamicos?: FormatoFormacion[]
): ElegibilidadResult {
  const motivos: string[] = [];

  if (!matricula.pagado) {
    motivos.push('Pago pendiente');
  }

  const docsIncompletos = matricula.documentos.some(
    (d) => !d.opcional && d.estado === 'pendiente'
  );
  if (docsIncompletos) {
    motivos.push('Documentos incompletos');
  }

  // Check formatos completados — simplified: if there are formatos configured,
  // we consider them complete for now (actual logic depends on formato state tracking)
  if (formatosDinamicos && formatosDinamicos.length > 0) {
    // Future: validate each formato has been filled
  }

  return { elegible: motivos.length === 0, motivos };
}

export function construirDiccionarioTokens(
  persona: Persona,
  curso: Curso,
  matricula: Matricula
): Record<string, string> {
  const fmt = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateStr;
    }
  };

  return {
    nombreCompleto: `${persona.nombres} ${persona.apellidos}`,
    nombres: persona.nombres,
    apellidos: persona.apellidos,
    tipoDocumento: persona.tipoDocumento,
    numeroDocumento: persona.numeroDocumento,
    numeroCurso: curso.numeroCurso,
    tipoFormacion: TIPO_FORMACION_LABELS[curso.tipoFormacion] || curso.tipoFormacion,
    fechaInicio: fmt(curso.fechaInicio),
    fechaFin: fmt(curso.fechaFin),
    duracionDias: String(curso.duracionDias),
    horasTotales: String(curso.horasTotales),
    entrenadorNombre: curso.entrenadorNombre || '',
    supervisorNombre: curso.supervisorNombre || '',
    empresaNombre: matricula.empresaNombre || '',
    empresaNit: matricula.empresaNit || '',
    empresaCargo: matricula.empresaCargo || '',
    fechaGeneracion: fmt(new Date().toISOString()),
    codigoCertificado: '', // se rellena después
  };
}

export function reemplazarTokens(
  svgRaw: string,
  diccionario: Record<string, string>
): string {
  return svgRaw.replace(/\{\{(\w+)\}\}/g, (match, token) => {
    return diccionario[token] ?? match;
  });
}

export function generarCodigoCertificado(
  curso: Curso,
  _matricula: Matricula,
  consecutivo: number = 1
): string {
  const year = new Date().getFullYear();
  return `${curso.numeroCurso}-${String(consecutivo).padStart(3, '0')}-${year}`;
}
