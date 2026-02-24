import { TipoFormacion } from './curso';

// ---------------------------------------------------------------------------
// Bloque — unidad declarativa del constructor de formatos
// ---------------------------------------------------------------------------

export type TipoBloque =
  | 'heading'
  | 'paragraph'
  | 'text'
  | 'date'
  | 'number'
  | 'radio'
  | 'select'
  | 'checkbox'
  | 'auto_field'
  | 'attendance_by_day'
  | 'signature_aprendiz'
  | 'signature_entrenador_auto'
  | 'signature_supervisor_auto'
  | 'health_consent'
  | 'data_authorization'
  | 'evaluation_quiz'
  | 'satisfaction_survey'
  | 'section_title';

/**
 * Claves de auto_field: valores resueltos automáticamente desde el sistema.
 */
export type AutoFieldKey =
  | 'nombre_aprendiz'
  | 'documento_aprendiz'
  | 'tipo_documento_aprendiz'
  | 'genero_aprendiz'
  | 'fecha_nacimiento_aprendiz'
  | 'pais_nacimiento_aprendiz'
  | 'nivel_educativo_aprendiz'
  | 'rh_aprendiz'
  | 'telefono_aprendiz'
  | 'email_aprendiz'
  | 'contacto_emergencia_nombre'
  | 'contacto_emergencia_telefono'
  | 'empresa_nombre'
  | 'empresa_cargo'
  | 'empresa_nivel_formacion'
  | 'empresa_nit'
  | 'empresa_representante_legal'
  | 'area_trabajo'
  | 'sector_economico'
  | 'tipo_vinculacion'
  | 'eps_aprendiz'
  | 'arl_aprendiz'
  | 'nivel_previo'
  | 'centro_formacion_previo'
  | 'fecha_inicio_curso'
  | 'fecha_fin_curso'
  | 'nombre_curso'
  | 'tipo_formacion_curso'
  | 'numero_curso'
  | 'duracion_dias_curso'
  | 'horas_totales_curso'
  | 'entrenador_nombre'
  | 'supervisor_nombre'
  | 'fecha_diligenciamiento'
  | 'aprendiz_firma'
  | 'entrenador_firma'
  | 'supervisor_firma';

export interface BloqueBase {
  id: string;
  type: TipoBloque;
  label: string;
  required?: boolean;
}

export interface BloqueHeading extends BloqueBase {
  type: 'heading';
  props?: { level?: 1 | 2 | 3 };
}

export interface BloqueParagraph extends BloqueBase {
  type: 'paragraph';
  props: { text: string };
}

export interface BloqueSectionTitle extends BloqueBase {
  type: 'section_title';
}

export interface BloqueText extends BloqueBase {
  type: 'text';
  props?: { placeholder?: string; multiline?: boolean };
}

export interface BloqueDate extends BloqueBase {
  type: 'date';
}

export interface BloqueNumber extends BloqueBase {
  type: 'number';
  props?: { min?: number; max?: number };
}

export interface BloqueRadio extends BloqueBase {
  type: 'radio';
  props: { options: { value: string; label: string }[] };
}

export interface BloqueSelect extends BloqueBase {
  type: 'select';
  props: { options: { value: string; label: string }[] };
}

export interface BloqueCheckbox extends BloqueBase {
  type: 'checkbox';
}

export interface BloqueAutoField extends BloqueBase {
  type: 'auto_field';
  props: { key: AutoFieldKey; span?: boolean };
}

export interface BloqueAttendanceByDay extends BloqueBase {
  type: 'attendance_by_day';
}

export interface BloqueSignatureAprendiz extends BloqueBase {
  type: 'signature_aprendiz';
}

export interface BloqueSignatureEntrenador extends BloqueBase {
  type: 'signature_entrenador_auto';
}

export interface BloqueSignatureSupervisor extends BloqueBase {
  type: 'signature_supervisor_auto';
}

export interface BloqueHealthConsent extends BloqueBase {
  type: 'health_consent';
  props: {
    questions: {
      id: string;
      label: string;
      hasDetail?: boolean;
      conditionalOn?: string; // e.g. genero === 'F' for embarazo
    }[];
  };
}

export interface BloqueDataAuthorization extends BloqueBase {
  type: 'data_authorization';
  props: {
    summaryItems: string[];
    fullText?: string;
  };
}

export interface BloqueEvaluationQuiz extends BloqueBase {
  type: 'evaluation_quiz';
  props: {
    umbralAprobacion: number;
    preguntas: {
      id: number;
      texto: string;
      opciones: string[];
      correcta: number;
    }[];
  };
}

export interface BloqueSatisfactionSurvey extends BloqueBase {
  type: 'satisfaction_survey';
  props: {
    escalaPreguntas: string[];
    escalaOpciones: { value: string; label: string }[];
    preguntaSiNo?: string;
  };
}

export type Bloque =
  | BloqueHeading
  | BloqueParagraph
  | BloqueSectionTitle
  | BloqueText
  | BloqueDate
  | BloqueNumber
  | BloqueRadio
  | BloqueSelect
  | BloqueCheckbox
  | BloqueAutoField
  | BloqueAttendanceByDay
  | BloqueSignatureAprendiz
  | BloqueSignatureEntrenador
  | BloqueSignatureSupervisor
  | BloqueHealthConsent
  | BloqueDataAuthorization
  | BloqueEvaluationQuiz
  | BloqueSatisfactionSurvey;

// ---------------------------------------------------------------------------
// Scope de asignación
// ---------------------------------------------------------------------------

export type AsignacionScope = 'nivel_formacion' | 'tipo_curso';

// ---------------------------------------------------------------------------
// FormatoFormacion — entidad principal
// ---------------------------------------------------------------------------

export interface FormatoFormacion {
  id: string;
  nombre: string;
  descripcion: string;
  codigo: string;       // e.g. "FIH04-013"
  version: string;      // e.g. "021"

  asignacionScope: AsignacionScope;
  nivelFormacionIds: string[];       // si scope = nivel_formacion
  tipoCursoKeys: TipoFormacion[];    // si scope = tipo_curso

  visibleEnMatricula: boolean;
  visibleEnCurso: boolean;
  activo: boolean;
  esAutomatico: boolean;

  // Firmas requeridas
  requiereFirmaAprendiz: boolean;
  requiereFirmaEntrenador: boolean;
  requiereFirmaSupervisor: boolean;

  // Bloques del constructor
  bloques: Bloque[];

  // Metadata del documento impreso
  documentMeta?: {
    fechaCreacion: string;
    fechaEdicion: string;
    subsistema: string;
  };

  // Legacy: si este formato tiene componente hardcodeado asociado
  legacyComponentId?: 'info_aprendiz' | 'registro_asistencia' | 'participacion_pta_ats' | 'evaluacion_reentrenamiento';

  createdAt: string;
  updatedAt: string;
}

export type FormatoFormacionFormData = Omit<FormatoFormacion, 'id' | 'createdAt' | 'updatedAt'>;

// ---------------------------------------------------------------------------
// FormatoRespuesta — respuestas por matrícula y formato (futuro)
// ---------------------------------------------------------------------------

export interface FormatoRespuesta {
  id: string;
  matriculaId: string;
  formatoId: string;
  answers: Record<string, unknown>;  // key = bloqueId, value = respuesta
  estado: 'pendiente' | 'completado' | 'firmado';
  completadoAt?: string;
  createdAt: string;
  updatedAt: string;
}
