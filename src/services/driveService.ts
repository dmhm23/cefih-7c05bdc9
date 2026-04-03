import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'documentos-matricula';

export const driveService = {
  /**
   * Sube un documento individual a Supabase Storage.
   * Estructura: AÑO/CURSO_ID/PERSONA_CEDULA/TIPO_TIMESTAMP
   */
  async uploadDocumento(
    matriculaId: string,
    documentoTipo: string,
    archivo: File,
    metadata?: {
      cursoId?: string;
      personaNombre?: string;
      personaCedula?: string;
    }
  ): Promise<string> {
    const year = new Date().getFullYear();
    const cursoId = metadata?.cursoId || 'SIN_CURSO';
    const personaFolder = metadata?.personaCedula
      ? `${metadata.personaCedula}`
      : matriculaId;

    const ext = archivo.name.split('.').pop() || 'bin';
    const ts = Date.now();
    const path = `${year}/${cursoId}/${personaFolder}/${documentoTipo}_${ts}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, archivo, { upsert: true });

    if (error) throw new Error('Error al subir documento: ' + error.message);

    return path;
  },

  /**
   * Sube un PDF consolidado que contiene múltiples documentos.
   */
  async uploadConsolidado(
    matriculaId: string,
    archivo: File,
    tiposIncluidos: string[],
    metadata?: {
      cursoId?: string;
      personaNombre?: string;
      personaCedula?: string;
    }
  ): Promise<{ storagePath: string; tiposIncluidos: string[] }> {
    const year = new Date().getFullYear();
    const cursoId = metadata?.cursoId || 'SIN_CURSO';
    const personaFolder = metadata?.personaCedula
      ? `${metadata.personaCedula}`
      : matriculaId;

    const ts = Date.now();
    const path = `${year}/${cursoId}/${personaFolder}/CONSOLIDADO_${ts}.pdf`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, archivo, { upsert: true });

    if (error) throw new Error('Error al subir consolidado: ' + error.message);

    return { storagePath: path, tiposIncluidos };
  },

  /**
   * Obtiene la URL pública (signed) de un archivo en storage.
   */
  async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, expiresIn);

    if (error) throw new Error('Error al obtener URL: ' + error.message);
    return data.signedUrl;
  },

  /**
   * Elimina un archivo del storage.
   */
  async deleteFile(storagePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (error) throw new Error('Error al eliminar archivo: ' + error.message);
  },
};
