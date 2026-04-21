/**
 * Plugins SAFA — registra los tipos de bloque específicos del dominio SAFA.
 *
 * Esta función no instala componentes UI todavía (los renderers actuales
 * siguen siendo wrappers acoplados); declara metadata para el catálogo y
 * la validación.
 *
 * Cuando se extraigan los renderers (Fase F), cada bloque traerá su
 * `RendererComponent` y `EditorComponent`.
 */
import type { BlockDefinition, BlockRegistryPort } from '../../contracts/BlockRegistryPort';

const CORE_BLOCKS: BlockDefinition[] = [
  // --- Texto / decorativos ---
  { type: 'heading', label: 'Encabezado', category: 'Texto', isInput: false },
  { type: 'paragraph', label: 'Párrafo', category: 'Texto', isInput: false },
  { type: 'section_title', label: 'Título de sección', category: 'Texto', isInput: false },
  { type: 'divider', label: 'Separador', category: 'Texto', isInput: false },
  // --- Inputs genéricos ---
  { type: 'text', label: 'Texto', category: 'Formulario', isInput: true },
  { type: 'textarea', label: 'Texto largo', category: 'Formulario', isInput: true },
  { type: 'email', label: 'Email', category: 'Formulario', isInput: true },
  { type: 'date', label: 'Fecha', category: 'Formulario', isInput: true },
  { type: 'number', label: 'Número', category: 'Formulario', isInput: true },
  { type: 'radio', label: 'Selección única', category: 'Formulario', isInput: true },
  { type: 'select', label: 'Lista desplegable', category: 'Formulario', isInput: true },
  { type: 'checkbox', label: 'Casilla', category: 'Formulario', isInput: true },
  { type: 'multi_choice', label: 'Selección múltiple', category: 'Formulario', isInput: true },
  { type: 'auto_field', label: 'Campo auto', category: 'Formulario', isInput: false },
  { type: 'file', label: 'Archivo', category: 'Formulario', isInput: true },
];

const SAFA_DOMAIN_BLOCKS: BlockDefinition[] = [
  { type: 'attendance_by_day', label: 'Asistencia por día', category: 'SAFA', isInput: true },
  { type: 'signature_aprendiz', label: 'Firma aprendiz', category: 'SAFA · Firma', isInput: true },
  { type: 'signature_entrenador_auto', label: 'Firma entrenador (auto)', category: 'SAFA · Firma', isInput: false },
  { type: 'signature_supervisor_auto', label: 'Firma supervisor (auto)', category: 'SAFA · Firma', isInput: false },
  { type: 'signature_capture', label: 'Captura de firma', category: 'SAFA · Firma', isInput: true },
  { type: 'health_consent', label: 'Consentimiento de salud', category: 'SAFA', isInput: true },
  { type: 'data_authorization', label: 'Autorización de datos', category: 'SAFA', isInput: true },
  { type: 'evaluation_quiz', label: 'Cuestionario de evaluación', category: 'SAFA', isInput: true },
  { type: 'evaluation_summary', label: 'Resumen de evaluación', category: 'SAFA', isInput: false },
  { type: 'satisfaction_survey', label: 'Encuesta de satisfacción', category: 'SAFA', isInput: true },
  { type: 'document_header', label: 'Encabezado institucional', category: 'SAFA · Documento', isInput: false },
];

export function registerSafaPlugins(registry: BlockRegistryPort) {
  for (const def of CORE_BLOCKS) registry.register(def);
  for (const def of SAFA_DOMAIN_BLOCKS) registry.register(def);
}
