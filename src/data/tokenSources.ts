import { AutoFieldKey } from '@/types/formatoFormacion';

export interface TokenDefinition {
  key: string;
  label: string;
  category: string;
  autoFieldKey: AutoFieldKey;
  description?: string;
}

export interface TokenCategory {
  name: string;
  tokens: TokenDefinition[];
}

const TOKEN_CATALOG: TokenDefinition[] = [
  // --- Persona ---
  { key: 'persona.nombreCompleto', label: 'Nombre completo', category: 'Persona', autoFieldKey: 'nombre_aprendiz' },
  { key: 'persona.numeroDocumento', label: 'Número de documento', category: 'Persona', autoFieldKey: 'documento_aprendiz' },
  { key: 'persona.tipoDocumento', label: 'Tipo de documento', category: 'Persona', autoFieldKey: 'tipo_documento_aprendiz' },
  { key: 'persona.genero', label: 'Género', category: 'Persona', autoFieldKey: 'genero_aprendiz' },
  { key: 'persona.fechaNacimiento', label: 'Fecha de nacimiento', category: 'Persona', autoFieldKey: 'fecha_nacimiento_aprendiz' },
  { key: 'persona.paisNacimiento', label: 'País de nacimiento', category: 'Persona', autoFieldKey: 'pais_nacimiento_aprendiz' },
  { key: 'persona.nivelEducativo', label: 'Nivel educativo', category: 'Persona', autoFieldKey: 'nivel_educativo_aprendiz' },
  { key: 'persona.rh', label: 'RH', category: 'Persona', autoFieldKey: 'rh_aprendiz' },
  { key: 'persona.telefono', label: 'Teléfono', category: 'Persona', autoFieldKey: 'telefono_aprendiz' },
  { key: 'persona.email', label: 'Correo electrónico', category: 'Persona', autoFieldKey: 'email_aprendiz' },
  { key: 'persona.contactoEmergenciaNombre', label: 'Contacto emergencia (nombre)', category: 'Persona', autoFieldKey: 'contacto_emergencia_nombre' },
  { key: 'persona.contactoEmergenciaTelefono', label: 'Contacto emergencia (teléfono)', category: 'Persona', autoFieldKey: 'contacto_emergencia_telefono' },
  { key: 'persona.firma', label: 'Firma del aprendiz', category: 'Persona', autoFieldKey: 'aprendiz_firma' },

  // --- Empresa ---
  { key: 'empresa.nombre', label: 'Nombre de la empresa', category: 'Empresa', autoFieldKey: 'empresa_nombre' },
  { key: 'empresa.cargo', label: 'Cargo', category: 'Empresa', autoFieldKey: 'empresa_cargo' },
  { key: 'empresa.nit', label: 'NIT empresa', category: 'Empresa', autoFieldKey: 'empresa_nit' },
  { key: 'empresa.representanteLegal', label: 'Representante legal', category: 'Empresa', autoFieldKey: 'empresa_representante_legal' },
  { key: 'empresa.nivelFormacion', label: 'Nivel de formación', category: 'Empresa', autoFieldKey: 'nivel_formacion' },
  { key: 'empresa.areaTrabajo', label: 'Área de trabajo', category: 'Empresa', autoFieldKey: 'area_trabajo' },
  { key: 'empresa.sectorEconomico', label: 'Sector económico', category: 'Empresa', autoFieldKey: 'sector_economico' },
  { key: 'empresa.tipoVinculacion', label: 'Responsable del pago', category: 'Empresa', autoFieldKey: 'tipo_vinculacion' },
  { key: 'empresa.eps', label: 'EPS', category: 'Empresa', autoFieldKey: 'eps_aprendiz' },
  { key: 'empresa.arl', label: 'ARL', category: 'Empresa', autoFieldKey: 'arl_aprendiz' },

  // --- Salud ---
  { key: 'salud.consentimiento', label: 'Consentimiento de salud', category: 'Salud', autoFieldKey: 'consentimiento_salud' },
  { key: 'salud.restriccionMedica', label: 'Restricción médica', category: 'Salud', autoFieldKey: 'restriccion_medica' },
  { key: 'salud.restriccionMedicaDetalle', label: 'Restricción médica (detalle)', category: 'Salud', autoFieldKey: 'restriccion_medica_detalle' },
  { key: 'salud.alergias', label: 'Alergias', category: 'Salud', autoFieldKey: 'alergias' },
  { key: 'salud.alergiasDetalle', label: 'Alergias (detalle)', category: 'Salud', autoFieldKey: 'alergias_detalle' },
  { key: 'salud.consumoMedicamentos', label: 'Consumo de medicamentos', category: 'Salud', autoFieldKey: 'consumo_medicamentos' },
  { key: 'salud.consumoMedicamentosDetalle', label: 'Consumo medicamentos (detalle)', category: 'Salud', autoFieldKey: 'consumo_medicamentos_detalle' },
  { key: 'salud.embarazo', label: 'Embarazo', category: 'Salud', autoFieldKey: 'embarazo' },

  // --- Curso ---
  { key: 'curso.nombre', label: 'Nombre del curso', category: 'Curso', autoFieldKey: 'nombre_curso' },
  { key: 'curso.tipoFormacion', label: 'Tipo de formación', category: 'Curso', autoFieldKey: 'tipo_formacion_curso' },
  { key: 'curso.numero', label: 'Número de curso', category: 'Curso', autoFieldKey: 'numero_curso' },
  { key: 'curso.fechaInicio', label: 'Fecha de inicio', category: 'Curso', autoFieldKey: 'fecha_inicio_curso' },
  { key: 'curso.fechaFin', label: 'Fecha de fin', category: 'Curso', autoFieldKey: 'fecha_fin_curso' },
  { key: 'curso.duracionDias', label: 'Duración (días)', category: 'Curso', autoFieldKey: 'duracion_dias_curso' },
  { key: 'curso.horasTotales', label: 'Horas totales', category: 'Curso', autoFieldKey: 'horas_totales_curso' },

  // --- Personal ---
  { key: 'personal.entrenadorNombre', label: 'Entrenador', category: 'Personal', autoFieldKey: 'entrenador_nombre' },
  { key: 'personal.supervisorNombre', label: 'Supervisor', category: 'Personal', autoFieldKey: 'supervisor_nombre' },
  { key: 'personal.entrenadorFirma', label: 'Firma del entrenador', category: 'Personal', autoFieldKey: 'entrenador_firma' },
  { key: 'personal.supervisorFirma', label: 'Firma del supervisor', category: 'Personal', autoFieldKey: 'supervisor_firma' },

  // --- Matrícula ---
  { key: 'matricula.nivelPrevio', label: 'Nivel previo de formación', category: 'Matrícula', autoFieldKey: 'nivel_previo' },
  { key: 'matricula.centroFormacionPrevio', label: 'Centro de formación previo', category: 'Matrícula', autoFieldKey: 'centro_formacion_previo' },

  // --- Sistema ---
  { key: 'sistema.fechaDiligenciamiento', label: 'Fecha de diligenciamiento', category: 'Sistema', autoFieldKey: 'fecha_diligenciamiento' },
];

export function getAllTokens(): TokenDefinition[] {
  return TOKEN_CATALOG;
}

export function getTokenCategories(): TokenCategory[] {
  const categoryMap = new Map<string, TokenDefinition[]>();
  for (const token of TOKEN_CATALOG) {
    if (!categoryMap.has(token.category)) {
      categoryMap.set(token.category, []);
    }
    categoryMap.get(token.category)!.push(token);
  }
  return Array.from(categoryMap.entries()).map(([name, tokens]) => ({ name, tokens }));
}

export function getTokenByKey(key: string): TokenDefinition | undefined {
  return TOKEN_CATALOG.find(t => t.key === key);
}

export function getAutoFieldKeyForToken(tokenKey: string): AutoFieldKey | undefined {
  return TOKEN_CATALOG.find(t => t.key === tokenKey)?.autoFieldKey;
}
