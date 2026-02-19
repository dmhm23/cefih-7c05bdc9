// Opciones para selectores de formularios

export const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'CC - Cédula de Ciudadanía' },
  { value: 'CE', label: 'CE - Cédula de Extranjería' },
  { value: 'PA', label: 'PA - Pasaporte' },
  { value: 'PE', label: 'PE - Permiso Especial' },
  { value: 'PP', label: 'PP - Permiso de Protección' },
] as const;

export const GENEROS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
] as const;

export const NIVELES_EDUCATIVOS = [
  { value: 'analfabeta', label: 'Analfabeta' },
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
  { value: 'bachiller', label: 'Bachiller' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'tecnologo', label: 'Tecnólogo' },
  { value: 'universitario', label: 'Universitario' },
  { value: 'especializacion', label: 'Especialización' },
  { value: 'maestria', label: 'Maestría' },
  { value: 'doctorado', label: 'Doctorado' },
] as const;

export const GRUPOS_SANGUINEOS = [
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
] as const;

export const AREAS_TRABAJO = [
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'operativa', label: 'Operativa' },
] as const;

export const SECTORES_ECONOMICOS = [
  { value: 'construccion', label: 'Construcción' },
  { value: 'infraestructura_vial', label: 'Infraestructura vial y transporte' },
  { value: 'energia_electrica', label: 'Energía eléctrica' },
  { value: 'telecomunicaciones', label: 'Telecomunicaciones' },
  { value: 'petroleo_gas_mineria', label: 'Petróleo, gas y minería' },
  { value: 'industria_manufacturera', label: 'Industria manufacturera' },
  { value: 'mantenimiento_industrial', label: 'Mantenimiento industrial' },
  { value: 'servicios_publicos', label: 'Servicios públicos' },
  { value: 'logistica_almacenamiento', label: 'Logística y almacenamiento' },
  { value: 'limpieza_aseo', label: 'Limpieza y aseo especializado' },
  { value: 'publicidad_exterior', label: 'Publicidad exterior' },
  { value: 'agricultura_tecnificada', label: 'Agricultura tecnificada' },
  { value: 'sector_forestal', label: 'Sector forestal' },
  { value: 'aeronautica', label: 'Aeronáutica' },
  { value: 'naval_portuario', label: 'Sector naval y portuario' },
  { value: 'eventos_espectaculos', label: 'Eventos y espectáculos' },
  { value: 'educacion_formacion', label: 'Educación y formación técnica' },
  { value: 'salud_investigacion', label: 'Salud e investigación' },
  { value: 'bienes_raices', label: 'Bienes raíces y administración de propiedades' },
  { value: 'energias_renovables', label: 'Energías renovables' },
] as const;

// Lista de países con Colombia primero como sugerencia principal
export const PAISES = [
  // Sugerencia principal
  { value: 'CO', label: 'Colombia' },
  
  // Latinoamérica
  { value: 'VE', label: 'Venezuela' },
  { value: 'EC', label: 'Ecuador' },
  { value: 'PE', label: 'Perú' },
  { value: 'BR', label: 'Brasil' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'MX', label: 'México' },
  { value: 'PA', label: 'Panamá' },
  { value: 'CR', label: 'Costa Rica' },
  { value: 'BO', label: 'Bolivia' },
  { value: 'PY', label: 'Paraguay' },
  { value: 'UY', label: 'Uruguay' },
  { value: 'GT', label: 'Guatemala' },
  { value: 'HN', label: 'Honduras' },
  { value: 'SV', label: 'El Salvador' },
  { value: 'NI', label: 'Nicaragua' },
  { value: 'CU', label: 'Cuba' },
  { value: 'DO', label: 'República Dominicana' },
  { value: 'PR', label: 'Puerto Rico' },
  
  // Norteamérica
  { value: 'US', label: 'Estados Unidos' },
  { value: 'CA', label: 'Canadá' },
  
  // Europa
  { value: 'ES', label: 'España' },
  { value: 'FR', label: 'Francia' },
  { value: 'DE', label: 'Alemania' },
  { value: 'IT', label: 'Italia' },
  { value: 'PT', label: 'Portugal' },
  { value: 'GB', label: 'Reino Unido' },
  { value: 'NL', label: 'Países Bajos' },
  { value: 'BE', label: 'Bélgica' },
  { value: 'CH', label: 'Suiza' },
  { value: 'AT', label: 'Austria' },
  { value: 'SE', label: 'Suecia' },
  { value: 'NO', label: 'Noruega' },
  { value: 'DK', label: 'Dinamarca' },
  { value: 'FI', label: 'Finlandia' },
  { value: 'PL', label: 'Polonia' },
  { value: 'IE', label: 'Irlanda' },
  
  // Asia
  { value: 'CN', label: 'China' },
  { value: 'JP', label: 'Japón' },
  { value: 'KR', label: 'Corea del Sur' },
  { value: 'IN', label: 'India' },
  
  // Oceanía
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'Nueva Zelanda' },
  
  // África
  { value: 'ZA', label: 'Sudáfrica' },
  { value: 'EG', label: 'Egipto' },
  { value: 'MA', label: 'Marruecos' },
] as const;

export const NIVELES_PREVIOS = [
  { value: 'trabajador_autorizado', label: 'Trabajador Autorizado' },
  { value: 'avanzado', label: 'Avanzado Trabajo en Alturas' },
] as const;

export const TIPOS_VINCULACION = [
  { value: 'empresa', label: 'Empresa' },
  { value: 'independiente', label: 'Independiente' },
] as const;

export const NIVELES_FORMACION_EMPRESA = [
  { value: 'jefe_area', label: 'Jefe de Área' },
  { value: 'trabajador_autorizado', label: 'Trabajador Autorizado' },
  { value: 'reentrenamiento', label: 'Reentrenamiento' },
  { value: 'coordinador_ta', label: 'Coordinador T.A.' },
] as const;

export const FORMAS_PAGO = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'consignacion', label: 'Consignación' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
] as const;

// Tipos derivados para TypeScript
export type TipoDocumentoOption = typeof TIPOS_DOCUMENTO[number];
export type GeneroOption = typeof GENEROS[number];
export type NivelEducativoOption = typeof NIVELES_EDUCATIVOS[number];
export type AreaTrabajoOption = typeof AREAS_TRABAJO[number];
export type SectorEconomicoOption = typeof SECTORES_ECONOMICOS[number];
export type PaisOption = typeof PAISES[number];
export type GrupoSanguineoOption = typeof GRUPOS_SANGUINEOS[number];
export type NivelPrevioOption = typeof NIVELES_PREVIOS[number];
export type TipoVinculacionOption = typeof TIPOS_VINCULACION[number];
export type NivelFormacionEmpresaOption = typeof NIVELES_FORMACION_EMPRESA[number];

export const EPS_OPTIONS = [
  { value: 'coosalud', label: 'Coosalud EPS-S' },
  { value: 'nueva_eps', label: 'Nueva EPS' },
  { value: 'mutual_ser', label: 'Mutual Ser' },
  { value: 'salud_mia', label: 'Salud Mía' },
  { value: 'aliansalud', label: 'Aliansalud EPS' },
  { value: 'salud_total', label: 'Salud Total EPS S.A.' },
  { value: 'sanitas', label: 'EPS Sanitas' },
  { value: 'sura_eps', label: 'EPS Sura' },
  { value: 'famisanar', label: 'Famisanar' },
  { value: 'sos', label: 'Servicio Occidental de Salud EPS SOS' },
  { value: 'comfenalco_valle', label: 'Comfenalco Valle' },
  { value: 'compensar', label: 'Compensar EPS' },
  { value: 'epm', label: 'EPM - Empresas Públicas de Medellín' },
  { value: 'fondo_ferrocarriles', label: 'Fondo de Pasivo Social de Ferrocarriles Nacionales de Colombia' },
  { value: 'cajacopi', label: 'Cajacopi Atlántico' },
  { value: 'familiar_colombia', label: 'EPS Familiar de Colombia' },
  { value: 'capital_salud', label: 'Capital Salud' },
  { value: 'asmet_salud', label: 'Asmet Salud' },
  { value: 'emssanar', label: 'Emssanar' },
  { value: 'savia_salud', label: 'Savia Salud' },
  { value: 'anas_wayuu', label: 'Anas Wayuu EPS' },
  { value: 'comfaoriente', label: 'Comfaoriente' },
  { value: 'comfachoco', label: 'Comfachoco' },
  { value: 'salud_vida', label: 'EPS Salud Vida' },
  { value: 'otra_eps', label: 'Otra' },
] as const;

export const ARL_OPTIONS = [
  { value: 'sura_arl', label: 'ARL Sura' },
  { value: 'positiva', label: 'Positiva Compañía de Seguros S.A.' },
  { value: 'axa_colpatria', label: 'Axa Colpatria Seguros S.A.' },
  { value: 'colmena', label: 'Colmena Seguros S.A.' },
  { value: 'aurora', label: 'Compañía de Seguros de Vida Aurora S.A.' },
  { value: 'bolivar', label: 'Seguros Bolívar S.A.' },
  { value: 'equidad', label: 'La Equidad Seguros Generales Organismo Cooperativo' },
  { value: 'alfa', label: 'Seguros Alfa' },
  { value: 'suramericana', label: 'Seguros Generales Suramericana S.A.' },
  { value: 'liberty', label: 'Liberty Seguros de Vida' },
  { value: 'otra_arl', label: 'Otra' },
] as const;

export type EpsOption = typeof EPS_OPTIONS[number];
export type ArlOption = typeof ARL_OPTIONS[number];

// ============ CURSOS ============

export const TIPOS_FORMACION_CURSO = [
  { value: 'jefe_area', label: 'Jefe de Área', duracionDias: 1, horasTotales: 8 },
  { value: 'trabajador_autorizado', label: 'Trabajador Autorizado', duracionDias: 3, horasTotales: 24 },
  { value: 'reentrenamiento', label: 'Reentrenamiento', duracionDias: 2, horasTotales: 16 },
  { value: 'coordinador_ta', label: 'Coordinador T.A.', duracionDias: 5, horasTotales: 40 },
] as const;

export const ENTRENADORES_MOCK = [
  { id: 'e1', nombre: 'Carlos Entrenador' },
  { id: 'e2', nombre: 'Maria Instructora' },
  { id: 'e3', nombre: 'Jorge Capacitador' },
] as const;

export const SUPERVISORES_MOCK = [
  { id: 's1', nombre: 'Roberto Supervisor' },
  { id: 's2', nombre: 'Diana Coordinadora' },
  { id: 's3', nombre: 'Felipe Morales' },
] as const;
