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
  NIVELES_FORMACION_EMPRESA,
  SECTORES_ECONOMICOS,
  AREAS_TRABAJO,
  EPS_OPTIONS,
  ARL_OPTIONS,
} from '@/data/formOptions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface AutoFieldContext {
  persona: Persona | null;
  matricula: Matricula | null;
  curso: Curso | null;
  entrenador: Personal | null;
  supervisor: Personal | null;
}

function lookup(value: string | undefined, options: readonly { value: string; label: string }[]): string | null {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

function fmtDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  try {
    return format(new Date(dateStr), 'd/MM/yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

export function resolveAutoFieldValue(key: AutoFieldKey, ctx: AutoFieldContext): string | null {
  const { persona, matricula, curso, entrenador, supervisor } = ctx;

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
      return lookup(matricula?.empresaNivelFormacion, NIVELES_FORMACION_EMPRESA);

    // --- Curso ---
    case 'nombre_curso':
      return curso?.nombre ?? null;
    case 'tipo_formacion_curso':
      return curso?.tipoFormacion ? (TIPO_FORMACION_LABELS[curso.tipoFormacion] ?? curso.tipoFormacion) : null;
    case 'numero_curso':
      return curso?.numeroCurso ?? null;
    case 'fecha_inicio_curso':
      return fmtDate(curso?.fechaInicio);
    case 'fecha_fin_curso':
      return fmtDate(curso?.fechaFin);
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

    // --- Firmas (base64) ---
    case 'aprendiz_firma':
      return persona?.firma ?? null;
    case 'entrenador_firma':
      return entrenador?.firmaBase64 ?? null;
    case 'supervisor_firma':
      return supervisor?.firmaBase64 ?? null;

    default:
      return null;
  }
}
