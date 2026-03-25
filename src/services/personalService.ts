import { v4 as uuid } from 'uuid';
import { Personal, PersonalFormData, Cargo, CargoFormData, TipoCargo, AdjuntoPersonal } from '@/types/personal';
import { mockPersonalStaff, mockCargos, mockAuditLogs } from '@/data/mockData';
import { delay, ApiError } from './api';

export const personalService = {
  // ============ PERSONAL ============
  async getAll(): Promise<Personal[]> {
    await delay(800);
    return [...mockPersonalStaff];
  },

  async getById(id: string): Promise<Personal | null> {
    await delay(500);
    return mockPersonalStaff.find(p => p.id === id) || null;
  },

  async getByTipoCargo(tipo: TipoCargo): Promise<Personal[]> {
    await delay(500);
    const cargoIds = mockCargos.filter(c => c.tipo === tipo).map(c => c.id);
    return mockPersonalStaff.filter(p => cargoIds.includes(p.cargoId));
  },

  async create(data: PersonalFormData): Promise<Personal> {
    await delay(1000);
    const now = new Date().toISOString();
    const newPersonal: Personal = {
      ...data,
      id: uuid(),
      adjuntos: [],
      createdAt: now,
      updatedAt: now,
    };
    mockPersonalStaff.push(newPersonal);

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'personal',
      entidadId: newPersonal.id,
      accion: 'crear',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return newPersonal;
  },

  async update(id: string, data: Partial<PersonalFormData>): Promise<Personal> {
    await delay(800);
    const index = mockPersonalStaff.findIndex(p => p.id === id);
    if (index === -1) throw new ApiError('Personal no encontrado', 404, 'NOT_FOUND');

    const now = new Date().toISOString();
    mockPersonalStaff[index] = { ...mockPersonalStaff[index], ...data, updatedAt: now };

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'personal',
      entidadId: id,
      accion: 'editar',
      camposModificados: Object.keys(data),
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockPersonalStaff[index];
  },

  async delete(id: string): Promise<void> {
    await delay(600);
    const index = mockPersonalStaff.findIndex(p => p.id === id);
    if (index === -1) throw new ApiError('Personal no encontrado', 404, 'NOT_FOUND');

    const now = new Date().toISOString();
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'personal',
      entidadId: id,
      accion: 'eliminar',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    mockPersonalStaff.splice(index, 1);
  },

  // ============ FIRMA ============
  async updateFirma(id: string, firmaBase64: string): Promise<Personal> {
    await delay(600);
    const index = mockPersonalStaff.findIndex(p => p.id === id);
    if (index === -1) throw new ApiError('Personal no encontrado', 404, 'NOT_FOUND');

    const now = new Date().toISOString();
    mockPersonalStaff[index] = { ...mockPersonalStaff[index], firmaBase64, updatedAt: now };

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'personal',
      entidadId: id,
      accion: 'editar',
      camposModificados: ['firmaBase64'],
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockPersonalStaff[index];
  },

  async deleteFirma(id: string): Promise<Personal> {
    await delay(400);
    const index = mockPersonalStaff.findIndex(p => p.id === id);
    if (index === -1) throw new ApiError('Personal no encontrado', 404, 'NOT_FOUND');

    const now = new Date().toISOString();
    mockPersonalStaff[index] = { ...mockPersonalStaff[index], firmaBase64: undefined, updatedAt: now };

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'personal',
      entidadId: id,
      accion: 'editar',
      camposModificados: ['firmaBase64'],
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockPersonalStaff[index];
  },

  // ============ ADJUNTOS ============
  async addAdjunto(personalId: string, file: File): Promise<AdjuntoPersonal> {
    await delay(800);
    const index = mockPersonalStaff.findIndex(p => p.id === personalId);
    if (index === -1) throw new ApiError('Personal no encontrado', 404, 'NOT_FOUND');

    const now = new Date().toISOString();

    // Read file as data URL for mock storage
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const adjunto: AdjuntoPersonal = {
      id: uuid(),
      nombre: file.name,
      tipo: file.type,
      tamano: file.size,
      fechaCarga: now,
      dataUrl,
    };

    if (!mockPersonalStaff[index].adjuntos) {
      mockPersonalStaff[index].adjuntos = [];
    }
    mockPersonalStaff[index].adjuntos.push(adjunto);
    mockPersonalStaff[index].updatedAt = now;

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'personal',
      entidadId: personalId,
      accion: 'editar',
      camposModificados: ['adjuntos'],
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return adjunto;
  },

  async deleteAdjunto(personalId: string, adjuntoId: string): Promise<void> {
    await delay(400);
    const index = mockPersonalStaff.findIndex(p => p.id === personalId);
    if (index === -1) throw new ApiError('Personal no encontrado', 404, 'NOT_FOUND');

    const adjIndex = mockPersonalStaff[index].adjuntos?.findIndex(a => a.id === adjuntoId) ?? -1;
    if (adjIndex === -1) throw new ApiError('Adjunto no encontrado', 404, 'NOT_FOUND');

    const now = new Date().toISOString();
    mockPersonalStaff[index].adjuntos.splice(adjIndex, 1);
    mockPersonalStaff[index].updatedAt = now;

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'personal',
      entidadId: personalId,
      accion: 'editar',
      camposModificados: ['adjuntos'],
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });
  },

  // ============ CARGOS ============
  async getAllCargos(): Promise<Cargo[]> {
    await delay(500);
    return [...mockCargos];
  },

  async createCargo(data: CargoFormData): Promise<Cargo> {
    await delay(800);
    const exists = mockCargos.find(c => c.nombre.toLowerCase() === data.nombre.toLowerCase());
    if (exists) throw new ApiError('Ya existe un rol con ese nombre', 400, 'CARGO_DUPLICADO');

    const now = new Date().toISOString();
    const newCargo: Cargo = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    mockCargos.push(newCargo);

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'cargo',
      entidadId: newCargo.id,
      accion: 'crear',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return newCargo;
  },

  async updateCargo(id: string, data: Partial<CargoFormData>): Promise<Cargo> {
    await delay(800);
    const index = mockCargos.findIndex(c => c.id === id);
    if (index === -1) throw new ApiError('Rol no encontrado', 404, 'NOT_FOUND');

    if (data.nombre) {
      const duplicate = mockCargos.find(c => c.id !== id && c.nombre.toLowerCase() === data.nombre!.toLowerCase());
      if (duplicate) throw new ApiError('Ya existe un rol con ese nombre', 400, 'CARGO_DUPLICADO');
    }

    const now = new Date().toISOString();
    mockCargos[index] = { ...mockCargos[index], ...data, updatedAt: now };

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'cargo',
      entidadId: id,
      accion: 'editar',
      camposModificados: Object.keys(data),
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockCargos[index];
  },

  async deleteCargo(id: string): Promise<void> {
    await delay(600);
    const index = mockCargos.findIndex(c => c.id === id);
    if (index === -1) throw new ApiError('Rol no encontrado', 404, 'NOT_FOUND');

    const inUse = mockPersonalStaff.some(p => p.cargoId === id);
    if (inUse) throw new ApiError('No se puede eliminar un rol que está asignado a personal activo', 400, 'CARGO_EN_USO');

    const now = new Date().toISOString();
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'cargo',
      entidadId: id,
      accion: 'eliminar',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    mockCargos.splice(index, 1);
  },
};
