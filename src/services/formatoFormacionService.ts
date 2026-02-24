import { FormatoFormacion, FormatoFormacionFormData, Bloque } from '@/types/formatoFormacion';
import { simulateApiCall } from './api';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Helpers para construir bloques
// ---------------------------------------------------------------------------

const b = (type: Bloque['type'], label: string, props?: Record<string, unknown>, extra?: Partial<BloqueBase>): Bloque => ({
  id: uuidv4(),
  type,
  label,
  ...extra,
  ...(props ? { props } : {}),
} as Bloque);

type BloqueBase = { id: string; type: string; label: string; required?: boolean };

// ---------------------------------------------------------------------------
// Mock: 4 formatos existentes pre-cargados como bloques
// ---------------------------------------------------------------------------

const BLOQUES_INFO_APRENDIZ: Bloque[] = [
  b('section_title', 'Ficha de Matrícula'),
  b('auto_field', 'Fecha inicio del curso', { key: 'fecha_inicio_curso' }),
  b('auto_field', 'Fecha finalización del curso', { key: 'fecha_fin_curso' }),
  b('auto_field', 'Empresa que paga el curso', { key: 'empresa_nombre' }),
  b('auto_field', 'Tipo de documento', { key: 'tipo_documento_aprendiz' }),
  b('auto_field', 'Número de documento', { key: 'documento_aprendiz' }),
  b('auto_field', 'Nombres y Apellidos', { key: 'nombre_aprendiz', span: true }),
  b('auto_field', 'Género', { key: 'genero_aprendiz' }),
  b('auto_field', 'País de nacimiento', { key: 'pais_nacimiento_aprendiz' }),
  b('auto_field', 'Fecha de nacimiento', { key: 'fecha_nacimiento_aprendiz' }),
  b('auto_field', 'Nivel educativo', { key: 'nivel_educativo_aprendiz' }),
  b('auto_field', 'Área de trabajo', { key: 'area_trabajo' }),
  b('auto_field', 'Cargo', { key: 'empresa_cargo' }),
  b('auto_field', 'Nivel de formación', { key: 'empresa_nivel_formacion', span: true }),

  b('section_title', 'Información de Emergencia'),
  b('auto_field', 'Contacto de emergencia', { key: 'contacto_emergencia_nombre' }),
  b('auto_field', 'Teléfono de emergencia', { key: 'contacto_emergencia_telefono' }),
  b('auto_field', 'RH del participante', { key: 'rh_aprendiz' }),

  b('section_title', 'Autoevaluación'),
  ...([
    '¿Ha realizado curso de alturas nivel Avanzado Trabajador Autorizado o Reentrenamiento con anterioridad?',
    '¿Sabe qué es un arnés y para qué sirve?',
    '¿Considera tener conocimientos y habilidades en Trabajo en Alturas?',
    '¿La Res. 4272 de 2021, es la que Establece los Requisitos Mínimos de seguridad para Trabajar en Alturas?',
    '¿Tiene presente la diferencia entre las medidas de prevención y medidas de protección contra caídas?',
    '¿Dentro de sus actividades laborales, debe desarrollar actividades superando los 2 m?',
  ].map(q => b('radio', q, { options: [
    { value: 'si', label: 'Sí' },
    { value: 'no', label: 'No' },
    { value: 'na', label: 'N/A' },
  ]}))),

  b('section_title', 'Evaluación de Competencias'),
  ...([
    '¿Sabe seguir y acatar instrucciones?',
    '¿Sabe trabajar en equipo?',
    '¿Sabe qué es acto y condición insegura?',
    '¿Qué tanta disposición tiene para desarrollar la presente formación?',
    '¿Se considera usted habilidoso para la resolución de problemas?',
  ].map(q => b('radio', q, { options: [
    { value: 'malo', label: 'Malo' },
    { value: 'aceptable', label: 'Aceptable' },
    { value: 'excelente', label: 'Excelente' },
    { value: 'na', label: 'N/A' },
  ]}))),

  b('section_title', 'Consentimiento de Salud'),
  b('health_consent', 'Consentimiento de Salud', {
    questions: [
      { id: 'restriccionMedica', label: '¿Tiene alguna restricción médica?', hasDetail: true },
      { id: 'alergias', label: '¿Tiene alergias?', hasDetail: true },
      { id: 'consumoMedicamentos', label: '¿Consume medicamentos?', hasDetail: true },
      { id: 'embarazo', label: '¿Se encuentra en estado de embarazo?', conditionalOn: "genero_F" },
      { id: 'lectoescritura', label: '¿Sabe leer y escribir?' },
    ],
  }),

  b('section_title', 'Autorización de Uso de Datos'),
  b('data_authorization', 'Autorización de Uso de Datos', {
    summaryItems: [
      'Sus Datos Sensibles: Autoriza el uso de sus datos personales, huellas, fotos y videos para fines de seguridad y registro.',
      'Publicidad y Cobros: Acepta recibir publicidad, estados de cuenta y avisos de deudas por WhatsApp y correo electrónico.',
      'Prohibición de Celulares: No puede tomar fotos ni videos durante las capacitaciones.',
      'Salud y Seguridad: Declara que su estado de salud es real y acepta los riesgos propios del entrenamiento físico.',
      'Firma Digital: Acepta que sus firmas electrónicas tengan plena validez legal, únicamente para los formatos requeridos en la formación y entrenamiento en trabajo en alturas.',
      'Sus Derechos: Puede solicitar en cualquier momento la corrección o eliminación de su información.',
    ],
  }),

  b('signature_aprendiz', 'Firma del Participante'),
];

const BLOQUES_REGISTRO_ASISTENCIA: Bloque[] = [
  b('section_title', 'Datos de Asistencia'),
  b('date', 'Fecha de asistencia', undefined, { required: true }),
  b('auto_field', 'Empresa', { key: 'empresa_nombre' }),
  b('auto_field', 'Nombres y Apellidos', { key: 'nombre_aprendiz', span: true }),
  b('auto_field', 'Tipo de documento', { key: 'tipo_documento_aprendiz' }),
  b('auto_field', 'Número de documento', { key: 'documento_aprendiz' }),
  b('auto_field', 'Instructor a cargo', { key: 'entrenador_nombre' }),
  b('signature_aprendiz', 'Firma del Participante'),
];

const TEXTO_PTA_P1 = 'En cumplimiento de la Resolución 4272 de 2021, por la cual se reglamenta el trabajo seguro en alturas en Colombia, y como parte de las actividades prácticas del curso, yo, el abajo firmante, dejo constancia de que participé activamente en el diligenciamiento del Permiso de Trabajo en Alturas (PTS) y del Análisis de Trabajo Seguro (ATS) correspondientes a la práctica desarrollada en la fecha indicada.';
const TEXTO_PTA_P2 = 'Durante esta actividad, participé en la identificación de peligros, evaluación de riesgos y definición de medidas preventivas y controles relacionados con las tareas en alturas, comprendiendo la importancia de aplicar estos procedimientos antes, durante y después de la ejecución del trabajo.';
const TEXTO_PTA_P3 = 'Reconozco que esta práctica forma parte del proceso formativo obligatorio establecido por la normativa vigente, y que su finalidad es fortalecer mis competencias técnicas y mi compromiso con la seguridad y la prevención de accidentes durante la ejecución de labores en alturas.';

const BLOQUES_PARTICIPACION_PTA_ATS: Bloque[] = [
  b('section_title', 'Declaración'),
  b('paragraph', 'Texto normativo 1', { text: TEXTO_PTA_P1 }),
  b('paragraph', 'Texto normativo 2', { text: TEXTO_PTA_P2 }),
  b('paragraph', 'Texto normativo 3', { text: TEXTO_PTA_P3 }),
  b('paragraph', 'Declaración firmante', { text: 'Con mi firma digital, declaro que:' }),
  b('paragraph', 'Compromisos', { text: '• Comprendí el objetivo y contenido del Permiso de Trabajo en Alturas (PTS) y el Análisis de Trabajo Seguro (ATS).\n• Participé en el diligenciamiento real del formato junto con mis compañeros de curso.\n• Asumo el compromiso de aplicar este conocimiento en cualquier labor en alturas, conforme a la legislación vigente.' }),

  b('section_title', 'Datos del Participante'),
  b('auto_field', 'Nombres y Apellidos', { key: 'nombre_aprendiz', span: true }),
  b('auto_field', 'Tipo de documento', { key: 'tipo_documento_aprendiz' }),
  b('auto_field', 'Número de documento', { key: 'documento_aprendiz' }),
  b('signature_aprendiz', 'Firma del Participante'),
];

const PREGUNTAS_REENTRENAMIENTO = [
  { id: 1, texto: 'La Resolución 4272 de 2021 establece los requisitos mínimos de seguridad para el trabajo seguro en alturas en Colombia.', opciones: ['Verdadero', 'Falso'], correcta: 0 },
  { id: 2, texto: 'Se considera trabajo en alturas toda actividad que se realice a una altura igual o superior a:', opciones: ['1 metro', '1.5 metros', '2 metros', '3 metros'], correcta: 2 },
  { id: 3, texto: 'El sistema de arresto de caídas tiene como objetivo:', opciones: ['Prevenir la caída del trabajador', 'Detener la caída una vez ocurre y minimizar lesiones', 'Reemplazar el uso de andamios', 'Permitir el trabajo sin supervisión'], correcta: 1 },
  { id: 4, texto: 'El punto de anclaje para trabajo en alturas debe soportar una carga mínima de:', opciones: ['5 kN (500 kg)', '15 kN (1.500 kg)', '22.2 kN (2.268 kg)', '30 kN (3.000 kg)'], correcta: 2 },
  { id: 5, texto: 'Antes de iniciar un trabajo en alturas es obligatorio diligenciar el ATS y obtener el permiso de trabajo.', opciones: ['Verdadero', 'Falso'], correcta: 0 },
  { id: 6, texto: 'El factor de caída se define como la relación entre:', opciones: ['El peso del trabajador y la resistencia del arnés', 'La distancia de caída y la longitud de la cuerda de vida', 'La altura del punto de anclaje y el piso', 'La velocidad de caída y el tiempo de detención'], correcta: 1 },
  { id: 7, texto: '¿Cuál de las siguientes es una medida de PREVENCIÓN contra caídas?', opciones: ['Arnés de cuerpo completo', 'Red de seguridad', 'Delimitación y señalización del área de trabajo', 'Línea de vida horizontal'], correcta: 2 },
  { id: 8, texto: 'El EPP para trabajo en alturas incluye obligatoriamente el casco con barbuquejo en posición de uso.', opciones: ['Verdadero', 'Falso'], correcta: 0 },
  { id: 9, texto: 'Un trabajador autorizado para trabajo en alturas está capacitado para:', opciones: ['Diseñar sistemas de anclaje y supervisar', 'Ingresar a zonas con riesgo de caída y realizar la tarea bajo supervisión', 'Aprobar permisos de trabajo y hacer inspección', 'Reemplazar al coordinador en su ausencia'], correcta: 1 },
  { id: 10, texto: 'La vida útil de un arnés que ha detenido una caída es:', opciones: ['Puede seguir usándose si no presenta daños visibles', 'Se reduce a la mitad de su vida útil original', 'Termina inmediatamente; debe retirarse del servicio', 'Se extiende si se somete a mantenimiento'], correcta: 2 },
  { id: 11, texto: 'La distancia de detención total incluye: longitud del absorbedor + extensión de la cuerda + desplazamiento del cuerpo.', opciones: ['Verdadero', 'Falso'], correcta: 0 },
  { id: 12, texto: '¿Qué acción debe tomar un trabajador al detectar un equipo con daño visible?', opciones: ['Reportarlo al coordinador y NO usar el equipo', 'Usarlo con precaución si el daño parece menor', 'Repararlo él mismo', 'Continuar y reportar al finalizar la jornada'], correcta: 0 },
  { id: 13, texto: 'El síndrome de arnés puede ocurrir cuando un trabajador queda suspendido sin movimiento por más de:', opciones: ['1 minuto', '5 minutos', '30 minutos', '1 hora'], correcta: 1 },
  { id: 14, texto: 'Los andamios tubulares deben ser inspeccionados por una persona competente antes de su uso.', opciones: ['Verdadero', 'Falso'], correcta: 0 },
  { id: 15, texto: 'El programa de protección contra caídas debe incluir como mínimo:', opciones: ['Inventario de EPP únicamente', 'Identificación de peligros, medidas de prevención y protección, inspección de equipos, y procedimiento de rescate', 'Solo el procedimiento de rescate y primeros auxilios', 'Únicamente la capacitación del personal'], correcta: 1 },
];

const BLOQUES_EVALUACION_REENTRENAMIENTO: Bloque[] = [
  b('section_title', 'Datos del Participante'),
  b('auto_field', 'Nombres y Apellidos', { key: 'nombre_aprendiz', span: true }),
  b('auto_field', 'Tipo de documento', { key: 'tipo_documento_aprendiz' }),
  b('auto_field', 'Número de documento', { key: 'documento_aprendiz' }),
  b('auto_field', 'Nivel de formación', { key: 'empresa_nivel_formacion' }),
  b('auto_field', 'Entrenador', { key: 'entrenador_nombre' }),

  b('section_title', 'Evaluación de Conocimientos'),
  b('evaluation_quiz', 'Evaluación Reentrenamiento', {
    umbralAprobacion: 70,
    preguntas: PREGUNTAS_REENTRENAMIENTO,
  }),

  b('section_title', 'Encuesta de Satisfacción'),
  b('satisfaction_survey', 'Encuesta de Satisfacción', {
    escalaPreguntas: [
      '¿Qué tan satisfecho se encuentra con la capacitación y entrenamiento en trabajo en alturas recibida?',
      '¿Qué tan satisfecho se encuentra con el servicio al cliente recibido por parte de todo el personal de la empresa?',
      '¿Qué tan satisfecho se encuentra con la amabilidad y el trato recibido por parte del personal?',
      '¿Qué tan satisfecho se encuentra con la calidad del servicio brindado durante todo el proceso?',
    ],
    escalaOpciones: [
      { value: 'muy_satisfecho', label: 'Muy satisfecho' },
      { value: 'satisfecho', label: 'Satisfecho' },
      { value: 'poco_satisfecho', label: 'Poco satisfecho' },
      { value: 'insatisfecho', label: 'Insatisfecho' },
    ],
    preguntaSiNo: '¿Volvería a contratar y recomendaría el servicio recibido?',
  }),

  b('signature_aprendiz', 'Firma del Participante'),
];

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

let mockFormatos: FormatoFormacion[] = [
  {
    id: 'fmt-info-aprendiz',
    nombre: 'Información del Aprendiz',
    descripcion: 'Ficha completa del aprendiz con autoevaluación, competencias, salud y autorización de datos',
    codigo: 'FIH04-013',
    version: '021',
    asignacionScope: 'tipo_curso',
    nivelFormacionIds: [],
    tipoCursoKeys: ['jefe_area', 'trabajador_autorizado', 'reentrenamiento', 'coordinador_ta'],
    visibleEnMatricula: true,
    visibleEnCurso: false,
    activo: true,
    esAutomatico: false,
    requiereFirmaAprendiz: true,
    requiereFirmaEntrenador: false,
    requiereFirmaSupervisor: false,
    bloques: BLOQUES_INFO_APRENDIZ,
    documentMeta: { fechaCreacion: '22/03/2018', fechaEdicion: '17/02/2025', subsistema: 'Alturas' },
    legacyComponentId: 'info_aprendiz',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fmt-registro-asistencia',
    nombre: 'Registro de Asistencia de Formación y Entrenamiento en Alturas',
    descripcion: 'Registro de asistencia por día de formación',
    codigo: 'FIH04-014',
    version: '009',
    asignacionScope: 'tipo_curso',
    nivelFormacionIds: [],
    tipoCursoKeys: ['jefe_area', 'trabajador_autorizado', 'reentrenamiento', 'coordinador_ta'],
    visibleEnMatricula: true,
    visibleEnCurso: false,
    activo: true,
    esAutomatico: false,
    requiereFirmaAprendiz: true,
    requiereFirmaEntrenador: false,
    requiereFirmaSupervisor: false,
    bloques: BLOQUES_REGISTRO_ASISTENCIA,
    documentMeta: { fechaCreacion: '12/04/2018', fechaEdicion: '03/2025', subsistema: 'Alturas' },
    legacyComponentId: 'registro_asistencia',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fmt-participacion-pta-ats',
    nombre: 'Participación en el Diligenciamiento del PTA - ATS',
    descripcion: 'Declaración de participación en Permiso de Trabajo en Alturas y Análisis de Trabajo Seguro',
    codigo: 'FIH04-077',
    version: '001',
    asignacionScope: 'tipo_curso',
    nivelFormacionIds: [],
    tipoCursoKeys: ['trabajador_autorizado', 'reentrenamiento', 'coordinador_ta'],
    visibleEnMatricula: true,
    visibleEnCurso: false,
    activo: true,
    esAutomatico: false,
    requiereFirmaAprendiz: true,
    requiereFirmaEntrenador: false,
    requiereFirmaSupervisor: false,
    bloques: BLOQUES_PARTICIPACION_PTA_ATS,
    documentMeta: { fechaCreacion: '10/03/2025', fechaEdicion: '03/2025', subsistema: 'Alturas' },
    legacyComponentId: 'participacion_pta_ats',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'fmt-evaluacion-reentrenamiento',
    nombre: 'Evaluación de Reentrenamiento en Trabajo en Alturas',
    descripcion: 'Evaluación de conocimientos (15 preguntas) con encuesta de satisfacción',
    codigo: 'FIH04-019',
    version: '009',
    asignacionScope: 'tipo_curso',
    nivelFormacionIds: [],
    tipoCursoKeys: ['reentrenamiento'],
    visibleEnMatricula: true,
    visibleEnCurso: false,
    activo: true,
    esAutomatico: false,
    requiereFirmaAprendiz: true,
    requiereFirmaEntrenador: false,
    requiereFirmaSupervisor: false,
    bloques: BLOQUES_EVALUACION_REENTRENAMIENTO,
    documentMeta: { fechaCreacion: '12/04/2018', fechaEdicion: '03/2025', subsistema: 'Alturas' },
    legacyComponentId: 'evaluacion_reentrenamiento',
    createdAt: now,
    updatedAt: now,
  },
];

// ---------------------------------------------------------------------------
// CRUD Service
// ---------------------------------------------------------------------------

export const formatoFormacionService = {
  getAll: async (): Promise<FormatoFormacion[]> => {
    return simulateApiCall([...mockFormatos]);
  },

  getById: async (id: string): Promise<FormatoFormacion | undefined> => {
    return simulateApiCall(mockFormatos.find(f => f.id === id));
  },

  create: async (data: FormatoFormacionFormData): Promise<FormatoFormacion> => {
    const nuevo: FormatoFormacion = {
      ...data,
      id: `fmt-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockFormatos.push(nuevo);
    return simulateApiCall(nuevo);
  },

  update: async (id: string, data: Partial<FormatoFormacionFormData>): Promise<FormatoFormacion> => {
    const idx = mockFormatos.findIndex(f => f.id === id);
    if (idx === -1) throw new Error(`Formato ${id} no encontrado`);
    mockFormatos[idx] = { ...mockFormatos[idx], ...data, updatedAt: new Date().toISOString() };
    return simulateApiCall(mockFormatos[idx]);
  },

  toggleActivo: async (id: string): Promise<FormatoFormacion> => {
    const idx = mockFormatos.findIndex(f => f.id === id);
    if (idx === -1) throw new Error(`Formato ${id} no encontrado`);
    mockFormatos[idx] = { ...mockFormatos[idx], activo: !mockFormatos[idx].activo, updatedAt: new Date().toISOString() };
    return simulateApiCall(mockFormatos[idx]);
  },

  duplicate: async (id: string): Promise<FormatoFormacion> => {
    const original = mockFormatos.find(f => f.id === id);
    if (!original) throw new Error(`Formato ${id} no encontrado`);
    const copia: FormatoFormacion = {
      ...original,
      id: `fmt-${uuidv4().slice(0, 8)}`,
      nombre: `${original.nombre} (copia)`,
      legacyComponentId: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockFormatos.push(copia);
    return simulateApiCall(copia);
  },

  search: async (query: string): Promise<FormatoFormacion[]> => {
    const q = query.toLowerCase();
    const results = mockFormatos.filter(f =>
      f.nombre.toLowerCase().includes(q) ||
      f.codigo.toLowerCase().includes(q) ||
      f.descripcion.toLowerCase().includes(q)
    );
    return simulateApiCall(results);
  },

  /** Obtener formatos aplicables para una matrícula según tipo de curso */
  getForMatricula: async (tipoCurso: string): Promise<FormatoFormacion[]> => {
    const results = mockFormatos.filter(f =>
      f.activo &&
      f.visibleEnMatricula &&
      (f.asignacionScope === 'tipo_curso'
        ? f.tipoCursoKeys.includes(tipoCurso as any)
        : true) // nivel_formacion scope se resolverá en Parte 3
    );
    return simulateApiCall(results);
  },
};
