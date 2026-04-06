export type TipoCargo = 'entrenador' | 'supervisor' | 'administrativo' | 'instructor' | 'otro';

export interface Cargo {
  id: string;
  nombre: string;
  tipo: TipoCargo;
  createdAt: string;
  updatedAt: string;
}

export interface CargoFormData {
  nombre: string;
  tipo: TipoCargo;
}

export interface AdjuntoPersonal {
  id: string;
  nombre: string;
  tipo: string; // MIME type
  tamano: number;
  fechaCarga: string;
  dataUrl?: string; // signed URL or base64 data URL
  storagePath?: string;
}

export interface Personal {
  id: string;
  nombres: string;
  apellidos: string;
  cargoId: string;
  cargoNombre: string;
  colorCalendario?: string;
  firmaBase64?: string;
  adjuntos: AdjuntoPersonal[];
  createdAt: string;
  updatedAt: string;
}

export interface PersonalFormData {
  nombres: string;
  apellidos: string;
  cargoId: string;
  cargoNombre: string;
  colorCalendario?: string;
}

export const TIPOS_CARGO: { value: TipoCargo; label: string }[] = [
  { value: 'entrenador', label: 'Entrenador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'otro', label: 'Otro' },
];
