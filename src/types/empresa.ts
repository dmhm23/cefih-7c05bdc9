export interface ContactoEmpresa {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  esPrincipal: boolean;
}

export interface Empresa {
  id: string;
  nombreEmpresa: string;
  nit: string;
  representanteLegal: string;
  sectorEconomico: string;
  arl: string;
  direccion: string;
  telefonoEmpresa: string;
  contactos: ContactoEmpresa[];
  /** @deprecated Use contactos[0] instead */
  personaContacto: string;
  /** @deprecated Use contactos[0] instead */
  telefonoContacto: string;
  /** @deprecated Use contactos[0] instead */
  emailContacto: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmpresaFormData = Omit<Empresa, 'id' | 'createdAt' | 'updatedAt' | 'activo'>;

export interface TarifaEmpresa {
  id: string;
  empresaId: string;
  nivelFormacionId: string;
  nivelFormacionNombre: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export type TarifaEmpresaFormData = Omit<TarifaEmpresa, 'id' | 'createdAt' | 'updatedAt'>;
