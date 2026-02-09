import { delay } from './api';

const DRIVE_BASE_URL = 'https://drive.google.com/file/d';

export const driveService = {
  /**
   * Simula la subida de un documento individual a Google Drive.
   * Genera URL ficticia con estructura: AÑO/ID_CURSO/NOMBRE_CEDULA/ARCHIVO
   */
  async uploadDocumento(
    matriculaId: string,
    documentoTipo: string,
    _archivo: File,
    metadata?: {
      cursoId?: string;
      personaNombre?: string;
      personaCedula?: string;
    }
  ): Promise<string> {
    await delay(1200);

    const year = new Date().getFullYear();
    const cursoId = metadata?.cursoId || 'SIN_CURSO';
    const personaFolder = metadata?.personaNombre && metadata?.personaCedula
      ? `${metadata.personaNombre.replace(/\s+/g, '_').toUpperCase()}_${metadata.personaCedula}`
      : matriculaId;

    const fakeId = Math.random().toString(36).substring(2, 15);
    const url = `${DRIVE_BASE_URL}/${year}/${cursoId}/${personaFolder}/${documentoTipo}_${fakeId}`;

    return url;
  },

  /**
   * Simula la subida de un PDF consolidado que contiene múltiples documentos.
   */
  async uploadConsolidado(
    matriculaId: string,
    _archivo: File,
    tiposIncluidos: string[],
    metadata?: {
      cursoId?: string;
      personaNombre?: string;
      personaCedula?: string;
    }
  ): Promise<{ url: string; tiposIncluidos: string[] }> {
    await delay(1500);

    const year = new Date().getFullYear();
    const cursoId = metadata?.cursoId || 'SIN_CURSO';
    const personaFolder = metadata?.personaNombre && metadata?.personaCedula
      ? `${metadata.personaNombre.replace(/\s+/g, '_').toUpperCase()}_${metadata.personaCedula}`
      : matriculaId;

    const fakeId = Math.random().toString(36).substring(2, 15);
    const url = `${DRIVE_BASE_URL}/${year}/${cursoId}/${personaFolder}/CONSOLIDADO_${fakeId}`;

    return { url, tiposIncluidos };
  },
};
