import { v4 as uuid } from 'uuid';
import { NivelFormacion, NivelFormacionFormData } from '@/types/nivelFormacion';
import { mockNivelesFormacion, mockCursos, mockAuditLogs } from '@/data/mockData';
import { delay, ApiError } from './api';

export const nivelFormacionService = {
  async getAll(): Promise<NivelFormacion[]> {
    await delay(600);
    return [...mockNivelesFormacion];
  },

  async getById(id: string): Promise<NivelFormacion | null> {
    await delay(400);
    return mockNivelesFormacion.find(n => n.id === id) || null;
  },

  async search(query: string): Promise<NivelFormacion[]> {
    await delay(400);
    const q = query.toLowerCase();
    return mockNivelesFormacion.filter(n =>
      n.nombreNivel.toLowerCase().includes(q)
    );
  },

  async create(data: NivelFormacionFormData): Promise<NivelFormacion> {
    await delay(800);

    const now = new Date().toISOString();
    const nuevo: NivelFormacion = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };

    mockNivelesFormacion.push(nuevo);

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'nivel_formacion',
      entidadId: nuevo.id,
      accion: 'crear',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return nuevo;
  },

  async update(id: string, data: Partial<NivelFormacionFormData>): Promise<NivelFormacion> {
    await delay(600);

    const index = mockNivelesFormacion.findIndex(n => n.id === id);
    if (index === -1) {
      throw new ApiError('Nivel de formación no encontrado', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    const valorAnterior = { ...mockNivelesFormacion[index] };

    mockNivelesFormacion[index] = {
      ...mockNivelesFormacion[index],
      ...data,
      updatedAt: now,
    };

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'nivel_formacion',
      entidadId: id,
      accion: 'editar',
      camposModificados: Object.keys(data),
      valorAnterior,
      valorNuevo: data,
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockNivelesFormacion[index];
  },

  async delete(id: string): Promise<void> {
    await delay(600);

    const index = mockNivelesFormacion.findIndex(n => n.id === id);
    if (index === -1) {
      throw new ApiError('Nivel de formación no encontrado', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'nivel_formacion',
      entidadId: id,
      accion: 'eliminar',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    mockNivelesFormacion.splice(index, 1);
  },
};
