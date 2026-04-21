/**
 * Catálogo de campos automáticos del dominio SAFA.
 *
 * Vive dentro del plugin SAFA porque conoce las entidades del host
 * (Persona, Matrícula, Curso, Personal, Formato previo, Nivel de Formación).
 */
import type { AutoFieldKey } from '../types';

export interface AutoFieldOption {
  key: AutoFieldKey;
  label: string;
  category: string;
  source: string;
  description?: string;
}

export const AUTO_FIELD_CATALOG: AutoFieldOption[] = [
  // --- Datos del Aprendiz (Persona) ---
  { key: 'nombre_aprendiz', label: 'Nombre completo', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'documento_aprendiz', label: 'Número de documento', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'tipo_documento_aprendiz', label: 'Tipo de documento', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'genero_aprendiz', label: 'Género', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'fecha_nacimiento_aprendiz', label: 'Fecha de nacimiento', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'pais_nacimiento_aprendiz', label: 'País de nacimiento', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'nivel_educativo_aprendiz', label: 'Nivel educativo', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'rh_aprendiz', label: 'RH', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'telefono_aprendiz', label: 'Teléfono', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'email_aprendiz', label: 'Correo electrónico', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'contacto_emergencia_nombre', label: 'Contacto emergencia (nombre)', category: 'Datos del Aprendiz', source: 'Persona' },
  { key: 'contacto_emergencia_telefono', label: 'Contacto emergencia (teléfono)', category: 'Datos del Aprendiz', source: 'Persona' },

  // --- Datos de Salud (Matrícula) ---
  { key: 'consentimiento_salud', label: 'Consentimiento de salud', category: 'Datos de Salud', source: 'Matrícula' },
  { key: 'restriccion_medica', label: 'Restricción médica (Sí/No)', category: 'Datos de Salud', source: 'Matrícula' },
  { key: 'restriccion_medica_detalle', label: 'Restricción médica (detalle)', category: 'Datos de Salud', source: 'Matrícula' },
  { key: 'alergias', label: 'Alergias (Sí/No)', category: 'Datos de Salud', source: 'Matrícula' },
  { key: 'alergias_detalle', label: 'Alergias (detalle)', category: 'Datos de Salud', source: 'Matrícula' },
  { key: 'consumo_medicamentos', label: 'Consumo de medicamentos (Sí/No)', category: 'Datos de Salud', source: 'Matrícula' },
  { key: 'consumo_medicamentos_detalle', label: 'Consumo de medicamentos (detalle)', category: 'Datos de Salud', source: 'Matrícula' },
  { key: 'embarazo', label: 'Embarazo (Sí/No)', category: 'Datos de Salud', source: 'Matrícula' },

  // --- Datos Laborales (Matrícula) ---
  { key: 'empresa_nombre', label: 'Nombre de la empresa', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'empresa_cargo', label: 'Cargo', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'nivel_formacion', label: 'Nivel de formación', category: 'Datos Laborales', source: 'Matrícula', description: 'Resuelve el nombre del nivel desde nivel_formacion_id' },
  { key: 'empresa_nit', label: 'NIT empresa', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'empresa_representante_legal', label: 'Representante legal', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'area_trabajo', label: 'Área de trabajo', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'sector_economico', label: 'Sector económico', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'tipo_vinculacion', label: 'Responsable del pago', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'eps_aprendiz', label: 'EPS', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'arl_aprendiz', label: 'ARL', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'nivel_previo', label: 'Nivel previo de formación', category: 'Datos Laborales', source: 'Matrícula' },
  { key: 'centro_formacion_previo', label: 'Centro de formación previo', category: 'Datos Laborales', source: 'Matrícula' },

  // --- Datos del Curso ---
  { key: 'nombre_curso', label: 'Nombre del curso', category: 'Datos del Curso', source: 'Curso' },
  { key: 'tipo_formacion_curso', label: 'Tipo de formación', category: 'Datos del Curso', source: 'Curso' },
  { key: 'numero_curso', label: 'Número de curso', category: 'Datos del Curso', source: 'Curso' },
  { key: 'fecha_inicio_curso', label: 'Fecha de inicio', category: 'Datos del Curso', source: 'Curso' },
  { key: 'fecha_fin_curso', label: 'Fecha de fin', category: 'Datos del Curso', source: 'Curso' },
  { key: 'duracion_dias_curso', label: 'Duración (días)', category: 'Datos del Curso', source: 'Curso' },
  { key: 'horas_totales_curso', label: 'Horas totales', category: 'Datos del Curso', source: 'Curso' },

  // --- Personal Asignado ---
  { key: 'entrenador_nombre', label: 'Entrenador', category: 'Personal Asignado', source: 'Curso' },
  { key: 'supervisor_nombre', label: 'Supervisor', category: 'Personal Asignado', source: 'Curso' },
  { key: 'entrenador_firma', label: 'Firma del entrenador', category: 'Personal Asignado', source: 'Personal' },
  { key: 'supervisor_firma', label: 'Firma del supervisor', category: 'Personal Asignado', source: 'Personal' },

  // --- Sistema ---
  { key: 'fecha_diligenciamiento', label: 'Fecha de diligenciamiento', category: 'Datos del Curso', source: 'Sistema' },
  { key: 'aprendiz_firma', label: 'Firma del aprendiz', category: 'Datos del Aprendiz', source: 'Persona' },
];

export const AUTO_FIELD_CATEGORIES = [...new Set(AUTO_FIELD_CATALOG.map(f => f.category))];

export function buildFormatoPrevioOptions(
  formatos: { id: string; nombre: string; bloques: any[] }[],
  respuestas: { formatoId: string; answers: Record<string, unknown> }[]
): AutoFieldOption[] {
  const options: AutoFieldOption[] = [];
  for (const resp of respuestas) {
    const formato = formatos.find(f => f.id === resp.formatoId);
    if (!formato) continue;

    // Tokens derivados de evaluación si el formato tiene al menos un evaluation_quiz
    const tieneQuiz = (formato.bloques || []).some((b: any) => b?.type === 'evaluation_quiz');
    if (tieneQuiz) {
      const evalCategory = `Evaluación: ${formato.nombre}`;
      options.push(
        { key: `formato_prev:${formato.id}:_puntaje`, label: 'Puntaje (%)', category: evalCategory, source: 'Evaluación', description: 'Puntaje agregado del último intento' },
        { key: `formato_prev:${formato.id}:_correctas`, label: 'Correctas / Total', category: evalCategory, source: 'Evaluación', description: 'Preguntas correctas del último intento' },
        { key: `formato_prev:${formato.id}:_aprobado`, label: '¿Aprobado?', category: evalCategory, source: 'Evaluación', description: 'Sí / No del último intento' },
        { key: `formato_prev:${formato.id}:_fecha_intento`, label: 'Fecha del intento', category: evalCategory, source: 'Evaluación', description: 'Fecha del último intento' },
      );
    }

    for (const [fieldKey, value] of Object.entries(resp.answers || {})) {
      if (value == null) continue;
      const bloque = formato.bloques?.find((b: any) => b.id === fieldKey);
      const label = bloque?.label || fieldKey;
      options.push({
        key: `formato_prev:${formato.id}:${fieldKey}`,
        label,
        category: `Formato: ${formato.nombre}`,
        source: 'Formato previo',
        description: `Respuesta del formato "${formato.nombre}"`,
      });
    }
  }
  return options;
}

export function buildNivelCamposOptions(
  camposAdicionales: { key: string; label: string; tipo?: string }[] | null
): AutoFieldOption[] {
  if (!camposAdicionales || camposAdicionales.length === 0) return [];
  return camposAdicionales.map(campo => ({
    key: `nivel_campo:${campo.key}`,
    label: campo.label,
    category: 'Campos del Nivel',
    source: 'Nivel de Formación',
    description: 'Campo adicional del nivel de formación',
  }));
}

export function getAutoFieldLabel(key: string): string {
  return AUTO_FIELD_CATALOG.find(f => f.key === key)?.label ?? key;
}

export function getAutoFieldOption(key: string): AutoFieldOption | undefined {
  return AUTO_FIELD_CATALOG.find(f => f.key === key);
}
