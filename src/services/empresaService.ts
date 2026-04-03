import { v4 as uuid } from 'uuid';
import { Empresa, EmpresaFormData, TarifaEmpresa, TarifaEmpresaFormData } from '@/types/empresa';
import { mockEmpresas, mockTarifasEmpresa } from '@/data/mockEmpresas';
import { mockMatriculas, mockAuditLogs } from '@/data/mockData';
import { mockGruposCartera } from '@/data/mockCartera';
import { delay, ApiError } from './api';

function addAuditLog(
  accion: 'crear' | 'editar' | 'eliminar',
  entidadTipo: 'empresa' | 'tarifa_empresa',
  entidadId: string,
  valorAnterior?: Record<string, unknown>,
  valorNuevo?: Record<string, unknown>,
  camposModificados?: string[]
) {
  mockAuditLogs.push({
    id: uuid(),
    entidadTipo,
    entidadId,
    accion,
    camposModificados,
    valorAnterior,
    valorNuevo,
    usuarioId: 'current_user',
    usuarioNombre: 'Usuario Actual',
    timestamp: new Date().toISOString(),
  });
}

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
    addAuditLog('crear', 'empresa', newEmpresa.id, undefined, data as unknown as Record<string, unknown>);
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
    const valorAnterior = { ...mockEmpresas[index] };
    mockEmpresas[index] = {
      ...mockEmpresas[index],
      ...data,
      updatedAt: now,
    };

    addAuditLog('editar', 'empresa', id, valorAnterior as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>, Object.keys(data));
    return mockEmpresas[index];
  },

  async delete(id: string): Promise<void> {
    await delay(600);

    const index = mockEmpresas.findIndex(e => e.id === id);
    if (index === -1) {
      throw new ApiError('Empresa no encontrada', 404, 'NOT_FOUND');
    }

    // INC-005: Verificar integridad referencial
    const matriculasVinculadas = mockMatriculas.filter(m => m.empresaId === id);
    if (matriculasVinculadas.length > 0) {
      throw new ApiError(
        `No se puede eliminar la empresa. Tiene ${matriculasVinculadas.length} matrícula(s) vinculada(s).`,
        400,
        'TIENE_MATRICULAS'
      );
    }

    const gruposVinculados = mockGruposCartera.filter(g => {
      // Check if any responsable linked to this empresa
      return false; // Simplified — in real backend this would check responsablePago.empresaId
    });

    addAuditLog('eliminar', 'empresa', id);
    mockEmpresas.splice(index, 1);
  },

  // ============ TARIFAS ============

  async getTarifas(empresaId: string): Promise<TarifaEmpresa[]> {
    await delay(500);
    return mockTarifasEmpresa.filter(t => t.empresaId === empresaId);
  },

  async createTarifa(data: TarifaEmpresaFormData): Promise<TarifaEmpresa> {
    await delay(800);

    // INC-006: Validar unicidad empresa+nivelFormacion
    const duplicate = mockTarifasEmpresa.find(
      t => t.empresaId === data.empresaId && t.nivelFormacionId === data.nivelFormacionId
    );
    if (duplicate) {
      throw new ApiError('Ya existe una tarifa para esta combinación de empresa y nivel de formación', 400, 'TARIFA_DUPLICADA');
    }

    const now = new Date().toISOString();
    const newTarifa: TarifaEmpresa = {
      ...data,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    mockTarifasEmpresa.push(newTarifa);
    addAuditLog('crear', 'tarifa_empresa', newTarifa.id, undefined, data as unknown as Record<string, unknown>);
    return newTarifa;
  },

  async updateTarifa(id: string, data: Partial<TarifaEmpresaFormData>): Promise<TarifaEmpresa> {
    await delay(600);
    const index = mockTarifasEmpresa.findIndex(t => t.id === id);
    if (index === -1) throw new ApiError('Tarifa no encontrada', 404, 'NOT_FOUND');

    // INC-006: Validar unicidad si cambian empresa o nivelFormacion
    if (data.empresaId || data.nivelFormacionId) {
      const empresaId = data.empresaId || mockTarifasEmpresa[index].empresaId;
      const nivelFormacionId = data.nivelFormacionId || mockTarifasEmpresa[index].nivelFormacionId;
      const duplicate = mockTarifasEmpresa.find(
        t => t.id !== id && t.empresaId === empresaId && t.nivelFormacionId === nivelFormacionId
      );
      if (duplicate) {
        throw new ApiError('Ya existe una tarifa para esta combinación de empresa y nivel de formación', 400, 'TARIFA_DUPLICADA');
      }
    }

    const now = new Date().toISOString();
    const valorAnterior = { ...mockTarifasEmpresa[index] };
    mockTarifasEmpresa[index] = { ...mockTarifasEmpresa[index], ...data, updatedAt: now };
    addAuditLog('editar', 'tarifa_empresa', id, valorAnterior as unknown as Record<string, unknown>, data as unknown as Record<string, unknown>, Object.keys(data));
    return mockTarifasEmpresa[index];
  },

  async deleteTarifa(id: string): Promise<void> {
    await delay(400);
    const index = mockTarifasEmpresa.findIndex(t => t.id === id);
    if (index === -1) throw new ApiError('Tarifa no encontrada', 404, 'NOT_FOUND');
    addAuditLog('eliminar', 'tarifa_empresa', id);
    mockTarifasEmpresa.splice(index, 1);
  },
};
