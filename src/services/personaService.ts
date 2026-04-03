import { v4 as uuid } from 'uuid';
import { Persona, PersonaFormData } from '@/types/persona';
import { mockPersonas, mockAuditLogs } from '@/data/mockData';
import { delay, ApiError } from './api';

export const personaService = {
  async getAll(): Promise<Persona[]> {
    await delay(800);
    return [...mockPersonas];
  },

  async getById(id: string): Promise<Persona | null> {
    await delay(500);
    return mockPersonas.find(p => p.id === id) || null;
  },

  async getByDocumento(numeroDocumento: string): Promise<Persona | null> {
    await delay(500);
    return mockPersonas.find(p => p.numeroDocumento === numeroDocumento) || null;
  },

  async search(query: string): Promise<Persona[]> {
    await delay(600);
    const lowerQuery = query.toLowerCase();
    return mockPersonas.filter(p => 
      p.numeroDocumento.includes(query) ||
      p.nombres.toLowerCase().includes(lowerQuery) ||
      p.apellidos.toLowerCase().includes(lowerQuery) ||
      p.email.toLowerCase().includes(lowerQuery)
    );
  },

  async create(data: PersonaFormData): Promise<Persona> {
    await delay(1000);
    
    // Validar unicidad de documento
    const exists = mockPersonas.find(p => p.numeroDocumento === data.numeroDocumento);
    if (exists) {
      throw new ApiError('Ya existe una persona con este documento', 400, 'DOCUMENTO_DUPLICADO');
    }

    // INC-004: Validar contacto de emergencia
    if (!data.contactoEmergencia?.nombre || !data.contactoEmergencia?.telefono) {
      throw new ApiError('El contacto de emergencia debe tener nombre y teléfono', 400, 'CONTACTO_EMERGENCIA_INCOMPLETO');
    }

    const now = new Date().toISOString();
    const newPersona: Persona = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    
    mockPersonas.push(newPersona);

    // Log de auditoría
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'persona',
      entidadId: newPersona.id,
      accion: 'crear',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return newPersona;
  },

  async update(id: string, data: Partial<PersonaFormData>): Promise<Persona> {
    await delay(800);
    
    const index = mockPersonas.findIndex(p => p.id === id);
    if (index === -1) {
      throw new ApiError('Persona no encontrada', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    const valorAnterior = { ...mockPersonas[index] };
    
    mockPersonas[index] = {
      ...mockPersonas[index],
      ...data,
      updatedAt: now,
    };

    // Log de auditoría
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'persona',
      entidadId: id,
      accion: 'editar',
      camposModificados: Object.keys(data),
      valorAnterior,
      valorNuevo: data,
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockPersonas[index];
  },

  async delete(id: string): Promise<void> {
    await delay(600);
    
    const index = mockPersonas.findIndex(p => p.id === id);
    if (index === -1) {
      throw new ApiError('Persona no encontrada', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    
    // Log de auditoría antes de eliminar
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'persona',
      entidadId: id,
      accion: 'eliminar',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    mockPersonas.splice(index, 1);
  },
};
