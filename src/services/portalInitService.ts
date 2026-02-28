import { portalDocumentosCatalogo } from '@/data/portalAdminConfig';
import { Matricula } from '@/types/matricula';
import { Curso } from '@/types/curso';
import { PortalEstudianteData, DocumentoPortalEstado } from '@/types/portalEstudiante';

/**
 * Initializes portalEstudiante for a matricula based on the course's tipoFormacion.
 * Idempotent: does nothing if already initialized.
 */
export function initPortalEstudiante(matricula: Matricula, curso: Curso): void {
  if (matricula.portalEstudiante) return;

  const docsForNivel = portalDocumentosCatalogo
    .filter(d => d.habilitadoPorNivel[curso.tipoFormacion])
    .sort((a, b) => a.orden - b.orden);

  const documentos: DocumentoPortalEstado[] = docsForNivel.map(doc => ({
    key: doc.key,
    estado: 'pendiente' as const,
  }));

  matricula.portalEstudiante = {
    habilitado: true,
    documentos,
  };
}
