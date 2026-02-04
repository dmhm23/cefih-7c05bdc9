export interface ContactoEmergencia {
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface Persona {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  direccion: string;
  eps: string;
  arl: string;
  contactoEmergencia: ContactoEmergencia;
  firma?: string; // Base64
  firmaFecha?: string;
  createdAt: string;
  updatedAt: string;
}

export type PersonaFormData = Omit<Persona, 'id' | 'createdAt' | 'updatedAt'>;
