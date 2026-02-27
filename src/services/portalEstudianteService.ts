import { mockMatriculas, mockCursos, mockPersonas } from '@/data/mockData';
import { portalDocumentosCatalogo } from '@/data/portalAdminConfig';
import { DocumentoPortalConfig, DocumentoPortalEstado, PortalEstudianteData } from '@/types/portalEstudiante';
import { Matricula } from '@/types/matricula';
import { Persona } from '@/types/persona';
import { Curso } from '@/types/curso';
import { FormatoFormacion } from '@/types/formatoFormacion';
import { delay } from './api';
import { formatoFormacionService } from './formatoFormacionService';

export interface MatriculaVigenteResult {
  matricula: Matricula;
  persona: Persona;
  curso: Curso;
}

export const portalEstudianteService = {
  async buscarMatriculaVigente(cedula: string): Promise<MatriculaVigenteResult | null> {
    await delay(800);

    const persona = mockPersonas.find(p => p.numeroDocumento === cedula);
    if (!persona) return null;

    const hoy = new Date().toISOString().split('T')[0];

    // Buscar matrículas de esta persona con curso vigente
    const candidatas = mockMatriculas
      .filter(m => m.personaId === persona.id)
      .map(m => {
        const curso = mockCursos.find(c => c.id === m.cursoId);
        return { matricula: m, curso };
      })
      .filter(({ curso }) => {
        if (!curso) return false;
        if (curso.estado === 'cerrado') return false;
        if (curso.fechaFin && curso.fechaFin < hoy) return false;
        return true;
      })
      .sort((a, b) => {
        // Desempate: curso.fechaInicio más reciente
        const fa = a.curso!.fechaInicio || '';
        const fb = b.curso!.fechaInicio || '';
        return fb.localeCompare(fa);
      });

    if (candidatas.length === 0) return null;

    const { matricula, curso } = candidatas[0];

    // Filter docs by curso's tipoFormacion
    const docsForNivel = portalDocumentosCatalogo
      .filter(d => d.habilitadoPorNivel[curso!.tipoFormacion])
      .sort((a, b) => a.orden - b.orden);

    // Inicializar portalEstudiante si no existe
    if (!matricula.portalEstudiante) {
      matricula.portalEstudiante = {
        habilitado: true,
        documentos: docsForNivel.map(doc => ({
          key: doc.key,
          estado: 'pendiente' as const,
        })),
      };
    }

    return { matricula, persona, curso: curso! };
  },

  async getPortalConfig(tipoFormacion?: string): Promise<DocumentoPortalConfig[]> {
    await delay(300);
    let docs = portalDocumentosCatalogo.map(({ habilitadoPorNivel, ...rest }) => rest);
    if (tipoFormacion) {
      const full = portalDocumentosCatalogo.filter(d => d.habilitadoPorNivel[tipoFormacion as keyof typeof d.habilitadoPorNivel]);
      docs = full.map(({ habilitadoPorNivel, ...rest }) => rest);
    }
    return docs.sort((a, b) => a.orden - b.orden);
  },

  async getDocumentosEstado(matriculaId: string): Promise<{
    config: DocumentoPortalConfig[];
    estados: DocumentoPortalEstado[];
  }> {
    await delay(500);

    const matricula = mockMatriculas.find(m => m.id === matriculaId);
    if (!matricula) throw new Error('Matrícula no encontrada');

    const portalData: PortalEstudianteData = matricula.portalEstudiante || {
      habilitado: true,
      documentos: [],
    };

    // Get config filtered by curso nivel
    const curso = mockCursos.find(c => c.id === matricula.cursoId);
    const config = portalDocumentosCatalogo
      .filter(d => !curso || d.habilitadoPorNivel[curso.tipoFormacion])
      .map(({ habilitadoPorNivel, ...rest }) => rest)
      .sort((a, b) => a.orden - b.orden);

    // Calcular estados con dependencias
    const estados: DocumentoPortalEstado[] = config.map(docConfig => {
      const existente = portalData.documentos.find(d => d.key === docConfig.key);

      // Si ya fue completado, respetar
      if (existente?.estado === 'completado') {
        return existente;
      }

      // Verificar dependencias
      const dependenciasCumplidas = docConfig.dependeDe.every(depKey => {
        const dep = portalData.documentos.find(d => d.key === depKey);
        return dep?.estado === 'completado';
      });

      if (!dependenciasCumplidas) {
        return { key: docConfig.key, estado: 'bloqueado' as const };
      }

      return existente || { key: docConfig.key, estado: 'pendiente' as const };
    });

    return { config, estados };
  },

  async enviarDocumento(
    matriculaId: string,
    documentoKey: string,
    payload: Partial<DocumentoPortalEstado>
  ): Promise<DocumentoPortalEstado> {
    await delay(800);

    const index = mockMatriculas.findIndex(m => m.id === matriculaId);
    if (index === -1) throw new Error('Matrícula no encontrada');

    const matricula = mockMatriculas[index];

    if (!matricula.portalEstudiante) {
      matricula.portalEstudiante = {
        habilitado: true,
        documentos: [],
      };
    }

    const now = new Date().toISOString();

    // Determine estado for evaluaciones based on aprobado
    let finalEstado: 'completado' | 'pendiente' = 'completado';
    if (documentoKey === 'evaluacion' && payload.metadata && (payload.metadata as any).aprobado === false) {
      finalEstado = 'pendiente';
    }

    const docIndex = matricula.portalEstudiante.documentos.findIndex(
      d => d.key === documentoKey
    );

    // Accumulate previous attempts for evaluacion
    let intentosPrevios: DocumentoPortalEstado[] = [];
    if (documentoKey === 'evaluacion' && docIndex >= 0) {
      const prev = matricula.portalEstudiante.documentos[docIndex];
      intentosPrevios = [...(prev.intentos || []), { ...prev, intentos: undefined }];
    }

    const nuevoEstado: DocumentoPortalEstado = {
      key: documentoKey,
      estado: finalEstado,
      enviadoEn: now,
      ...payload,
      ...(documentoKey === 'evaluacion' && intentosPrevios.length > 0 ? { intentos: intentosPrevios } : {}),
    };

    if (docIndex >= 0) {
      matricula.portalEstudiante.documentos[docIndex] = nuevoEstado;
    } else {
      matricula.portalEstudiante.documentos.push(nuevoEstado);
    }

    mockMatriculas[index] = { ...matricula, updatedAt: now };

    return nuevoEstado;
  },

  async getInfoAprendizData(matriculaId: string): Promise<{
    persona: Persona;
    matricula: Matricula;
    curso: Curso;
  }> {
    await delay(500);

    const matricula = mockMatriculas.find(m => m.id === matriculaId);
    if (!matricula) throw new Error('Matrícula no encontrada');

    const persona = mockPersonas.find(p => p.id === matricula.personaId);
    if (!persona) throw new Error('Persona no encontrada');

    const curso = mockCursos.find(c => c.id === matricula.cursoId);
    if (!curso) throw new Error('Curso no encontrado');

    return { persona, matricula, curso };
  },

  async getEvaluacionFormato(matriculaId: string): Promise<{
    formato: FormatoFormacion;
    persona: Persona;
    matricula: Matricula;
    curso: Curso;
  } | null> {
    await delay(500);

    const matricula = mockMatriculas.find(m => m.id === matriculaId);
    if (!matricula) return null;

    const curso = mockCursos.find(c => c.id === matricula.cursoId);
    if (!curso) return null;

    const persona = mockPersonas.find(p => p.id === matricula.personaId);
    if (!persona) return null;

    // Buscar formato con bloques evaluation_quiz cuyo tipoCursoKeys incluya el tipo del curso
    const allFormatos = await formatoFormacionService.getAll();
    const formato = allFormatos.find(f =>
      f.activo &&
      f.tipoCursoKeys.includes(curso.tipoFormacion) &&
      f.bloques.some(bl => bl.type === 'evaluation_quiz')
    );

    if (!formato) return null;

    return { formato, persona, matricula, curso };
  },
};
