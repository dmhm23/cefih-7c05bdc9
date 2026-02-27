import { mockMatriculas, mockCursos, mockPersonas } from '@/data/mockData';
import { PORTAL_DOCUMENTOS_CONFIG } from '@/data/portalEstudianteConfig';
import { DocumentoPortalConfig, DocumentoPortalEstado, PortalEstudianteData } from '@/types/portalEstudiante';
import { Matricula } from '@/types/matricula';
import { Persona } from '@/types/persona';
import { Curso } from '@/types/curso';
import { delay } from './api';

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

    // Inicializar portalEstudiante si no existe
    if (!matricula.portalEstudiante) {
      matricula.portalEstudiante = {
        habilitado: true,
        documentos: PORTAL_DOCUMENTOS_CONFIG.map(doc => ({
          key: doc.key,
          estado: 'pendiente' as const,
        })),
      };
    }

    return { matricula, persona, curso: curso! };
  },

  async getPortalConfig(): Promise<DocumentoPortalConfig[]> {
    await delay(300);
    return [...PORTAL_DOCUMENTOS_CONFIG];
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

    const config = PORTAL_DOCUMENTOS_CONFIG;

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
    const nuevoEstado: DocumentoPortalEstado = {
      key: documentoKey,
      estado: 'completado',
      enviadoEn: now,
      ...payload,
    };

    const docIndex = matricula.portalEstudiante.documentos.findIndex(
      d => d.key === documentoKey
    );

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
};
