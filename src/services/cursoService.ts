import { v4 as uuid } from 'uuid';
import { Curso, CursoFormData, EstadoCurso } from '@/types/curso';
import { mockCursos, mockMatriculas, mockAuditLogs } from '@/data/mockData';
import { delay, ApiError } from './api';
import { initPortalEstudiante } from './portalInitService';

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
      minTrabajoFechasAdicionales: data.minTrabajoFechasAdicionales || [],
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
      // 1. Validar MinTrabajo
      if (!mockCursos[index].minTrabajoRegistro || !mockCursos[index].minTrabajoFechaCierrePrincipal) {
        throw new ApiError(
          'Debe registrar el número MinTrabajo y la fecha de cierre MinTrabajo antes de cerrar el curso.',
          400,
          'MINTRABAJO_REQUERIDO'
        );
      }

      // 2. Validar matrículas pendientes
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

  async actualizarMinTrabajo(id: string, data: { minTrabajoRegistro?: string; minTrabajoResponsable?: string; minTrabajoFechaCierrePrincipal?: string }): Promise<Curso> {
    await delay(600);

    const index = mockCursos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new ApiError('Curso no encontrado', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    const valorAnterior = {
      minTrabajoRegistro: mockCursos[index].minTrabajoRegistro,
      minTrabajoResponsable: mockCursos[index].minTrabajoResponsable,
      minTrabajoFechaCierrePrincipal: mockCursos[index].minTrabajoFechaCierrePrincipal,
    };

    if (data.minTrabajoRegistro !== undefined) mockCursos[index].minTrabajoRegistro = data.minTrabajoRegistro;
    if (data.minTrabajoResponsable !== undefined) mockCursos[index].minTrabajoResponsable = data.minTrabajoResponsable;
    if (data.minTrabajoFechaCierrePrincipal !== undefined) mockCursos[index].minTrabajoFechaCierrePrincipal = data.minTrabajoFechaCierrePrincipal;
    mockCursos[index].updatedAt = now;

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

  async agregarFechaAdicional(id: string, data: { fecha: string; motivo: string }): Promise<Curso> {
    await delay(400);

    const index = mockCursos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new ApiError('Curso no encontrado', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    const nuevaFecha = {
      id: uuid(),
      fecha: data.fecha,
      motivo: data.motivo,
      createdBy: 'Usuario Actual',
      createdAt: now,
    };

    mockCursos[index].minTrabajoFechasAdicionales.push(nuevaFecha);
    mockCursos[index].updatedAt = now;

    return mockCursos[index];
  },

  async eliminarFechaAdicional(id: string, fechaId: string): Promise<Curso> {
    await delay(400);

    const index = mockCursos.findIndex(c => c.id === id);
    if (index === -1) {
      throw new ApiError('Curso no encontrado', 404, 'NOT_FOUND');
    }

    mockCursos[index].minTrabajoFechasAdicionales = mockCursos[index].minTrabajoFechasAdicionales.filter(f => f.id !== fechaId);
    mockCursos[index].updatedAt = new Date().toISOString();

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

    // Transición automática: si el curso estaba 'abierto' y ahora tiene estudiantes → 'en_progreso'
    if (mockCursos[index].estado === 'abierto' && mockCursos[index].matriculasIds.length > 0) {
      mockCursos[index].estado = 'en_progreso';
    }

    // Actualizar cursoId en cada matrícula e inicializar portal
    for (const mId of nuevosIds) {
      const mIndex = mockMatriculas.findIndex(m => m.id === mId);
      if (mIndex !== -1) {
        mockMatriculas[mIndex].cursoId = cursoId;
        initPortalEstudiante(mockMatriculas[mIndex], mockCursos[index]);
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

    // Transición automática: si quedan 0 estudiantes y el curso estaba 'en_progreso' → vuelve a 'abierto'
    if (mockCursos[index].estado === 'en_progreso' && mockCursos[index].matriculasIds.length === 0) {
      mockCursos[index].estado = 'abierto';
    }

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
