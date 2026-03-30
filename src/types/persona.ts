// Tipos de documento de identidad
export type TipoDocumento = 'CC' | 'CE' | 'PA' | 'PE' | 'PP';

// Género
export type Genero = 'M' | 'F' | 'O';

// Niveles educativos
export type NivelEducativo = 
  | 'analfabeta'
  | 'primaria' 
  | 'secundaria' 
  | 'bachiller' 
  | 'tecnico' 
  | 'tecnologo' 
  | 'universitario' 
  | 'especializacion' 
  | 'maestria' 
  | 'doctorado';

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
  rh: string;
  
  // Datos laborales/educativos
  nivelEducativo: NivelEducativo;
  
  // Datos de contacto
  email: string;
  telefono: string;
  
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
