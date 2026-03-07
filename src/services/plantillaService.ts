import { simulateApiCall } from './api';
import { mockPlantillas } from '@/data/mockCertificados';
import type { PlantillaCertificado, PlantillaFormData } from '@/types/certificado';
import { v4 as uuidv4 } from 'uuid';

export const plantillaService = {
  async getAll(): Promise<PlantillaCertificado[]> {
    return simulateApiCall([...mockPlantillas]);
  },

  async getById(id: string): Promise<PlantillaCertificado | undefined> {
    return simulateApiCall(mockPlantillas.find(p => p.id === id));
  },

  async getActiva(): Promise<PlantillaCertificado | undefined> {
    return simulateApiCall(mockPlantillas.find(p => p.activa));
  },

  async create(data: PlantillaFormData): Promise<PlantillaCertificado> {
    const now = new Date().toISOString();
    const tokens = plantillaService.detectarTokens(data.svgRaw);
    const nueva: PlantillaCertificado = {
      ...data,
      id: uuidv4(),
      tokensDetectados: tokens,
      historial: [{ version: data.version, svgRaw: data.svgRaw, fecha: now, modificadoPor: 'admin' }],
      createdAt: now,
      updatedAt: now,
    };
    mockPlantillas.push(nueva);
    return simulateApiCall(nueva);
  },

  async update(id: string, data: Partial<PlantillaFormData>): Promise<PlantillaCertificado> {
    const idx = mockPlantillas.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Plantilla no encontrada');
    const now = new Date().toISOString();
    const updated = { ...mockPlantillas[idx], ...data, updatedAt: now };
    if (data.svgRaw) {
      updated.tokensDetectados = plantillaService.detectarTokens(data.svgRaw);
      updated.version = (mockPlantillas[idx].version || 0) + 1;
      updated.historial = [
        ...mockPlantillas[idx].historial,
        { version: updated.version, svgRaw: data.svgRaw, fecha: now, modificadoPor: 'admin' },
      ];
    }
    mockPlantillas[idx] = updated;
    return simulateApiCall(updated);
  },

  async rollback(id: string, version: number): Promise<PlantillaCertificado> {
    const idx = mockPlantillas.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Plantilla no encontrada');
    const plantilla = mockPlantillas[idx];
    const entry = plantilla.historial.find(h => h.version === version);
    if (!entry) throw new Error('Versión no encontrada');
    const now = new Date().toISOString();
    const newVersion = (plantilla.version || 0) + 1;
    const updated: PlantillaCertificado = {
      ...plantilla,
      svgRaw: entry.svgRaw,
      tokensDetectados: plantillaService.detectarTokens(entry.svgRaw),
      version: newVersion,
      historial: [...plantilla.historial, { version: newVersion, svgRaw: entry.svgRaw, fecha: now, modificadoPor: 'admin' }],
      updatedAt: now,
    };
    mockPlantillas[idx] = updated;
    return simulateApiCall(updated);
  },

  detectarTokens(svg: string): string[] {
    const matches = svg.match(/\{\{(.*?)\}\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
  },
};
