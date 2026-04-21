/**
 * Renderers SAFA específicos para el Portal del Estudiante.
 *
 * Estos componentes implementan los bloques de dominio (consentimiento,
 * autorización, evaluación, encuesta) y son consumidos tanto por el
 * `PortalFormatoRenderer` (vista mobile guiada) como por el
 * `DynamicFormatoDocument` (vista PDF documental).
 */
export { default as BloqueHealthConsentRenderer } from './BloqueHealthConsentRenderer';
export { default as BloqueDataAuthorizationRenderer } from './BloqueDataAuthorizationRenderer';
export { default as BloqueEvaluationQuizRenderer } from './BloqueEvaluationQuizRenderer';
export { default as BloqueSatisfactionSurveyRenderer } from './BloqueSatisfactionSurveyRenderer';
