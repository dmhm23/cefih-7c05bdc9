import { v4 as uuid } from 'uuid';
import { Empresa, EmpresaFormData } from '@/types/empresa';
import { mockEmpresas } from '@/data/mockEmpresas';
import { delay, ApiError } from './api';

export const empresaService = {
  async getAll(): Promise<Empresa[]> {
    await delay(800);
    return [...mockEmpresas];
  },

  async getById(id: string): Promise<Empresa | null> {
    await delay(500);
    return mockEmpresas.find(e => e.id === id) || null;
  },

  async search(query: string): Promise<Empresa[]> {
    await delay(600);
    const q = query.toLowerCase();
    return mockEmpresas.filter(e =>
      e.nombreEmpresa.toLowerCase().includes(q) ||
      e.nit.includes(query) ||
      e.personaContacto.toLowerCase().includes(q) ||
      e.emailContacto.toLowerCase().includes(q)
    );
  },

  async create(data: EmpresaFormData): Promise<Empresa> {
    await delay(1000);

    const exists = mockEmpresas.find(e => e.nit === data.nit);
    if (exists) {
      throw new ApiError('Ya existe una empresa con este NIT', 400, 'NIT_DUPLICADO');
    }

    const now = new Date().toISOString();
    const newEmpresa: Empresa = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };

    mockEmpresas.push(newEmpresa);
    return newEmpresa;
  },

  async update(id: string, data: Partial<EmpresaFormData>): Promise<Empresa> {
    await delay(800);

    const index = mockEmpresas.findIndex(e => e.id === id);
    if (index === -1) {
      throw new ApiError('Empresa no encontrada', 404, 'NOT_FOUND');
    }

    if (data.nit) {
      const duplicate = mockEmpresas.find(e => e.nit === data.nit && e.id !== id);
      if (duplicate) {
        throw new ApiError('Ya existe una empresa con este NIT', 400, 'NIT_DUPLICADO');
      }
    }

    const now = new Date().toISOString();
    mockEmpresas[index] = {
      ...mockEmpresas[index],
      ...data,
      updatedAt: now,
    };

    return mockEmpresas[index];
  },

  async delete(id: string): Promise<void> {
    await delay(600);

    const index = mockEmpresas.findIndex(e => e.id === id);
    if (index === -1) {
      throw new ApiError('Empresa no encontrada', 404, 'NOT_FOUND');
    }

    mockEmpresas.splice(index, 1);
  },
};
