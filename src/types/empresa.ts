export interface Empresa {
  id: string;
  nombreEmpresa: string;
  nit: string;
  representanteLegal: string;
  sectorEconomico: string;
  arl: string;
  direccion: string;
  telefonoEmpresa: string;
  personaContacto: string;
  telefonoContacto: string;
  emailContacto: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmpresaFormData = Omit<Empresa, 'id' | 'createdAt' | 'updatedAt'>;

export interface TarifaEmpresa {
  id: string;
  empresaId: string;
  cursoId: string;
  cursoNombre: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export type TarifaEmpresaFormData = Omit<TarifaEmpresa, 'id' | 'createdAt' | 'updatedAt'>;
