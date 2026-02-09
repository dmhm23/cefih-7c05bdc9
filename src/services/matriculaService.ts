import { v4 as uuid } from 'uuid';
import { Matricula, MatriculaFormData, EstadoMatricula, DocumentoRequerido } from '@/types/matricula';
import { mockMatriculas, mockCursos, mockAuditLogs } from '@/data/mockData';
import { delay, ApiError } from './api';

export const matriculaService = {
  async getAll(): Promise<Matricula[]> {
    await delay(800);
    return [...mockMatriculas];
  },

  async getById(id: string): Promise<Matricula | null> {
    await delay(500);
    return mockMatriculas.find(m => m.id === id) || null;
  },

  async getByPersonaId(personaId: string): Promise<Matricula[]> {
    await delay(600);
    return mockMatriculas.filter(m => m.personaId === personaId);
  },

  async getByCursoId(cursoId: string): Promise<Matricula[]> {
    await delay(600);
    return mockMatriculas.filter(m => m.cursoId === cursoId);
  },

  async getByEstado(estado: EstadoMatricula): Promise<Matricula[]> {
    await delay(600);
    return mockMatriculas.filter(m => m.estado === estado);
  },

  async getHistorialByPersona(personaId: string): Promise<Matricula | null> {
    await delay(300);
    // Return the most recent completed/certified matricula for pre-filling
    const previas = mockMatriculas
      .filter(m => m.personaId === personaId && ['completa', 'certificada', 'cerrada'].includes(m.estado))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return previas[0] || null;
  },

  async create(data: Omit<MatriculaFormData, 'documentos' | 'estado'>): Promise<Matricula> {
    await delay(1000);

    // Curso es opcional ahora
    let curso = null;
    if (data.cursoId) {
      curso = mockCursos.find(c => c.id === data.cursoId);
      if (!curso) {
        throw new ApiError('Curso no encontrado', 404, 'CURSO_NOT_FOUND');
      }
      if (curso.estado === 'cerrado') {
        throw new ApiError('No se puede matricular en un curso cerrado', 400, 'CURSO_CERRADO');
      }
      if (curso.matriculasIds.length >= curso.capacidadMaxima) {
        throw new ApiError('El curso ha alcanzado su capacidad máxima', 400, 'CAPACIDAD_MAXIMA');
      }

      // Verificar que no exista matrícula duplicada
      const exists = mockMatriculas.find(
        m => m.personaId === data.personaId && m.cursoId === data.cursoId
      );
      if (exists) {
        throw new ApiError('Esta persona ya está matriculada en este curso', 400, 'MATRICULA_DUPLICADA');
      }
    }

    const now = new Date().toISOString();
    
    // Documentos requeridos por defecto
    const documentosRequeridos: DocumentoRequerido[] = [
      { id: uuid(), tipo: 'cedula', nombre: 'Cédula de Ciudadanía', estado: 'pendiente' },
      { id: uuid(), tipo: 'examen_medico', nombre: 'Examen Médico Ocupacional', estado: 'pendiente' },
      { id: uuid(), tipo: 'certificado_eps', nombre: 'Certificado EPS', estado: 'pendiente' },
    ];

    const newMatricula: Matricula = {
      ...data,
      id: uuid(),
      estado: 'creada',
      // Autocompletar fechas desde curso
      fechaInicio: curso?.fechaInicio || data.fechaInicio,
      fechaFin: curso?.fechaFin || data.fechaFin,
      documentos: documentosRequeridos,
      createdAt: now,
      updatedAt: now,
    };

    mockMatriculas.push(newMatricula);
    
    // Actualizar curso con la nueva matrícula
    if (curso) {
      curso.matriculasIds.push(newMatricula.id);
    }

    // Log de auditoría
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'matricula',
      entidadId: newMatricula.id,
      accion: 'crear',
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return newMatricula;
  },

  async update(id: string, data: Partial<MatriculaFormData>): Promise<Matricula> {
    await delay(800);

    const index = mockMatriculas.findIndex(m => m.id === id);
    if (index === -1) {
      throw new ApiError('Matrícula no encontrada', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    const valorAnterior = { ...mockMatriculas[index] };

    mockMatriculas[index] = {
      ...mockMatriculas[index],
      ...data,
      updatedAt: now,
    };

    // Log de auditoría
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'matricula',
      entidadId: id,
      accion: 'editar',
      camposModificados: Object.keys(data),
      valorAnterior,
      valorNuevo: data,
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockMatriculas[index];
  },

  async updateDocumento(
    matriculaId: string,
    documentoId: string,
    data: Partial<DocumentoRequerido>
  ): Promise<Matricula> {
    await delay(600);

    const index = mockMatriculas.findIndex(m => m.id === matriculaId);
    if (index === -1) {
      throw new ApiError('Matrícula no encontrada', 404, 'NOT_FOUND');
    }

    const docIndex = mockMatriculas[index].documentos.findIndex(d => d.id === documentoId);
    if (docIndex === -1) {
      throw new ApiError('Documento no encontrado', 404, 'DOCUMENTO_NOT_FOUND');
    }

    mockMatriculas[index].documentos[docIndex] = {
      ...mockMatriculas[index].documentos[docIndex],
      ...data,
    };
    mockMatriculas[index].updatedAt = new Date().toISOString();

    return mockMatriculas[index];
  },

  async capturarFirma(id: string, firmaBase64: string): Promise<Matricula> {
    await delay(800);

    const index = mockMatriculas.findIndex(m => m.id === id);
    if (index === -1) {
      throw new ApiError('Matrícula no encontrada', 404, 'NOT_FOUND');
    }

    mockMatriculas[index] = {
      ...mockMatriculas[index],
      firmaCapturada: true,
      firmaBase64,
      updatedAt: new Date().toISOString(),
    };

    return mockMatriculas[index];
  },

  async registrarPago(id: string, facturaNumero: string): Promise<Matricula> {
    await delay(800);

    const index = mockMatriculas.findIndex(m => m.id === id);
    if (index === -1) {
      throw new ApiError('Matrícula no encontrada', 404, 'NOT_FOUND');
    }

    mockMatriculas[index] = {
      ...mockMatriculas[index],
      pagado: true,
      facturaNumero,
      fechaPago: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    return mockMatriculas[index];
  },

  async cambiarEstado(id: string, nuevoEstado: EstadoMatricula): Promise<Matricula> {
    await delay(600);

    const index = mockMatriculas.findIndex(m => m.id === id);
    if (index === -1) {
      throw new ApiError('Matrícula no encontrada', 404, 'NOT_FOUND');
    }

    const now = new Date().toISOString();
    const estadoAnterior = mockMatriculas[index].estado;

    mockMatriculas[index] = {
      ...mockMatriculas[index],
      estado: nuevoEstado,
      updatedAt: now,
    };

    // Log de auditoría
    mockAuditLogs.push({
      id: uuid(),
      entidadTipo: 'matricula',
      entidadId: id,
      accion: 'editar',
      camposModificados: ['estado'],
      valorAnterior: { estado: estadoAnterior },
      valorNuevo: { estado: nuevoEstado },
      usuarioId: 'current_user',
      usuarioNombre: 'Usuario Actual',
      timestamp: now,
    });

    return mockMatriculas[index];
  },

  async delete(id: string): Promise<void> {
    await delay(600);

    const index = mockMatriculas.findIndex(m => m.id === id);
    if (index === -1) {
      throw new ApiError('Matrícula no encontrada', 404, 'NOT_FOUND');
    }

    // Remover del curso
    const cursoId = mockMatriculas[index].cursoId;
    const curso = mockCursos.find(c => c.id === cursoId);
    if (curso) {
      curso.matriculasIds = curso.matriculasIds.filter(mId => mId !== id);
    }

    mockMatriculas.splice(index, 1);
  },
};
