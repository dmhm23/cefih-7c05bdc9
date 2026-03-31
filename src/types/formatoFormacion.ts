// Nota: tipoCursoKeys fue eliminado — unificado con nivelFormacionIds

// ---------------------------------------------------------------------------
// Bloque — unidad declarativa del constructor de formatos
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
  | 'document_header';

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

export interface BloqueTextarea extends BloqueBase {
  type: 'textarea';
  props?: { placeholder?: string };
}

export interface BloqueEmail extends BloqueBase {
  type: 'email';
  props?: { placeholder?: string };
}

export interface BloqueDivider extends BloqueBase {
  type: 'divider';
}

export interface BloqueFile extends BloqueBase {
  type: 'file';
  props?: { accept?: string };
}

export interface BloqueHealthConsent extends BloqueBase {
  type: 'health_consent';
  props: {
    questions: {
      id: string;
      label: string;
      hasDetail?: boolean;
      conditionalOn?: string;
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
  | BloqueDocumentHeader;

// ---------------------------------------------------------------------------
// Scope de asignación
// ---------------------------------------------------------------------------

export type AsignacionScope = 'todos' | 'nivel_formacion';

// ---------------------------------------------------------------------------
// Motor de render
// ---------------------------------------------------------------------------

export type MotorRender = 'bloques' | 'plantilla_html';

// ---------------------------------------------------------------------------
// Categoría del formato
// ---------------------------------------------------------------------------

export type CategoriaFormato = 'formacion' | 'evaluacion' | 'asistencia' | 'pta_ats' | 'personalizado';

// ---------------------------------------------------------------------------
// Modo de diligenciamiento
// ---------------------------------------------------------------------------

export type ModoDiligenciamiento = 'manual_estudiante' | 'manual_admin' | 'automatico_sistema';

// ---------------------------------------------------------------------------
// Estado del formato
// ---------------------------------------------------------------------------

export type EstadoFormato = 'borrador' | 'activo' | 'archivado';

// ---------------------------------------------------------------------------
// Encabezado institucional
// ---------------------------------------------------------------------------

export interface EncabezadoConfig {
  mostrarLogo: boolean;
  mostrarNombreCentro: boolean;
  mostrarCodigoDocumento: boolean;
  mostrarVersion: boolean;
  mostrarFecha: boolean;
  mostrarPaginacion: boolean;
  alineacion: 'izquierda' | 'centro' | 'derecha';
}

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
  nivelFormacionIds: string[];       // IDs de niveles de formación cuando scope = nivel_formacion

  visibleEnMatricula: boolean;
  visibleEnCurso: boolean;
  visibleEnPortalEstudiante: boolean;
  activo: boolean;
  modoDiligenciamiento: ModoDiligenciamiento;
  esAutomatico: boolean;

  // Motor de render
  motorRender: MotorRender;

  // Categoría
  categoria: CategoriaFormato;

  // Estado del formato
  estado: EstadoFormato;

  // Plantilla HTML (motor 'plantilla_html')
  htmlTemplate?: string;
  cssTemplate?: string;

  // Encabezado institucional
  usaEncabezadoInstitucional: boolean;
  encabezadoConfig?: EncabezadoConfig;

  // Plantilla base de la que se originó
  plantillaBaseId?: string;

  // Tokens presentes en la plantilla
  tokensUsados?: string[];

  // Firmas requeridas
  requiereFirmaAprendiz: boolean;
  requiereFirmaEntrenador: boolean;
  requiereFirmaSupervisor: boolean;

  // Bloques del constructor (motor 'bloques')
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
// FormatoVersion — historial de versiones
// ---------------------------------------------------------------------------

export interface FormatoVersion {
  id: string;
  formatoId: string;
  version: number;
  htmlTemplate: string;
  cssTemplate?: string;
  createdAt: string;
  creadoPor?: string;
}

// ---------------------------------------------------------------------------
// PlantillaBase — templates preconstruidos
// ---------------------------------------------------------------------------

export interface PlantillaBase {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaFormato;
  htmlTemplate: string;
  cssTemplate?: string;
  thumbnail?: string;
}

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
