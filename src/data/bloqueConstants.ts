import { TipoBloque } from '@/types/formatoFormacion';

export const BLOQUE_TYPE_LABELS: Partial<Record<TipoBloque, string>> = {
  section_title: "Título de sección",
  heading: "Encabezado",
  paragraph: "Párrafo",
  text: "Campo de texto",
  date: "Fecha",
  number: "Numérico",
  radio: "Radio",
  select: "Select",
  checkbox: "Checkbox",
  auto_field: "Automático",
  attendance_by_day: "Asistencia por día",
  signature_aprendiz: "Firma aprendiz",
  signature_entrenador_auto: "Firma entrenador",
  signature_supervisor_auto: "Firma supervisor",
  health_consent: "Consentimiento salud",
  data_authorization: "Autorización datos",
  evaluation_quiz: "Evaluación",
  satisfaction_survey: "Encuesta satisfacción",
};

export const BLOCK_PALETTE: { type: TipoBloque; label: string; icon: string }[] = [
  { type: "section_title", label: "Título de sección", icon: "📌" },
  { type: "heading", label: "Encabezado", icon: "🔤" },
  { type: "paragraph", label: "Párrafo", icon: "📝" },
  { type: "text", label: "Campo de texto", icon: "✏️" },
  { type: "date", label: "Campo de fecha", icon: "📅" },
  { type: "number", label: "Campo numérico", icon: "🔢" },
  { type: "radio", label: "Opciones (radio)", icon: "🔘" },
  { type: "select", label: "Lista desplegable", icon: "📋" },
  { type: "checkbox", label: "Casilla de verificación", icon: "☑️" },
  { type: "auto_field", label: "Campo automático", icon: "⚡" },
  { type: "signature_aprendiz", label: "Firma aprendiz", icon: "✍️" },
  { type: "signature_entrenador_auto", label: "Firma entrenador", icon: "✍️" },
  { type: "signature_supervisor_auto", label: "Firma supervisor", icon: "✍️" },
];

export const COMPLEX_TYPES: TipoBloque[] = [
  "health_consent",
  "data_authorization",
  "evaluation_quiz",
  "satisfaction_survey",
];
