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
