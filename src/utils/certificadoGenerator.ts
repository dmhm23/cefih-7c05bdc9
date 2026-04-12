import type { Matricula } from '@/types/matricula';
import type { Persona } from '@/types/persona';
import type { Curso } from '@/types/curso';
import type { FormatoFormacion } from '@/types/formatoFormacion';
import type { EstadoGrupoCartera } from '@/types/cartera';
import { ESTADO_GRUPO_CARTERA_LABELS } from '@/types/cartera';
import { resolveNivelCursoLabel } from '@/utils/resolveNivelLabel';
import { fmtDateLocal } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface ElegibilidadResult {
  elegible: boolean;
  advertenciaCartera: boolean;
  motivos: string[];          // bloqueos duros (docs, formatos)
  motivosCartera: string[];   // advertencias de cartera (permiten generar con confirmación)
}

/**
 * Datos opcionales de cartera y formatos para la evaluación de elegibilidad.
 */
export interface ElegibilidadContext {
  carteraStatus?: EstadoGrupoCartera;
  formatosRequeridos?: FormatoFormacion[];
  formatosCompletadosIds?: string[]; // IDs de formatos con respuesta completada
  portalDocsCompletados?: string[];  // documento_keys completados en documentos_portal
}

export function evaluarElegibilidad(
  matricula: Matricula,
  formatosDinamicos?: FormatoFormacion[],
  context?: ElegibilidadContext,
): ElegibilidadResult {
  const motivos: string[] = [];
  const motivosCartera: string[] = [];

  // --- Bloqueo duro: documentos obligatorios pendientes ---
  const docsIncompletos = matricula.documentos.some(
    (d) => !d.opcional && d.estado === 'pendiente'
  );
  if (docsIncompletos) {
    motivos.push('Documentos pendientes');
  }

  // --- Bloqueo duro: formatos de formación no completados ---
  if (context?.formatosRequeridos && context.formatosRequeridos.length > 0) {
    const completados = new Set(context.formatosCompletadosIds ?? []);
    const faltantes = context.formatosRequeridos.filter(f => !completados.has(f.id));
    if (faltantes.length > 0) {
      motivos.push('Formatos de formación incompletos');
    }
  } else if (formatosDinamicos && formatosDinamicos.length > 0) {
    // Legacy: si se pasan formatosDinamicos sin context, evaluar como antes (future stub)
  }

  // --- Advertencia: estado de cartera ---
  const cartera = context?.carteraStatus;
  if (cartera && cartera !== 'pagado') {
    const label = ESTADO_GRUPO_CARTERA_LABELS[cartera] ?? cartera;
    motivosCartera.push(`Cartera: ${label}`);
  } else if (!context?.carteraStatus && !matricula.pagado) {
    // Fallback legacy: si no se pasa cartera explícita, usar el booleano pagado
    motivosCartera.push('Pago pendiente');
  }

  const advertenciaCartera = motivosCartera.length > 0;
  const elegible = motivos.length === 0;

  return { elegible, advertenciaCartera, motivos, motivosCartera };
}

export function construirDiccionarioTokens(
  persona: Persona,
  curso: Curso,
  matricula: Matricula,
  codigoEstudiante?: string
): Record<string, string> {
  const fmt = (dateStr?: string) => {
    if (!dateStr) return '';
    return fmtDateLocal(dateStr, 'dd/MM/yyyy', es);
  };

  return {
    nombreCompleto: `${persona.nombres} ${persona.apellidos}`,
    nombres: persona.nombres,
    apellidos: persona.apellidos,
    tipoDocumento: persona.tipoDocumento,
    numeroDocumento: persona.numeroDocumento,
    numeroCurso: curso.numeroCurso,
    tipoFormacion: resolveNivelCursoLabel(curso.tipoFormacion),
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
    codigoCertificado: codigoEstudiante || '', // populated from centralized student code
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

/** @deprecated Use calcularCodigosCurso from codigoEstudiante.ts */
export function generarCodigoCertificado(
  curso: Curso,
  _matricula: Matricula,
  consecutivo: number = 1
): string {
  const year = new Date().getFullYear();
  return `${curso.numeroCurso}-${String(consecutivo).padStart(3, '0')}-${year}`;
}
