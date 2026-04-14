import { AutoFieldKey } from '@/types/formatoFormacion';
import { Persona } from '@/types/persona';
import { Matricula } from '@/types/matricula';
import { Curso, TIPO_FORMACION_LABELS } from '@/types/curso';
import { Personal } from '@/types/personal';
import {
  TIPOS_DOCUMENTO,
  GENEROS,
  NIVELES_EDUCATIVOS,
  PAISES,
  TIPOS_VINCULACION,
  NIVELES_PREVIOS,
  SECTORES_ECONOMICOS,
  AREAS_TRABAJO,
  EPS_OPTIONS,
  ARL_OPTIONS,
} from '@/data/formOptions';
import { resolveNivelFormacionLabel } from '@/utils/resolveNivelLabel';
import { fmtDateLocal } from '@/utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { FormatoRespuesta, FirmaMatricula } from '@/types/formatoFormacion';

export interface AutoFieldContext {
  persona: Persona | null;
  matricula: Matricula | null;
  curso: Curso | null;
  entrenador: Personal | null;
  supervisor: Personal | null;
  nivelFormacionNombre?: string | null;
  /** Respuestas de formatos previos para herencia de datos */
  respuestasPrevias?: FormatoRespuesta[];
  /** Campos adicionales del nivel de formación */
  camposAdicionalesNivel?: { key: string; label: string; value?: string }[];
  /** Firmas por matrícula (nueva tabla firmas_matricula) */
  firmasMatricula?: FirmaMatricula[];
}

function lookup(value: string | undefined, options: readonly { value: string; label: string }[]): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

function fmtDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const result = fmtDateLocal(dateStr, 'd/MM/yyyy', es);
  return result === "—" ? null : result;
}

export function resolveAutoFieldValue(key: AutoFieldKey, ctx: AutoFieldContext): string | null {
  const { persona, matricula, curso, entrenador, supervisor } = ctx;

  // --- Dynamic: Formatos previos (key format: "formato_prev:{formatoId}:{fieldKey}") ---
  if (key.startsWith('formato_prev:')) {
    const parts = key.split(':');
    if (parts.length >= 3 && ctx.respuestasPrevias) {
      const [, formatoId, fieldKey] = parts;
      const resp = ctx.respuestasPrevias.find(r => r.formatoId === formatoId);
      if (resp?.answers) {
        const val = (resp.answers as Record<string, unknown>)[fieldKey];
        return val != null ? String(val) : null;
      }
    }
    return null;
  }

  // --- Dynamic: Campos adicionales del nivel (key format: "nivel_campo:{key}") ---
  if (key.startsWith('nivel_campo:')) {
    const campoKey = key.replace('nivel_campo:', '');
    if (ctx.camposAdicionalesNivel) {
      const campo = ctx.camposAdicionalesNivel.find(c => c.key === campoKey);
      return campo?.value ?? null;
    }
    return null;
  }

  switch (key) {
    // --- Aprendiz ---
    case 'nombre_aprendiz':
      return persona ? `${persona.nombres} ${persona.apellidos}` : null;
    case 'documento_aprendiz':
      return persona?.numeroDocumento ?? null;
    case 'tipo_documento_aprendiz':
      return lookup(persona?.tipoDocumento, TIPOS_DOCUMENTO);
    case 'genero_aprendiz':
      return lookup(persona?.genero, GENEROS);
    case 'fecha_nacimiento_aprendiz':
      return fmtDate(persona?.fechaNacimiento);
    case 'pais_nacimiento_aprendiz':
      return lookup(persona?.paisNacimiento, PAISES);
    case 'nivel_educativo_aprendiz':
      return lookup(persona?.nivelEducativo, NIVELES_EDUCATIVOS);
    case 'rh_aprendiz':
      return persona?.rh ?? null;
    case 'telefono_aprendiz':
      return persona?.telefono ?? null;
    case 'email_aprendiz':
      return persona?.email ?? null;
    case 'contacto_emergencia_nombre':
      return persona?.contactoEmergencia?.nombre ?? null;
    case 'contacto_emergencia_telefono':
      return persona?.contactoEmergencia?.telefono ?? null;

    // --- Datos laborales ---
    case 'empresa_nombre':
      return matricula?.empresaNombre ?? null;
    case 'empresa_cargo':
      return matricula?.empresaCargo ?? null;
    case 'empresa_nit':
      return matricula?.empresaNit ?? null;
    case 'empresa_representante_legal':
      return matricula?.empresaRepresentanteLegal ?? null;
    case 'area_trabajo':
      return lookup(matricula?.areaTrabajo, AREAS_TRABAJO);
    case 'sector_economico':
      return lookup(matricula?.sectorEconomico, SECTORES_ECONOMICOS);
    case 'tipo_vinculacion':
      return lookup(matricula?.tipoVinculacion, TIPOS_VINCULACION);
    case 'eps_aprendiz':
      return lookup(matricula?.eps, EPS_OPTIONS);
    case 'arl_aprendiz':
      return lookup(matricula?.arl, ARL_OPTIONS);
    case 'nivel_previo':
      return lookup(matricula?.nivelPrevio, NIVELES_PREVIOS);
    case 'centro_formacion_previo':
      return matricula?.centroFormacionPrevio ?? null;
    case 'empresa_nivel_formacion':
      if (ctx.nivelFormacionNombre) return ctx.nivelFormacionNombre;
      const nivelId = matricula?.nivelFormacionId || matricula?.empresaNivelFormacion;
      if (nivelId) {
        const resolved = resolveNivelFormacionLabel(nivelId);
        return resolved || nivelId;
      }
      return null;

    // --- Curso ---
    case 'nombre_curso':
      return curso?.nombre ?? (matricula?.cursoId ? 'Sin datos de curso' : null);
    case 'tipo_formacion_curso':
      return curso?.tipoFormacion ? (TIPO_FORMACION_LABELS[curso.tipoFormacion] ?? curso.tipoFormacion) : null;
    case 'numero_curso':
      return curso?.numeroCurso ?? null;
    case 'fecha_inicio_curso':
      return curso ? fmtDate(curso?.fechaInicio) : (matricula?.cursoId ? 'Sin datos aún' : null);
    case 'fecha_fin_curso':
      return curso ? fmtDate(curso?.fechaFin) : (matricula?.cursoId ? 'Sin datos aún' : null);
    case 'duracion_dias_curso':
      return curso?.duracionDias != null ? String(curso.duracionDias) : null;
    case 'horas_totales_curso':
      return curso?.horasTotales != null ? String(curso.horasTotales) : null;

    // --- Personal ---
    case 'entrenador_nombre':
      return entrenador
        ? `${entrenador.nombres} ${entrenador.apellidos}`
        : curso?.entrenadorNombre ?? null;
    case 'supervisor_nombre':
      return supervisor
        ? `${supervisor.nombres} ${supervisor.apellidos}`
        : curso?.supervisorNombre ?? null;

    // --- Sistema ---
    case 'fecha_diligenciamiento':
      return format(new Date(), 'd/MM/yyyy', { locale: es });

    // --- Firmas (prefer firmas_matricula, fallback to legacy) ---
    case 'aprendiz_firma': {
      const firmaMatr = ctx.firmasMatricula?.find(f => f.tipo === 'aprendiz');
      if (firmaMatr) return firmaMatr.firmaBase64;
      return persona?.firma ?? null;
    }
    case 'entrenador_firma': {
      const firmaMatr = ctx.firmasMatricula?.find(f => f.tipo === 'entrenador');
      if (firmaMatr) return firmaMatr.firmaBase64;
      return entrenador?.firmaBase64 ?? null;
    }
    case 'supervisor_firma': {
      const firmaMatr = ctx.firmasMatricula?.find(f => f.tipo === 'supervisor');
      if (firmaMatr) return firmaMatr.firmaBase64;
      return supervisor?.firmaBase64 ?? null;
    }

    default:
      return null;
  }
}
