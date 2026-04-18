/**
 * Tipos específicos del dominio SAFA — bloques con discriminadores tipados,
 * alias de Formato/Respuesta para compatibilidad con la app actual.
 *
 * El core (`@/modules/formatos/core/types`) no conoce estos bloques: viven
 * en el plugin SAFA porque pertenecen a este host.
 */
import type {
  Formato as CoreFormato,
  FormatoFormData as CoreFormatoFormData,
  Bloque as CoreBloque,
} from '../../core/types';

// ---------------------------------------------------------------------------
// TipoBloque — unión de identificadores de bloque conocidos en SAFA
// ---------------------------------------------------------------------------
export type TipoBloque =
  | 'heading'
  | 'paragraph'
  | 'text'
  | 'textarea'
  | 'email'
  | 'date'
  | 'number'
  | 'radio'
  | 'select'
  | 'checkbox'
  | 'multi_choice'
  | 'auto_field'
  | 'attendance_by_day'
  | 'signature_aprendiz'
  | 'signature_entrenador_auto'
  | 'signature_supervisor_auto'
  | 'health_consent'
  | 'data_authorization'
  | 'evaluation_quiz'
  | 'satisfaction_survey'
  | 'section_title'
  | 'divider'
  | 'file'
  | 'document_header'
  | 'signature_capture';

export interface SelectionOption {
  label: string;
  value: string;
  default?: boolean;
}

export type AutoFieldKey = string;

export interface VisibilityRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'is_filled' | 'is_empty';
  value?: unknown;
}

export interface BloqueBase {
  id: string;
  type: TipoBloque;
  label: string;
  required?: boolean;
  editable?: boolean;
  visibilityRule?: VisibilityRule;
}

export interface BloqueHeading extends BloqueBase { type: 'heading'; props?: { level?: 1 | 2 | 3 }; }
export interface BloqueParagraph extends BloqueBase { type: 'paragraph'; props: { text: string }; }
export interface BloqueSectionTitle extends BloqueBase { type: 'section_title'; props?: { collapsible?: boolean; defaultOpen?: boolean }; }
export interface BloqueText extends BloqueBase { type: 'text'; props?: { placeholder?: string; multiline?: boolean }; }
export interface BloqueDate extends BloqueBase { type: 'date'; }
export interface BloqueNumber extends BloqueBase { type: 'number'; props?: { min?: number; max?: number }; }
export interface BloqueRadio extends BloqueBase { type: 'radio'; props: { options: SelectionOption[] }; }
export interface BloqueSelect extends BloqueBase { type: 'select'; props: { options: SelectionOption[] }; }
export interface BloqueMultiChoice extends BloqueBase { type: 'multi_choice'; props: { options: SelectionOption[] }; }
export interface BloqueCheckbox extends BloqueBase {
  type: 'checkbox';
  props?: { description?: string; hasPopover?: boolean; popoverText?: string };
}
export interface BloqueAutoField extends BloqueBase { type: 'auto_field'; props: { key: AutoFieldKey; span?: boolean }; }

export type AttendanceFirmaMode = 'none' | 'reuse_if_available' | 'reuse_required';
export interface BloqueAttendanceByDay extends BloqueBase {
  type: 'attendance_by_day';
  props?: { firmaMode?: AttendanceFirmaMode; tipoFirmante?: 'aprendiz' | 'entrenador' | 'supervisor'; formatoOrigenId?: string };
}

export interface BloqueSignatureAprendiz extends BloqueBase { type: 'signature_aprendiz'; }
export interface BloqueSignatureEntrenador extends BloqueBase { type: 'signature_entrenador_auto'; }
export interface BloqueSignatureSupervisor extends BloqueBase { type: 'signature_supervisor_auto'; }
export interface BloqueTextarea extends BloqueBase { type: 'textarea'; props?: { placeholder?: string }; }
export interface BloqueEmail extends BloqueBase { type: 'email'; props?: { placeholder?: string }; }
export interface BloqueDivider extends BloqueBase { type: 'divider'; }
export interface BloqueFile extends BloqueBase { type: 'file'; props?: { accept?: string }; }

export interface BloqueHealthConsent extends BloqueBase {
  type: 'health_consent';
  props: {
    questions: { id: string; label: string; hasDetail?: boolean; conditionalOn?: string }[];
  };
}

export interface BloqueDataAuthorization extends BloqueBase {
  type: 'data_authorization';
  props: { summaryItems: string[]; fullText?: string };
}

export interface BloqueEvaluationQuiz extends BloqueBase {
  type: 'evaluation_quiz';
  props: {
    umbralAprobacion: number;
    preguntas: { id: number; texto: string; opciones: string[]; correcta: number }[];
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

export interface BloqueDocumentHeader extends BloqueBase {
  type: 'document_header';
  props: {
    logoUrl?: string;
    empresaNombre: string;
    sistemaGestion: string;
    subsistema: string;
    fechaCreacion: string;
    fechaEdicion: string;
    mostrarCodigo: boolean;
    mostrarVersion: boolean;
    mostrarFechas: boolean;
    borderColor: string;
  };
}

export type SignatureCaptureMode = 'capture' | 'reuse_if_available' | 'reuse_required' | 'display_only';
export interface BloqueSignatureCapture extends BloqueBase {
  type: 'signature_capture';
  props?: {
    mode?: SignatureCaptureMode;
    tipoFirmante?: 'aprendiz' | 'entrenador' | 'supervisor';
    formatoOrigenId?: string;
    requiereAutorizacionReutilizacion?: boolean;
  };
}

/** Unión discriminada de todos los bloques SAFA. */
export type Bloque =
  | BloqueHeading
  | BloqueParagraph
  | BloqueSectionTitle
  | BloqueText
  | BloqueTextarea
  | BloqueEmail
  | BloqueDate
  | BloqueNumber
  | BloqueRadio
  | BloqueSelect
  | BloqueCheckbox
  | BloqueMultiChoice
  | BloqueAutoField
  | BloqueAttendanceByDay
  | BloqueSignatureAprendiz
  | BloqueSignatureEntrenador
  | BloqueSignatureSupervisor
  | BloqueHealthConsent
  | BloqueDataAuthorization
  | BloqueEvaluationQuiz
  | BloqueSatisfactionSurvey
  | BloqueDivider
  | BloqueFile
  | BloqueDocumentHeader
  | BloqueSignatureCapture;

// ---------------------------------------------------------------------------
// Aliases del Formato del core, tipados con la unión SAFA de Bloque.
// Mantienen compatibilidad con el código existente del host.
// ---------------------------------------------------------------------------
export type FormatoFormacion = Omit<CoreFormato, 'bloques'> & { bloques: Bloque[] };
export type FormatoFormacionFormData = Omit<CoreFormatoFormData, 'bloques'> & { bloques: Bloque[] };

// ---------------------------------------------------------------------------
// Estado de respuesta y firma (mantienen la forma existente)
// ---------------------------------------------------------------------------
export type EstadoFormatoRespuesta = 'pendiente' | 'completado' | 'firmado' | 'bloqueado' | 'reabierto';

export interface FormatoRespuesta {
  id: string;
  matriculaId: string;
  formatoId: string;
  answers: Record<string, unknown>;
  estado: EstadoFormatoRespuesta;
  completadoAt?: string;
  reabiertoPor?: string;
  reabiertoAt?: string;
  intentosEvaluacion?: Record<string, unknown>[];
  createdAt: string;
  updatedAt: string;
}

export type TipoFirmaMatricula = 'aprendiz' | 'entrenador' | 'supervisor';

export interface FirmaMatricula {
  id: string;
  matriculaId: string;
  tipo: TipoFirmaMatricula;
  firmaBase64: string;
  formatoOrigenId?: string;
  ip?: string;
  userAgent?: string;
  hashIntegridad?: string;
  autorizaReutilizacion: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlantillaBase {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: 'formacion' | 'evaluacion' | 'asistencia' | 'pta_ats' | 'personalizado';
  htmlTemplate: string;
  cssTemplate?: string;
  thumbnail?: string;
}

// Re-exporta el tipo nominal del core para quien lo necesite genérico
export type { Bloque as CoreBloque, Formato as CoreFormato } from '../../core/types';
