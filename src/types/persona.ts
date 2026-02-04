// Tipos de documento de identidad
export type TipoDocumento = 'CC' | 'CE' | 'PA' | 'PE' | 'PP';

// Género
export type Genero = 'M' | 'F';

// Niveles educativos
export type NivelEducativo = 
  | 'primaria' 
  | 'secundaria' 
  | 'bachiller' 
  | 'tecnico' 
  | 'tecnologo' 
  | 'universitario' 
  | 'especializacion' 
  | 'maestria' 
  | 'doctorado';

// Áreas de trabajo
export type AreaTrabajo = 'administrativo' | 'operativa';

export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface Persona {
  id: string;
  
  // Datos de identificación
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  
  // Datos personales
  nombres: string;
  apellidos: string;
  genero: Genero;
  paisNacimiento: string;
  fechaNacimiento: string;
  
  // Datos laborales/educativos
  nivelEducativo: NivelEducativo;
  areaTrabajo: AreaTrabajo;
  sectorEconomico: string;
  
  // Datos de contacto
  email: string;
  telefono: string;
  direccion: string;
  
  // Seguridad social
  eps: string;
  arl: string;
  
  // Contacto de emergencia
  contactoEmergencia: ContactoEmergencia;
  
  // Firma digital
  firma?: string; // Base64
  firmaFecha?: string;
  
  // Auditoría
  createdAt: string;
  updatedAt: string;
}

export type PersonaFormData = Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>;
