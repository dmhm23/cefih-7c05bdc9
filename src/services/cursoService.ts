import { v4 as uuid } from 'uuid';
import { Curso, CursoFormData, EstadoCurso } from '@/types/curso';
import { mockCursos, mockMatriculas, mockAuditLogs } from '@/data/mockData';
import { delay, ApiError } from './api';

export const cursoService = {
  async getAll(): Promise<Curso[]> {
    await delay(800);
    return [...mockCursos];
  },

  async getById(id: string): Promise<Curso | null> {
    await delay(500);
    return mockCursos.find(c => c.id === id) || null;
  },

  async getByEstado(estado: EstadoCurso): Promise<Curso[]> {
    await delay(600);
    return mockCursos.filter(c => c.estado === estado);
  },

  async search(query: string): Promise<Curso[]> {
    await delay(600);
    const lowerQuery = query.toLowerCase();
    return mockCursos.filter(c =>
      c.nombre.toLowerCase().includes(lowerQuery) ||
      c.entrenadorNombre.toLowerCase().includes(lowerQuery)
    );
  },

  async create(data: CursoFormData): Promise<Curso> {
    await delay(1000);

    const now = new Date().toISOString();
    const newCurso: Curso = {
      ...data,
      id: uuid(),
      matriculasIds: [],
      createdAt: now,
      updatedAt: now,
    };

    mockCursos.push(newCurso);

    // Log de auditoría
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'curso',
      entidadId: newCurso.id,
      accion: 'crear',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return newCurso;
  },

  async update(id: string, data: Partial<CursoFormData>): Promise<Curso> {
    await delay(800);

    const index = mockCursos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new ApiError('Curso no encontrado', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    const valorAnterior = { ...mockCursos[index] };

    mockCursos[index] = {
      ...mockCursos[index],
      ...data,
      updatedAt: now,
    };

    // Log de auditoría
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'curso',
      entidadId: id,
      accion: 'editar',
      camposModificados: Object.keys(data),
      valorAnterior,
      valorNuevo: data,
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockCursos[index];
  },

  async cambiarEstado(id: string, nuevoEstado: EstadoCurso): Promise<Curso> {
    await delay(600);

    const index = mockCursos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new ApiError('Curso no encontrado', 404, 'NOT_FOUND');
    }

    // Validaciones para cerrar curso
    if (nuevoEstado === 'cerrado') {
      const matriculas = mockMatriculas.filter(m => m.cursoId === id);
      const matriculasPendientes = matriculas.filter(
        m => m.estado === 'pendiente' || m.estado === 'creada'
      );

      if (matriculasPendientes.length > 0) {
        throw new ApiError(
          `No se puede cerrar el curso. Hay ${matriculasPendientes.length} matrícula(s) pendiente(s)`,
          400,
          'MATRICULAS_PENDIENTES'
        );
      }
    }

    const now = new Date().toISOString();
    const estadoAnterior = mockCursos[index].estado;

    mockCursos[index] = {
      ...mockCursos[index],
      estado: nuevoEstado,
      updatedAt: now,
    };

    // Log de auditoría
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'curso',
      entidadId: id,
      accion: 'editar',
      camposModificados: ['estado'],
      valorAnterior: { estado: estadoAnterior },
      valorNuevo: { estado: nuevoEstado },
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockCursos[index];
  },

  async getEstadisticas(id: string): Promise<{
    total: number;
    completas: number;
    pendientes: number;
    certificadas: number;
  }> {
    await delay(400);

    const matriculas = mockMatriculas.filter(m => m.cursoId === id);

    return {
      total: matriculas.length,
      completas: matriculas.filter(m => m.estado === 'completa').length,
      pendientes: matriculas.filter(m => m.estado === 'pendiente' || m.estado === 'creada').length,
      certificadas: matriculas.filter(m => m.estado === 'certificada').length,
    };
  },

  async delete(id: string): Promise<void> {
    await delay(600);

    const index = mockCursos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new ApiError('Curso no encontrado', 404, 'NOT_FOUND');
    }

    // Verificar que no tenga matrículas
    if (mockCursos[index].matriculasIds.length > 0) {
      throw new ApiError(
        'No se puede eliminar un curso con matrículas asociadas',
        400,
        'TIENE_MATRICULAS'
      );
    }

    mockCursos.splice(index, 1);
  },

  async agregarEstudiantes(cursoId: string, matriculaIds: string[]): Promise<Curso> {
    await delay(800);

    const index = mockCursos.findIndex(c => c.id === cursoId);
    if (index === -1) {
      throw new ApiError('Curso no encontrado', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();

    // Agregar matriculas al curso
    const nuevosIds = matriculaIds.filter(id => !mockCursos[index].matriculasIds.includes(id));
    mockCursos[index].matriculasIds.push(...nuevosIds);
    mockCursos[index].updatedAt = now;

    // Actualizar cursoId en cada matrícula
    for (const mId of nuevosIds) {
      const mIndex = mockMatriculas.findIndex(m => m.id === mId);
      if (mIndex !== -1) {
        mockMatriculas[mIndex].cursoId = cursoId;
      }
    }

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'curso',
      entidadId: cursoId,
      accion: 'editar',
      camposModificados: ['matriculasIds'],
      valorNuevo: { agregados: nuevosIds },
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockCursos[index];
  },

  async removerEstudiante(cursoId: string, matriculaId: string): Promise<Curso> {
    await delay(600);

    const index = mockCursos.findIndex(c => c.id === cursoId);
    if (index === -1) {
      throw new ApiError('Curso no encontrado', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();

    mockCursos[index].matriculasIds = mockCursos[index].matriculasIds.filter(id => id !== matriculaId);
    mockCursos[index].updatedAt = now;

    // Limpiar cursoId de la matrícula
    const mIndex = mockMatriculas.findIndex(m => m.id === matriculaId);
    if (mIndex !== -1) {
      mockMatriculas[mIndex].cursoId = '';
    }

    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'curso',
      entidadId: cursoId,
      accion: 'editar',
      camposModificados: ['matriculasIds'],
      valorNuevo: { removido: matriculaId },
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockCursos[index];
  },
};
