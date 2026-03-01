import { simulateApiCall } from './api';
import { mockExcepcionesCertificado } from '@/data/mockCertificados';
import type { SolicitudExcepcionCertificado } from '@/types/certificado';
import { v4 as uuidv4 } from 'uuid';

export const excepcionCertificadoService = {
  async getAll(): Promise<SolicitudExcepcionCertificado[]> {
    return simulateApiCall([...mockExcepcionesCertificado]);
  },

  async getById(id: string): Promise<SolicitudExcepcionCertificado | undefined> {
    return simulateApiCall(mockExcepcionesCertificado.find(e => e.id === id));
  },

  async getByMatricula(matriculaId: string): Promise<SolicitudExcepcionCertificado[]> {
    return simulateApiCall(mockExcepcionesCertificado.filter(e => e.matriculaId === matriculaId));
  },

  async solicitar(matriculaId: string, solicitadoPor: string, motivo: string): Promise<SolicitudExcepcionCertificado> {
    const nueva: SolicitudExcepcionCertificado = {
      id: uuidv4(),
      matriculaId,
      solicitadoPor,
      motivo,
      estado: 'pendiente',
      fechaSolicitud: new Date().toISOString(),
    };
    mockExcepcionesCertificado.push(nueva);
    return simulateApiCall(nueva);
  },

  async aprobar(id: string, resueltoPor: string): Promise<SolicitudExcepcionCertificado> {
    const idx = mockExcepcionesCertificado.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Excepción no encontrada');
    mockExcepcionesCertificado[idx] = {
      ...mockExcepcionesCertificado[idx],
      estado: 'aprobada',
      resueltoPor,
      fechaResolucion: new Date().toISOString(),
    };
    return simulateApiCall(mockExcepcionesCertificado[idx]);
  },

  async rechazar(id: string, resueltoPor: string): Promise<SolicitudExcepcionCertificado> {
    const idx = mockExcepcionesCertificado.findIndex(e => e.id === id);
    if (idx === -1) throw new Error('Excepción no encontrada');
    mockExcepcionesCertificado[idx] = {
      ...mockExcepcionesCertificado[idx],
      estado: 'rechazada',
      resueltoPor,
      fechaResolucion: new Date().toISOString(),
    };
    return simulateApiCall(mockExcepcionesCertificado[idx]);
  },
};
