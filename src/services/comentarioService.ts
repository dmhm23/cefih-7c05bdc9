import { mockComentarios, mockAuditLogs } from '@/data/mockData';
import { Comentario, SeccionComentario } from '@/types/comentario';
import { simulateApiCall } from './api';
import { v4 as uuidv4 } from 'uuid';

function addAuditLog(
  accion: 'crear' | 'editar' | 'eliminar',
  entidadId: string,
  valorAnterior?: Record<string, unknown>,
  valorNuevo?: Record<string, unknown>,
  camposModificados?: string[]
) {
  mockAuditLogs.push({
    id: uuidv4(),
    entidadTipo: 'comentario',
    entidadId,
    accion,
    camposModificados,
    valorAnterior,
    valorNuevo,
    usuarioId: 'admin1',
    usuarioNombre: 'Administrador Sistema',
    timestamp: new Date().toISOString(),
  });
}

export const comentarioService = {
  async getByEntidadSeccion(entidadId: string, seccion: SeccionComentario): Promise<Comentario[]> {
    const filtered = mockComentarios.filter(
      (c) => c.entidadId === entidadId && c.seccion === seccion
    );
    return simulateApiCall(filtered.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()), 200);
  },

  async create(data: Omit<Comentario, 'id' | 'creadoEn'>): Promise<Comentario> {
    const nuevo: Comentario = {
      ...data,
      id: uuidv4(),
      creadoEn: new Date().toISOString(),
    };
    mockComentarios.push(nuevo);
    addAuditLog('crear', nuevo.id, undefined, { texto: nuevo.texto, seccion: nuevo.seccion, entidadId: nuevo.entidadId });
    return simulateApiCall(nuevo, 200);
  },

  async update(id: string, texto: string): Promise<Comentario> {
    const idx = mockComentarios.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Comentario no encontrado');
    const anterior = mockComentarios[idx].texto;
    mockComentarios[idx] = { ...mockComentarios[idx], texto, editadoEn: new Date().toISOString() };
    addAuditLog('editar', id, { texto: anterior }, { texto }, ['texto']);
    return simulateApiCall(mockComentarios[idx], 200);
  },

  async delete(id: string): Promise<void> {
    const idx = mockComentarios.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Comentario no encontrado');
    const eliminado = mockComentarios[idx];
    mockComentarios.splice(idx, 1);
    addAuditLog('eliminar', id, { texto: eliminado.texto, seccion: eliminado.seccion, matriculaId: eliminado.matriculaId });
    return simulateApiCall(undefined, 200);
  },
};
