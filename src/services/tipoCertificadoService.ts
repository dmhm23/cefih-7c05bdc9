import { simulateApiCall } from './api';
import { mockTiposCertificado } from '@/data/mockCertificados';
import type { TipoCertificado, TipoCertificadoFormData } from '@/types/certificado';
import type { TipoFormacion } from '@/types/curso';
import { v4 as uuidv4 } from 'uuid';

export const tipoCertificadoService = {
  async getAll(): Promise<TipoCertificado[]> {
    return simulateApiCall([...mockTiposCertificado]);
  },

  async getById(id: string): Promise<TipoCertificado | undefined> {
    return simulateApiCall(mockTiposCertificado.find(t => t.id === id));
  },

  async getByTipoFormacion(tipo: TipoFormacion): Promise<TipoCertificado[]> {
    return simulateApiCall(mockTiposCertificado.filter(t => t.tipoFormacion === tipo));
  },

  async create(data: TipoCertificadoFormData): Promise<TipoCertificado> {
    const now = new Date().toISOString();
    const nuevo: TipoCertificado = { ...data, id: uuidv4(), createdAt: now, updatedAt: now };
    mockTiposCertificado.push(nuevo);
    return simulateApiCall(nuevo);
  },

  async update(id: string, data: Partial<TipoCertificadoFormData>): Promise<TipoCertificado> {
    const idx = mockTiposCertificado.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tipo de certificado no encontrado');
    mockTiposCertificado[idx] = { ...mockTiposCertificado[idx], ...data, updatedAt: new Date().toISOString() };
    return simulateApiCall(mockTiposCertificado[idx]);
  },

  async delete(id: string): Promise<void> {
    const idx = mockTiposCertificado.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tipo de certificado no encontrado');
    mockTiposCertificado.splice(idx, 1);
    return simulateApiCall(undefined as void);
  },
};
