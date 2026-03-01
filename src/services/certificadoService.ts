import { simulateApiCall } from './api';
import { mockCertificados } from '@/data/mockCertificados';
import type { CertificadoGenerado, CertificadoFormData } from '@/types/certificado';
import { v4 as uuidv4 } from 'uuid';

export const certificadoService = {
  async getAll(): Promise<CertificadoGenerado[]> {
    return simulateApiCall([...mockCertificados]);
  },

  async getById(id: string): Promise<CertificadoGenerado | undefined> {
    return simulateApiCall(mockCertificados.find(c => c.id === id));
  },

  async getByMatricula(matriculaId: string): Promise<CertificadoGenerado[]> {
    return simulateApiCall(mockCertificados.filter(c => c.matriculaId === matriculaId));
  },

  async getByCurso(cursoId: string): Promise<CertificadoGenerado[]> {
    return simulateApiCall(mockCertificados.filter(c => c.cursoId === cursoId));
  },

  async create(data: CertificadoFormData): Promise<CertificadoGenerado> {
    const now = new Date().toISOString();
    const nuevo: CertificadoGenerado = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    mockCertificados.push(nuevo);
    return simulateApiCall(nuevo);
  },

  async generar(params: {
    matriculaId: string;
    cursoId: string;
    personaId: string;
    plantillaId: string;
    tipoCertificadoId: string;
    svgFinal: string;
    snapshotDatos: Record<string, unknown>;
    codigo: string;
  }): Promise<CertificadoGenerado> {
    const now = new Date().toISOString();
    const nuevo: CertificadoGenerado = {
      id: uuidv4(),
      matriculaId: params.matriculaId,
      cursoId: params.cursoId,
      personaId: params.personaId,
      plantillaId: params.plantillaId,
      tipoCertificadoId: params.tipoCertificadoId,
      codigo: params.codigo,
      estado: 'generado',
      snapshotDatos: params.snapshotDatos,
      svgFinal: params.svgFinal,
      version: 1,
      fechaGeneracion: now,
      createdAt: now,
      updatedAt: now,
    };
    mockCertificados.push(nuevo);
    return simulateApiCall(nuevo);
  },

  async revocar(id: string, revocadoPor: string, motivo: string): Promise<CertificadoGenerado> {
    const idx = mockCertificados.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Certificado no encontrado');
    const now = new Date().toISOString();
    mockCertificados[idx] = {
      ...mockCertificados[idx],
      estado: 'revocado',
      revocadoPor,
      motivoRevocacion: motivo,
      fechaRevocacion: now,
      updatedAt: now,
    };
    return simulateApiCall(mockCertificados[idx]);
  },
};
