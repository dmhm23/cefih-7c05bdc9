import { mockMatriculas } from '@/data/mockData';

export async function togglePortalMatricula(matriculaId: string, habilitado: boolean): Promise<void> {
  await new Promise((r) => setTimeout(r, 150));
  const mat = mockMatriculas.find((m) => m.id === matriculaId);
  if (!mat) throw new Error('Matrícula no encontrada');

  if (!mat.portalEstudiante) {
    (mat as any).portalEstudiante = { habilitado, documentos: [] };
  } else {
    mat.portalEstudiante.habilitado = habilitado;
  }
}

export async function resetDocumentoMatricula(matriculaId: string, documentoKey: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 150));
  const mat = mockMatriculas.find((m) => m.id === matriculaId);
  if (!mat?.portalEstudiante) throw new Error('Portal no configurado');

  const doc = mat.portalEstudiante.documentos.find((d) => d.key === documentoKey);
  if (!doc) throw new Error('Documento no encontrado');
  if (doc.estado !== 'completado') throw new Error('Solo se pueden reabrir documentos completados');

  doc.estado = 'pendiente';
  delete doc.enviadoEn;
  delete doc.puntaje;
  delete doc.firmaBase64;
  delete doc.firmaFecha;
}
